"""Garmin Connect Cloud Functions for TDEE integration."""

import base64
import json
import logging
from firebase_functions import https_fn, scheduler_fn
from firebase_admin import initialize_app, auth, firestore
from garminconnect import Garmin
from garth.sso import login as garth_login
from google.cloud.firestore_v1 import SERVER_TIMESTAMP

logger = logging.getLogger(__name__)

initialize_app()


def _is_rate_limited(error: Exception) -> bool:
    """Check if the error is a Garmin 429 rate limit."""
    error_str = str(error).lower()
    return "429" in error_str or "too many" in error_str


def _load_garmin_client(db, uid: str, function_name: str):
    """Load Garmin client from stored tokens. Returns (client, error_dict).

    IMPORTANT: Never delete tokens here — only garmin_disconnect should delete.
    garth.dumps() is unreliable after login(tokenstore=...), so tokens can't
    be refreshed. Deleting them forces re-authentication which is painful
    (MFA, rate limits). Instead, keep the original tokens and return an error.
    """
    token_doc = db.collection("garminTokens").document(uid).get()
    if not token_doc.exists:
        return None, {"error": "NOT_CONNECTED"}

    token_data = token_doc.to_dict().get("oauthTokens")
    if not token_data:
        logger.error(f"{function_name}: no oauthTokens field in document")
        return None, {"error": "TOKEN_INVALID"}

    # Pre-validate: ensure stored tokens are valid base64-encoded JSON
    if not _validate_token_data(token_data):
        logger.error(f"{function_name}: stored tokens are invalid ({len(token_data)} bytes, preview: {repr(token_data[:80])})")
        return None, {"error": "TOKEN_INVALID"}

    try:
        client = Garmin()
        client.login(tokenstore=token_data)
        return client, None
    except Exception as e:
        if _is_rate_limited(e):
            logger.error(f"{function_name}: rate limited during token refresh: {e}")
            return None, {"error": "RATE_LIMITED"}
        logger.error(f"{function_name}: login failed (tokens preserved): {type(e).__name__}: {e}")
        return None, {"error": "TOKEN_EXPIRED"}


def _validate_token_data(token_data: str) -> bool:
    """Validate that token data from garth.dumps() is a valid base64-encoded JSON array.

    garth.dumps() returns base64(json([oauth1_dict, oauth2_dict])), NOT raw JSON.
    """
    if not token_data or len(token_data) < 10:
        return False
    try:
        decoded = base64.b64decode(token_data)
        parsed = json.loads(decoded)
        return isinstance(parsed, list) and len(parsed) == 2
    except Exception:
        return False


def _save_refreshed_tokens(db, uid: str, client):
    """Save potentially refreshed tokens back to Firestore.

    garth.dumps() returns base64-encoded JSON (not raw JSON).
    We validate by decoding base64 → parsing JSON before saving.
    """
    try:
        updated_token_data = client.garth.dumps()
        if not _validate_token_data(updated_token_data):
            logger.warning(f"garth.dumps() returned invalid data ({len(updated_token_data or '')} bytes) — skipping token save")
            return
        db.collection("garminTokens").document(uid).update({
            "oauthTokens": updated_token_data,
            "lastSyncAt": SERVER_TIMESTAMP,
        })
    except Exception as e:
        logger.warning(f"Failed to save refreshed tokens: {e}")


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
        if _is_rate_limited(e):
            return {"error": "RATE_LIMITED"}
        return {"error": "INVALID_CREDENTIALS"}

    # Serialize OAuth tokens via garth (base64-encoded JSON)
    token_data = client.garth.dumps()

    if not _validate_token_data(token_data):
        logger.error(f"garmin_connect: token serialization failed ({len(token_data or '')} bytes)")
        return {"error": "INVALID_CREDENTIALS"}

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
    client, error = _load_garmin_client(db, uid, "garmin_daily_summary")
    if error:
        return error

    # Fetch daily summary
    try:
        summary = client.get_user_summary(date_str)
    except Exception as e:
        if _is_rate_limited(e):
            return {"error": "RATE_LIMITED"}
        logger.error(f"garmin_daily_summary: API error: {type(e).__name__}: {e}")
        return {"error": "GARMIN_UNAVAILABLE"}

    total_calories = summary.get("totalKilocalories", 0)
    active_calories = summary.get("activeKilocalories", 0)
    bmr_calories = summary.get("bmrKilocalories", 0)

    # Plausibility check
    if total_calories < 500:
        return {"error": "IMPLAUSIBLE_VALUE"}

    _save_refreshed_tokens(db, uid, client)

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
def garmin_activities(req: https_fn.CallableRequest) -> dict:
    """Fetch activities for a given date from Garmin Connect."""
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
    client, error = _load_garmin_client(db, uid, "garmin_activities")
    if error:
        return error

    # Fetch activities for the given date
    try:
        raw_activities = client.get_activities_by_date(
            startdate=date_str,
            enddate=date_str,
        )
    except Exception as e:
        if _is_rate_limited(e):
            return {"error": "RATE_LIMITED"}
        logger.error(f"garmin_activities: API error: {type(e).__name__}: {e}")
        return {"error": "GARMIN_UNAVAILABLE"}

    _save_refreshed_tokens(db, uid, client)

    activities = []
    if raw_activities:
        for activity in raw_activities:
            activity_id = activity.get("activityId")
            if not activity_id:
                continue
            activities.append({
                "activityId": str(activity_id),
                "activityName": activity.get("activityName", "Aktivität"),
                "calories": int(activity.get("calories") or 0),
                "movingDuration": int(activity.get("duration") or 0),
                "manufacturer": activity.get("manufacturer", ""),
            })

    logger.info(f"garmin_activities: found {len(activities)} activities for {date_str}")

    return {"activities": activities}


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
        "sportSyncSource": firestore.DELETE_FIELD,
    }, merge=True)

    return {"success": True}


@scheduler_fn.on_schedule(schedule="every 6 hours")
def garmin_refresh_tokens(event: scheduler_fn.ScheduledEvent) -> None:
    """Proactively refresh Garmin OAuth tokens to prevent overnight expiration.

    Runs every 6 hours. Loads each user's tokens, logs in (which triggers
    garth's automatic token refresh), and saves the refreshed tokens back.
    """
    db = firestore.client()
    token_docs = db.collection("garminTokens").stream()

    for doc in token_docs:
        uid = doc.id
        try:
            client, error = _load_garmin_client(db, uid, "garmin_refresh_tokens")
            if error:
                logger.warning(f"garmin_refresh_tokens: uid={uid} — {error}")
                continue

            _save_refreshed_tokens(db, uid, client)
            logger.info(f"garmin_refresh_tokens: uid={uid} — tokens refreshed")
        except Exception as e:
            logger.error(f"garmin_refresh_tokens: uid={uid} — {type(e).__name__}: {e}")
