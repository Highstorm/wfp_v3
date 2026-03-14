"""Garmin Connect Cloud Functions for TDEE integration."""

import json
import logging
from firebase_functions import https_fn
from firebase_admin import initialize_app, auth, firestore
from garminconnect import Garmin
from garth.sso import login as garth_login
from google.cloud.firestore_v1 import SERVER_TIMESTAMP

logger = logging.getLogger(__name__)

initialize_app()


@https_fn.on_call()
def garmin_connect(req: https_fn.CallableRequest) -> dict:
    """Authenticate with Garmin Connect and store OAuth tokens."""
    if req.auth is None:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
            message="Authentication required.",
        )

    uid = req.auth.uid
    garmin_email = req.data.get("garminEmail")
    garmin_password = req.data.get("garminPassword")
    mfa_code = req.data.get("mfaCode")

    if not garmin_email or not garmin_password:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
            message="garminEmail and garminPassword are required.",
        )

    try:
        if mfa_code:
            logger.info("garmin_connect: attempting login with MFA code")
            client = Garmin(garmin_email, garmin_password, prompt_mfa=lambda: mfa_code)
            client.login()
            logger.info("garmin_connect: MFA login successful")
        else:
            logger.info("garmin_connect: probing login via garth (prompt_mfa=None)")
            result = garth_login(garmin_email, garmin_password, prompt_mfa=None)
            logger.info(f"garmin_connect: garth_login returned type={type(result).__name__}, value={result}")
            if isinstance(result, dict) and result.get("needs_mfa"):
                logger.info("garmin_connect: MFA required, returning MFA_REQUIRED")
                return {"error": "MFA_REQUIRED"}
            # No MFA needed — set tokens on client
            client = Garmin()
            client.garth.oauth1_token, client.garth.oauth2_token = result
            logger.info("garmin_connect: login successful without MFA")
    except Exception as e:
        logger.error(f"garmin_connect: exception during login: {type(e).__name__}: {e}")
        return {"error": "INVALID_CREDENTIALS"}

    # Serialize OAuth tokens via garth
    token_data = client.garth.dumps()

    db = firestore.client()

    # Store tokens in garminTokens/{uid}
    db.collection("garminTokens").document(uid).set({
        "oauthTokens": token_data,
        "connectedAt": SERVER_TIMESTAMP,
        "lastSyncAt": SERVER_TIMESTAMP,
    })

    # Resolve email from Firebase Auth
    user_record = auth.get_user(uid)
    email = user_record.email

    # Update profile (including connectedAt for UI display)
    db.collection("profiles").document(email).set({
        "garminConnected": True,
        "garminConnectedAt": SERVER_TIMESTAMP,
    }, merge=True)

    return {"success": True}


@https_fn.on_call()
def garmin_daily_summary(req: https_fn.CallableRequest) -> dict:
    """Fetch daily calorie summary from Garmin Connect."""
    if req.auth is None:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
            message="Authentication required.",
        )

    uid = req.auth.uid
    date_str = req.data.get("date")

    if not date_str:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
            message="date is required (YYYY-MM-DD).",
        )

    db = firestore.client()

    # Read tokens
    token_doc = db.collection("garminTokens").document(uid).get()
    if not token_doc.exists:
        return {"error": "NOT_CONNECTED"}

    token_data = token_doc.to_dict()["oauthTokens"]

    # Initialize Garmin client with saved tokens
    try:
        client = Garmin()
        client.login(tokenstore=token_data)
    except Exception as e:
        logger.error(f"garmin_daily_summary: token error: {type(e).__name__}: {e}")
        return {"error": "TOKEN_EXPIRED"}

    # Fetch daily summary
    try:
        summary = client.get_user_summary(date_str)
    except Exception as e:
        logger.error(f"garmin_daily_summary: API error: {type(e).__name__}: {e}")
        return {"error": "GARMIN_UNAVAILABLE"}

    # Log all calorie-related fields for debugging
    calorie_fields = {k: v for k, v in summary.items() if "alori" in k.lower()}
    logger.info(f"garmin_daily_summary: calorie fields: {calorie_fields}")

    total_calories = summary.get("totalKilocalories", 0)
    active_calories = summary.get("activeKilocalories", 0)
    bmr_calories = summary.get("bmrKilocalories", 0)

    # Plausibility check
    if total_calories < 500:
        return {"error": "IMPLAUSIBLE_VALUE"}

    # Update tokens (may have been refreshed)
    updated_token_data = client.garth.dumps()
    db.collection("garminTokens").document(uid).update({
        "oauthTokens": updated_token_data,
        "lastSyncAt": SERVER_TIMESTAMP,
    })

    # Resolve email and update profile
    user_record = auth.get_user(uid)
    email = user_record.email

    db.collection("profiles").document(email).update({
        f"garminDailySummaries.{date_str}": {
            "totalCalories": total_calories,
            "activeCalories": active_calories,
            "bmrCalories": bmr_calories,
            "syncedAt": SERVER_TIMESTAMP,
        },
    })

    return {
        "totalCalories": total_calories,
        "activeCalories": active_calories,
        "bmrCalories": bmr_calories,
    }


@https_fn.on_call()
def garmin_disconnect(req: https_fn.CallableRequest) -> dict:
    """Disconnect Garmin Connect and delete stored tokens."""
    if req.auth is None:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
            message="Authentication required.",
        )

    uid = req.auth.uid
    db = firestore.client()

    # Delete tokens
    db.collection("garminTokens").document(uid).delete()

    # Resolve email and update profile
    user_record = auth.get_user(uid)
    email = user_record.email

    db.collection("profiles").document(email).set({
        "garminConnected": False,
        "garminConnectedAt": firestore.DELETE_FIELD,
        "useGarminTargetCalories": False,
        "garminDailySummaries": firestore.DELETE_FIELD,
    }, merge=True)

    return {"success": True}
