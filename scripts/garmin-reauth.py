#!/usr/bin/env python3
"""
Local Garmin re-authentication script.
Generates fresh OAuth tokens locally (bypassing Cloud Function IP blocks)
and stores them directly in Firestore.

Usage:
  cd functions && source venv/bin/activate && cd ..
  python3 scripts/garmin-reauth.py YOUR_GARMIN_EMAIL YOUR_GARMIN_PASSWORD [MFA_CODE]
"""

import sys
import base64
import json
import os

# Add functions dir to path for firebase_admin
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'functions'))

import garth
import firebase_admin
from firebase_admin import firestore, auth as fb_auth

def main():
    if len(sys.argv) < 3:
        print("Usage: python3 scripts/garmin-reauth.py EMAIL PASSWORD [MFA_CODE]")
        sys.exit(1)

    email = sys.argv[1]
    password = sys.argv[2]
    mfa_code = sys.argv[3] if len(sys.argv) > 3 else None

    print(f"Versuche lokalen Garmin-Login für {email}...")

    try:
        if mfa_code:
            garth.login(email, password, prompt_mfa=lambda: mfa_code)
        else:
            garth.login(email, password)
        print("Login erfolgreich!")
    except Exception as e:
        print(f"Login fehlgeschlagen: {type(e).__name__}: {e}")
        if "MFA" in str(e) or "mfa" in str(e):
            print("MFA erforderlich — bitte Code als dritten Parameter übergeben.")
        sys.exit(1)

    # Serialize and validate tokens (garth.dumps() returns base64-encoded JSON)
    tokens = garth.client.dumps()
    decoded = json.loads(base64.b64decode(tokens))
    assert isinstance(decoded, list) and len(decoded) == 2, "Token format invalid"
    print(f"Tokens generiert ({len(tokens)} Bytes)")

    # Initialize Firebase Admin
    os.environ.setdefault("GCLOUD_PROJECT", "wfp-weekly-food-planner")
    if not firebase_admin._apps:
        firebase_admin.initialize_app(options={"projectId": "wfp-weekly-food-planner"})

    db = firestore.client()

    # Find UID from Firebase Auth by email
    try:
        user = fb_auth.get_user_by_email(email)
        uid = user.uid
        print(f"Firebase UID für {email}: {uid}")
    except Exception as e:
        print(f"Konnte UID nicht finden: {e}")
        # Fallback: check existing garminTokens
        garmin_tokens = list(db.collection("garminTokens").limit(10).get())
        if garmin_tokens:
            uid = garmin_tokens[0].id
            print(f"Fallback: verwende vorhandenen Token-Eintrag {uid}")
        else:
            print("Keine garminTokens gefunden und UID nicht ermittelbar.")
            sys.exit(1)

    # Create or update token document
    db.collection("garminTokens").document(uid).set({
        "oauthTokens": tokens,
        "connectedAt": firestore.SERVER_TIMESTAMP,
        "lastSyncAt": firestore.SERVER_TIMESTAMP,
    })

    # Update profile
    db.collection("profiles").document(email).set({
        "garminConnected": True,
        "garminConnectedAt": firestore.SERVER_TIMESTAMP,
    }, merge=True)

    print("Tokens erfolgreich in Firestore gespeichert!")
    print("\nDu kannst jetzt in der App synchronisieren.")

if __name__ == "__main__":
    main()
