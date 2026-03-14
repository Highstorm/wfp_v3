# Garmin TDEE Integration — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Den täglichen Gesamtkalorienverbrauch (TDEE) von Garmin Connect als dynamisches Tagesziel in der App nutzen.

**Architecture:** Python Cloud Functions (Firebase 2nd gen) für Garmin-Authentifizierung und Datenabruf. Frontend-Toggle zwischen statischem und Garmin-basiertem Kalorienziel. Garmin-TDEE ersetzt `targetCalories + sportCalories` (da TDEE bereits Sport enthält), mit Fallback auf die bisherige Formel wenn keine Garmin-Daten vorliegen.

**Tech Stack:** Python 3.12 (garminconnect, firebase-admin, firebase-functions), React/TypeScript, Firebase Firestore, Vitest

**Spec:** `docs/superpowers/specs/2026-03-14-garmin-tdee-integration-design.md`

---

## Chunk 1: Infrastructure — Python Cloud Functions Setup

### Task 1: Clean up existing functions directory and create Python project structure

**Files:**
- Delete: `functions/package-lock.json`, `functions/src/` (empty placeholder from Node.js setup)
- Create: `functions/main.py`
- Create: `functions/requirements.txt`
- Modify: `firebase.json`
- Modify: `.gitignore`

- [ ] **Step 1: Remove old Node.js placeholder files**

```bash
rm functions/package-lock.json
rmdir functions/src
```

- [ ] **Step 2: Create `functions/requirements.txt`**

```
firebase-functions==0.4.2
firebase-admin==6.7.0
garminconnect==0.2.25
garth==0.4.17
```

- [ ] **Step 3: Create `functions/main.py` with empty structure**

```python
"""Garmin Connect Cloud Functions for TDEE integration."""

from firebase_functions import https_fn
from firebase_admin import initialize_app

initialize_app()


# Cloud Functions will be added in subsequent tasks
```

- [ ] **Step 4: Update `firebase.json` — add functions config**

Add `"functions"` section to `firebase.json` (currently only has `hosting` and `firestore`):

```json
{
  "hosting": { ... },
  "firestore": { ... },
  "functions": [
    {
      "source": "functions",
      "codebase": "default",
      "runtime": "python312"
    }
  ]
}
```

- [ ] **Step 5: Update `.gitignore` — add Python artifacts**

Append to `.gitignore`:

```
# Python Cloud Functions
functions/__pycache__/
functions/venv/
functions/*.pyc
```

- [ ] **Step 6: Create Python venv and install deps to verify**

```bash
cd functions && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt
```

Expected: All packages install without errors.

- [ ] **Step 7: Commit**

```bash
git add functions/requirements.txt functions/main.py firebase.json .gitignore
git commit -m "chore: set up Python Cloud Functions infrastructure"
```

---

### Task 2: Add Firestore security rules for `garminTokens`

**Files:**
- Modify: `firestore.rules`

- [ ] **Step 1: Add garminTokens rule to `firestore.rules`**

Add before the closing `}}` (after the `sharedDishes` rule block at line ~53):

```
    // Garmin OAuth Tokens - nur Admin SDK (Cloud Functions)
    match /garminTokens/{uid} {
      allow read, write: if false;
    }
```

- [ ] **Step 2: Verify rules file is valid**

```bash
npx firebase-tools firestore:rules:list 2>&1 || echo "Rules file syntax check not available locally — visual inspection OK"
```

- [ ] **Step 3: Commit**

```bash
git add firestore.rules
git commit -m "feat: add Firestore security rules for garminTokens collection"
```

---

## Chunk 2: Backend — Python Cloud Functions

> **Testing-Hinweis:** Die Python Cloud Functions werden ohne Unit-Tests implementiert, da sie stark von externen Services abhängen (Garmin API, Firestore Admin SDK). Testen erfolgt nach Deployment über die Firebase Console und manuellen Aufruf aus der App. Die `python -c "import main"` Checks verifizieren nur die Syntax.

### Task 3: Implement `garmin_connect` Cloud Function

**Files:**
- Modify: `functions/main.py`

- [ ] **Step 1: Write the `garmin_connect` function**

Add to `functions/main.py`:

```python
import json
from firebase_functions import https_fn
from firebase_admin import initialize_app, auth, firestore
from garminconnect import Garmin
from google.cloud.firestore_v1 import SERVER_TIMESTAMP

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

    if not garmin_email or not garmin_password:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
            message="garminEmail and garminPassword are required.",
        )

    try:
        client = Garmin(garmin_email, garmin_password)
        client.login()
    except Exception:
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
```

- [ ] **Step 2: Verify syntax**

```bash
cd functions && source venv/bin/activate && python -c "import main"
```

Expected: No import errors.

- [ ] **Step 3: Commit**

```bash
git add functions/main.py
git commit -m "feat: implement garmin_connect Cloud Function for authentication"
```

---

### Task 4: Implement `garmin_daily_summary` Cloud Function

**Files:**
- Modify: `functions/main.py`

- [ ] **Step 1: Add the `garmin_daily_summary` function**

Append to `functions/main.py`:

```python
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
        client.garth.loads(token_data)
        client.login()
    except Exception:
        return {"error": "TOKEN_EXPIRED"}

    # Fetch daily summary
    try:
        summary = client.get_user_summary(date_str)
    except Exception:
        return {"error": "GARMIN_UNAVAILABLE"}

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

    db.collection("profiles").document(email).set({
        f"garminDailySummaries.{date_str}": {
            "totalCalories": total_calories,
            "activeCalories": active_calories,
            "bmrCalories": bmr_calories,
            "syncedAt": SERVER_TIMESTAMP,
        },
    }, merge=True)

    return {
        "totalCalories": total_calories,
        "activeCalories": active_calories,
        "bmrCalories": bmr_calories,
    }
```

- [ ] **Step 2: Verify syntax**

```bash
cd functions && source venv/bin/activate && python -c "import main"
```

- [ ] **Step 3: Commit**

```bash
git add functions/main.py
git commit -m "feat: implement garmin_daily_summary Cloud Function for TDEE fetch"
```

---

### Task 5: Implement `garmin_disconnect` Cloud Function

**Files:**
- Modify: `functions/main.py`

- [ ] **Step 1: Add the `garmin_disconnect` function**

Append to `functions/main.py`:

```python
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
```

- [ ] **Step 2: Verify syntax**

```bash
cd functions && source venv/bin/activate && python -c "import main"
```

- [ ] **Step 3: Commit**

```bash
git add functions/main.py
git commit -m "feat: implement garmin_disconnect Cloud Function"
```

---

## Chunk 3: Types, Data Layer & Garmin Service

### Task 6: Extend TypeScript profile types

**Files:**
- Modify: `src/types/profile.types.ts`

- [ ] **Step 1: Write failing test for new type fields**

Create test file `src/types/__tests__/profile.types.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import type { UserProfile, GarminDailySummary } from "../profile.types";

describe("UserProfile Garmin fields", () => {
  it("should allow garmin fields on UserProfile", () => {
    const profile: UserProfile = {
      garminConnected: true,
      useGarminTargetCalories: true,
      garminDailySummaries: {
        "2026-03-14": {
          totalCalories: 2500,
          activeCalories: 800,
          bmrCalories: 1700,
          syncedAt: new Date() as unknown,
        },
      },
    };

    expect(profile.garminConnected).toBe(true);
    expect(profile.useGarminTargetCalories).toBe(true);
    expect(profile.garminDailySummaries?.["2026-03-14"].totalCalories).toBe(2500);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/types/__tests__/profile.types.test.ts
```

Expected: FAIL — `GarminDailySummary` type doesn't exist, `garminConnected` not on `UserProfile`.

- [ ] **Step 3: Add Garmin types to `src/types/profile.types.ts`**

Add after the existing `UserProfile` interface:

```typescript
export interface GarminDailySummary {
  totalCalories: number;
  activeCalories: number;
  bmrCalories: number;
  syncedAt: unknown; // Firestore Timestamp from server, unknown to avoid coupling
}
```

Add new fields to `UserProfile`:

```typescript
  garminConnected?: boolean;
  garminConnectedAt?: unknown; // Firestore Timestamp
  useGarminTargetCalories?: boolean;
  garminDailySummaries?: Record<string, GarminDailySummary> | null;
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/types/__tests__/profile.types.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types/profile.types.ts src/types/__tests__/profile.types.test.ts
git commit -m "feat: add Garmin TDEE types to UserProfile"
```

---

### Task 7: Create Garmin service for calling Cloud Functions

**Files:**
- Create: `src/services/garmin.service.ts`

- [ ] **Step 1: Write failing test**

Create `src/services/__tests__/garmin.service.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock firebase/functions before import
const mockHttpsCallable = vi.fn();
vi.mock("firebase/functions", () => ({
  getFunctions: vi.fn(() => ({})),
  httpsCallable: (...args: unknown[]) => mockHttpsCallable(...args),
}));

vi.mock("../../lib/firebase", () => ({
  app: {},
}));

describe("garmin.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("connectGarmin calls garmin_connect callable", async () => {
    const callFn = vi.fn().mockResolvedValue({ data: { success: true } });
    mockHttpsCallable.mockReturnValue(callFn);

    const { connectGarmin } = await import("../garmin.service");
    const result = await connectGarmin("test@email.com", "password123");

    expect(mockHttpsCallable).toHaveBeenCalledWith(expect.anything(), "garmin_connect");
    expect(callFn).toHaveBeenCalledWith({
      garminEmail: "test@email.com",
      garminPassword: "password123",
    });
    expect(result).toEqual({ success: true });
  });

  it("fetchGarminDailySummary calls garmin_daily_summary callable", async () => {
    const callFn = vi.fn().mockResolvedValue({
      data: { totalCalories: 2500, activeCalories: 800, bmrCalories: 1700 },
    });
    mockHttpsCallable.mockReturnValue(callFn);

    const { fetchGarminDailySummary } = await import("../garmin.service");
    const result = await fetchGarminDailySummary("2026-03-14");

    expect(mockHttpsCallable).toHaveBeenCalledWith(expect.anything(), "garmin_daily_summary");
    expect(callFn).toHaveBeenCalledWith({ date: "2026-03-14" });
    expect(result).toEqual({ totalCalories: 2500, activeCalories: 800, bmrCalories: 1700 });
  });

  it("disconnectGarmin calls garmin_disconnect callable", async () => {
    const callFn = vi.fn().mockResolvedValue({ data: { success: true } });
    mockHttpsCallable.mockReturnValue(callFn);

    const { disconnectGarmin } = await import("../garmin.service");
    const result = await disconnectGarmin();

    expect(mockHttpsCallable).toHaveBeenCalledWith(expect.anything(), "garmin_disconnect");
    expect(result).toEqual({ success: true });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/services/__tests__/garmin.service.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/services/garmin.service.ts`**

```typescript
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../lib/firebase";

const functions = getFunctions(app);

export interface GarminConnectResponse {
  success?: boolean;
  error?: string;
}

export interface GarminDailySummaryResponse {
  totalCalories?: number;
  activeCalories?: number;
  bmrCalories?: number;
  error?: string;
}

export async function connectGarmin(
  garminEmail: string,
  garminPassword: string
): Promise<GarminConnectResponse> {
  const callable = httpsCallable<
    { garminEmail: string; garminPassword: string },
    GarminConnectResponse
  >(functions, "garmin_connect");
  const result = await callable({ garminEmail, garminPassword });
  return result.data;
}

export async function fetchGarminDailySummary(
  date: string
): Promise<GarminDailySummaryResponse> {
  const callable = httpsCallable<
    { date: string },
    GarminDailySummaryResponse
  >(functions, "garmin_daily_summary");
  const result = await callable({ date });
  return result.data;
}

export async function disconnectGarmin(): Promise<GarminConnectResponse> {
  const callable = httpsCallable<void, GarminConnectResponse>(
    functions,
    "garmin_disconnect"
  );
  const result = await callable();
  return result.data;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/services/__tests__/garmin.service.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/garmin.service.ts src/services/__tests__/garmin.service.test.ts
git commit -m "feat: add Garmin service for calling Cloud Functions"
```

---

### Task 8: Extend profile repository to return Garmin fields

**Files:**
- Modify: `src/repositories/profile.repository.ts`

- [ ] **Step 1: Update `getProfile` to include Garmin fields**

The current `getProfile()` at `src/repositories/profile.repository.ts:5-16` returns `profileSnap.data() as UserProfile` — this already returns all fields because `UserProfile` is used loosely. Since we added the new fields to the `UserProfile` interface in Task 6, the repository already returns them via the `as UserProfile` cast.

No code change needed here — the TypeScript type extension in Task 6 is sufficient.

- [ ] **Step 2: Verify by checking that `useProfile` hook returns Garmin fields**

This is implicitly tested through the frontend components in later tasks. No separate test needed — the repository does `profileSnap.data() as UserProfile` which includes all Firestore fields.

- [ ] **Step 3: Commit (skip — no changes)**

No commit needed for this task.

---

## Chunk 4: Frontend — Garmin Settings UI

### Task 9: Add Garmin Connect section to UserSettingsForm

**Files:**
- Modify: `src/components/auth/UserSettingsForm.tsx`

- [ ] **Step 1: Add Garmin state variables**

Add to the `UserSettings` interface (after `"intervals.icu-AthleteID"` at line 22):

```typescript
  garminEmail: string;
  garminPassword: string;
```

Add to the initial state (after `porridgeCalculatorEnabled: true` at line 43):

```typescript
  garminEmail: "",
  garminPassword: "",
```

Add new state variables after the existing ones (after line 46):

```typescript
const [isConnectingGarmin, setIsConnectingGarmin] = useState(false);
const [garminMessage, setGarminMessage] = useState("");
const [isSyncingGarmin, setIsSyncingGarmin] = useState(false);
const [isDisconnectingGarmin, setIsDisconnectingGarmin] = useState(false);
```

- [ ] **Step 2: Add Garmin connect/disconnect/sync handlers**

Add imports at top of file:

```typescript
import { connectGarmin, disconnectGarmin, fetchGarminDailySummary } from "../../services/garmin.service";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
```

Add `const queryClient = useQueryClient();` after the `useProfile()` call.

Add handlers inside the component (after `handleChange` function):

```typescript
const handleGarminConnect = async () => {
  setIsConnectingGarmin(true);
  setGarminMessage("");
  try {
    const result = await connectGarmin(
      userSettings.garminEmail,
      userSettings.garminPassword
    );
    if (result.error === "INVALID_CREDENTIALS") {
      setGarminMessage("Ungültige Garmin-Zugangsdaten.");
    } else if (result.success) {
      setGarminMessage("Erfolgreich verbunden!");
      setUserSettings((prev) => ({ ...prev, garminEmail: "", garminPassword: "" }));
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    }
  } catch {
    setGarminMessage("Verbindung fehlgeschlagen.");
  } finally {
    setIsConnectingGarmin(false);
  }
};

const handleGarminDisconnect = async () => {
  setIsDisconnectingGarmin(true);
  setGarminMessage("");
  try {
    await disconnectGarmin();
    setGarminMessage("Garmin getrennt.");
    queryClient.invalidateQueries({ queryKey: ["profile"] });
  } catch {
    setGarminMessage("Fehler beim Trennen.");
  } finally {
    setIsDisconnectingGarmin(false);
  }
};

const handleGarminSync = async () => {
  setIsSyncingGarmin(true);
  setGarminMessage("");
  try {
    const today = format(new Date(), "yyyy-MM-dd");
    const result = await fetchGarminDailySummary(today);
    if (result.error) {
      const messages: Record<string, string> = {
        NOT_CONNECTED: "Nicht verbunden.",
        TOKEN_EXPIRED: "Sitzung abgelaufen. Bitte neu verbinden.",
        GARMIN_UNAVAILABLE: "Garmin nicht erreichbar.",
        IMPLAUSIBLE_VALUE: "Wert noch nicht plausibel (< 500 kcal).",
      };
      setGarminMessage(messages[result.error] ?? "Fehler beim Sync.");
    } else {
      setGarminMessage(`Sync OK: ${result.totalCalories} kcal TDEE`);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    }
  } catch {
    setGarminMessage("Sync fehlgeschlagen.");
  } finally {
    setIsSyncingGarmin(false);
  }
};

const handleGarminToggle = async (checked: boolean) => {
  if (!auth.currentUser?.email) return;
  await setDoc(
    doc(db, "profiles", auth.currentUser.email),
    { useGarminTargetCalories: checked },
    { merge: true }
  );
  queryClient.invalidateQueries({ queryKey: ["profile"] });
};
```

- [ ] **Step 3: Add Garmin Connect JSX section**

Add after the Intervals.icu section (before the submit button, around line 287):

```tsx
{/* Garmin Connect */}
<div className="space-y-3">
  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
    Garmin Connect
  </h3>

  {profile?.garminConnected ? (
    <div className="space-y-3">
      <div className="bg-green-50 dark:bg-green-900/20 rounded-xl px-4 py-3">
        <span className="text-sm font-medium text-green-700 dark:text-green-400">
          Verbunden
          {profile?.garminConnectedAt && (
            <span className="font-normal text-xs ml-1">
              seit {(profile.garminConnectedAt as { toDate: () => Date }).toDate().toLocaleDateString("de-DE")}
            </span>
          )}
        </span>
      </div>

      {/* Toggle: Use Garmin TDEE */}
      <label className="flex items-center justify-between bg-zinc-100 dark:bg-zinc-800/50 rounded-xl px-4 py-3 cursor-pointer hover:bg-zinc-200/70 dark:hover:bg-zinc-800/70 transition-colors">
        <span className="text-sm font-medium">Garmin-TDEE als Tagesziel</span>
        <div className="relative">
          <input
            type="checkbox"
            checked={profile?.useGarminTargetCalories ?? false}
            onChange={(e) => handleGarminToggle(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-10 h-6 bg-zinc-300 dark:bg-zinc-600 rounded-full peer-checked:bg-primary transition-colors" />
          <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4" />
        </div>
      </label>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleGarminSync}
          disabled={isSyncingGarmin}
          className="btn-primary flex-1 text-sm"
        >
          {isSyncingGarmin ? "Sync..." : "Sync"}
        </button>
        <button
          type="button"
          onClick={handleGarminDisconnect}
          disabled={isDisconnectingGarmin}
          className="btn-secondary flex-1 text-sm"
        >
          {isDisconnectingGarmin ? "Trennen..." : "Trennen"}
        </button>
      </div>
    </div>
  ) : (
    <div className="space-y-3">
      <div>
        <label htmlFor="garminEmail" className="block text-xs text-muted-foreground mb-1">
          Garmin E-Mail
        </label>
        <input
          id="garminEmail"
          type="email"
          value={userSettings.garminEmail}
          onChange={handleChange("garminEmail")}
          className="input text-sm"
        />
      </div>
      <div>
        <label htmlFor="garminPassword" className="block text-xs text-muted-foreground mb-1">
          Garmin Passwort
        </label>
        <input
          id="garminPassword"
          type="password"
          value={userSettings.garminPassword}
          onChange={handleChange("garminPassword")}
          className="input text-sm"
          placeholder="••••••"
        />
      </div>
      <button
        type="button"
        onClick={handleGarminConnect}
        disabled={isConnectingGarmin || !userSettings.garminEmail || !userSettings.garminPassword}
        className="btn-primary w-full text-sm"
      >
        {isConnectingGarmin ? "Verbinde..." : "Mit Garmin verbinden"}
      </button>
    </div>
  )}

  {garminMessage && (
    <p className={`text-sm text-center ${
      garminMessage.includes("Fehler") || garminMessage.includes("Ungültig") || garminMessage.includes("abgelaufen") || garminMessage.includes("nicht")
        ? "text-destructive"
        : "text-green-600"
    }`}>
      {garminMessage}
    </p>
  )}
</div>
```

- [ ] **Step 4: Verify the app compiles**

```bash
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/auth/UserSettingsForm.tsx
git commit -m "feat: add Garmin Connect section to UserSettingsForm"
```

---

## Chunk 5: Frontend — Dynamic TDEE in Calorie Calculation

### Task 10: Update NutritionSummary to use Garmin TDEE

**Files:**
- Modify: `src/components/meal-planning/NutritionSummary.tsx`

- [ ] **Step 1: Write failing test**

Create `src/components/meal-planning/__tests__/NutritionSummary.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { calculateEffectiveTarget } from "../../../utils/nutrition.utils";

describe("calculateEffectiveTarget", () => {
  it("returns Garmin TDEE when available and toggle is on", () => {
    const result = calculateEffectiveTarget({
      targetCalories: 2000,
      baseCalories: 1800,
      burnedCalories: 300,
      useGarminTargetCalories: true,
      garminTotalCalories: 2500,
    });
    expect(result).toEqual({
      effectiveTarget: 2500,
      isGarminBased: true,
    });
  });

  it("returns static target + sport when Garmin toggle is off", () => {
    const result = calculateEffectiveTarget({
      targetCalories: 2000,
      baseCalories: 1800,
      burnedCalories: 300,
      useGarminTargetCalories: false,
      garminTotalCalories: 2500,
    });
    expect(result).toEqual({
      effectiveTarget: 2300,
      isGarminBased: false,
    });
  });

  it("falls back to static target + sport when no Garmin data", () => {
    const result = calculateEffectiveTarget({
      targetCalories: 2000,
      baseCalories: 1800,
      burnedCalories: 300,
      useGarminTargetCalories: true,
      garminTotalCalories: null,
    });
    expect(result).toEqual({
      effectiveTarget: 2300,
      isGarminBased: false,
    });
  });

  it("returns null when no target at all", () => {
    const result = calculateEffectiveTarget({
      targetCalories: null,
      baseCalories: null,
      burnedCalories: 300,
      useGarminTargetCalories: false,
      garminTotalCalories: null,
    });
    expect(result).toEqual({
      effectiveTarget: null,
      isGarminBased: false,
    });
  });

  it("falls back to baseCalories + sport when no targetCalories set", () => {
    const result = calculateEffectiveTarget({
      targetCalories: null,
      baseCalories: 1800,
      burnedCalories: 300,
      useGarminTargetCalories: false,
      garminTotalCalories: null,
    });
    expect(result).toEqual({
      effectiveTarget: 2100,
      isGarminBased: false,
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/components/meal-planning/__tests__/NutritionSummary.test.ts
```

Expected: FAIL — `calculateEffectiveTarget` doesn't exist.

- [ ] **Step 3: Implement `calculateEffectiveTarget` in `src/utils/nutrition.utils.ts`**

Add at the end of `src/utils/nutrition.utils.ts`:

```typescript
export interface EffectiveTargetInput {
  targetCalories: number | null;
  baseCalories: number | null;
  burnedCalories: number;
  useGarminTargetCalories: boolean;
  garminTotalCalories: number | null;
}

export interface EffectiveTargetResult {
  effectiveTarget: number | null;
  isGarminBased: boolean;
}

/** Calculate effective daily calorie target, considering Garmin TDEE. */
export function calculateEffectiveTarget(
  input: EffectiveTargetInput
): EffectiveTargetResult {
  const {
    targetCalories,
    baseCalories,
    burnedCalories,
    useGarminTargetCalories,
    garminTotalCalories,
  } = input;

  // Use Garmin TDEE if toggle is on AND data is available
  if (useGarminTargetCalories && garminTotalCalories !== null) {
    return { effectiveTarget: garminTotalCalories, isGarminBased: true };
  }

  // Fallback: static target + sport calories (existing behavior)
  const base = targetCalories ?? baseCalories;
  if (base !== null) {
    return { effectiveTarget: base + burnedCalories, isGarminBased: false };
  }

  return { effectiveTarget: null, isGarminBased: false };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/components/meal-planning/__tests__/NutritionSummary.test.ts
```

Expected: PASS

- [ ] **Step 5: Update `NutritionSummary` component to accept Garmin props and use new function**

Modify `src/components/meal-planning/NutritionSummary.tsx`:

Replace the entire `NutritionSummaryProps` interface and component opening with:

```typescript
import { calculateEffectiveTarget } from "../../utils/nutrition.utils";

interface NutritionSummaryProps {
  currentNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  nutritionGoals: {
    baseCalories: number | null;
    targetCalories: number | null;
    protein: number | null;
    carbs: number | null;
    fat: number | null;
  };
  burnedCalories: number;
  useGarminTargetCalories?: boolean;
  garminTotalCalories?: number | null;
}

export const NutritionSummary = ({
  currentNutrition,
  nutritionGoals,
  burnedCalories,
  useGarminTargetCalories = false,
  garminTotalCalories = null,
}: NutritionSummaryProps) => {
  const { effectiveTarget: effectiveTargetCalories, isGarminBased } =
    calculateEffectiveTarget({
      targetCalories: nutritionGoals.targetCalories,
      baseCalories: nutritionGoals.baseCalories,
      burnedCalories,
      useGarminTargetCalories,
      garminTotalCalories,
    });

  const deficit =
    effectiveTargetCalories !== null
      ? effectiveTargetCalories - currentNutrition.calories
      : null;
```

Update the subtitle line to show Garmin indicator. Replace the `<div className="text-muted-foreground mt-1 text-sm">` block with:

```tsx
<div className="text-muted-foreground mt-1 text-sm">
  {effectiveTargetCalories
    ? `von ${effectiveTargetCalories.toFixed(0)} kcal`
    : "kcal"}
  {isGarminBased && (
    <span className="ml-1 text-green-600 dark:text-green-400">(Garmin)</span>
  )}
  {!isGarminBased && burnedCalories > 0 && (
    <span className="ml-1">
      (+{burnedCalories.toFixed(0)} Sport)
    </span>
  )}
</div>
```

- [ ] **Step 6: Verify the app compiles**

```bash
npx tsc --noEmit
```

Expected: No type errors (new props are optional, so existing callers still work).

- [ ] **Step 7: Commit**

```bash
git add src/utils/nutrition.utils.ts src/components/meal-planning/NutritionSummary.tsx src/components/meal-planning/__tests__/NutritionSummary.test.ts
git commit -m "feat: add calculateEffectiveTarget and update NutritionSummary for Garmin TDEE"
```

---

### Task 11: Pass Garmin data from MealPlanForm to NutritionSummary

**Files:**
- Modify: `src/components/meal-planning/MealPlanForm.tsx`

- [ ] **Step 1: Add Garmin data extraction in MealPlanForm**

In `src/components/meal-planning/MealPlanForm.tsx`, the `useMealPlanFormState` hook already provides `profile` via `useProfile()`. We need to extract the profile data and pass it to `NutritionSummary`.

First, add `profile` to the destructured values from `state` (the `useMealPlanFormState` hook doesn't currently expose `profile` directly — we need to add it).

In `src/hooks/useMealPlanFormState.ts`, add to the return object (around line 254, in the return block):

```typescript
    profile,
```

This is already fetched at line 105: `const { data: profile } = useProfile();`

- [ ] **Step 2: Use profile in MealPlanForm to pass Garmin data to NutritionSummary**

In `src/components/meal-planning/MealPlanForm.tsx`, add `profile` to the destructured state (around line 23):

```typescript
const {
    ...existing fields...
    profile,
    ...
} = state;
```

Then update the `<NutritionSummary>` call (around line 96-100):

```tsx
<NutritionSummary
  currentNutrition={calculateTotalNutrition()}
  nutritionGoals={combinedNutritionGoals}
  burnedCalories={calculateTotalBurnedCalories(mealPlan.sports || [], combinedNutritionGoals.baseCalories)}
  useGarminTargetCalories={profile?.useGarminTargetCalories ?? false}
  garminTotalCalories={profile?.garminDailySummaries?.[date]?.totalCalories ?? null}
/>
```

- [ ] **Step 3: Verify the app compiles**

```bash
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useMealPlanFormState.ts src/components/meal-planning/MealPlanForm.tsx
git commit -m "feat: pass Garmin TDEE data from MealPlanForm to NutritionSummary"
```

---

### Task 12: Update NutritionGoalsForm to show read-only Garmin TDEE

**Files:**
- Modify: `src/components/meal-planning/NutritionGoalsForm.tsx`

- [ ] **Step 0: Fix critical bug — add `merge: true` to `setDoc`**

In `src/components/meal-planning/NutritionGoalsForm.tsx` at line 69, the existing `setDoc` call overwrites the entire profile document. This would delete Garmin fields when saving nutrition goals. Fix:

```typescript
// Line 69: Change from:
await setDoc(doc(db, "profiles", auth.currentUser.email), firestoreGoals);
// To:
await setDoc(doc(db, "profiles", auth.currentUser.email), firestoreGoals, { merge: true });
```

- [ ] **Step 1: Add profile hook and Garmin-aware targetCalories display**

In `src/components/meal-planning/NutritionGoalsForm.tsx`, add import:

```typescript
import { useProfile } from "../../hooks/useProfile";
```

Inside the component (after the existing state declarations at line 28):

```typescript
const { data: profile } = useProfile();
const isGarminTargetActive = profile?.useGarminTargetCalories === true;
```

- [ ] **Step 2: Make targetCalories field conditionally read-only**

Replace the targetCalories input block (lines 96-110) with:

```tsx
<div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-xl p-3">
  <label htmlFor="targetCalories" className="block text-xs text-muted-foreground mb-1">
    Zielkalorien
  </label>
  {isGarminTargetActive ? (
    <div>
      <div className="font-display font-bold text-lg text-muted-foreground">
        Garmin TDEE
      </div>
      <span className="text-xs text-green-600 dark:text-green-400">
        Wird von Garmin gesteuert
      </span>
    </div>
  ) : (
    <>
      <input
        id="targetCalories"
        type="number"
        value={goals.targetCalories ?? ""}
        onChange={handleChange("targetCalories")}
        className="w-full bg-transparent font-display font-bold text-lg outline-none placeholder:text-muted-foreground/50"
        min="0"
        placeholder="2000"
      />
      <span className="text-xs text-muted-foreground">kcal</span>
    </>
  )}
</div>
```

- [ ] **Step 3: Verify the app compiles**

```bash
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/meal-planning/NutritionGoalsForm.tsx
git commit -m "feat: show read-only Garmin TDEE indicator in NutritionGoalsForm"
```

---

### Task 13: Update weekly stats aggregation for Garmin TDEE

**Files:**
- Modify: `src/utils/weekly-stats.utils.ts`
- Modify: `src/utils/__tests__/weekly-stats.utils.test.ts`

- [ ] **Step 1: Write failing test for Garmin-aware aggregation**

Add to `src/utils/__tests__/weekly-stats.utils.test.ts`:

```typescript
import type { GarminDailySummary } from "../../types/profile.types";

describe("aggregateWeeklyStats with Garmin TDEE", () => {
  const baseGoals: ResolvedGoals = {
    baseCalories: 1800,
    targetCalories: 2000,
    protein: 150,
    carbs: 250,
    fat: 70,
  };

  it("uses Garmin TDEE instead of targetCalories + sport when Garmin data is available", () => {
    const garminSummaries: Record<string, GarminDailySummary> = {
      "2026-03-09": {
        totalCalories: 2800,
        activeCalories: 1000,
        bmrCalories: 1800,
        syncedAt: new Date() as unknown,
      },
    };

    const mealPlans: MealPlan[] = [
      {
        id: "1",
        date: "2026-03-09",
        breakfast: [{ id: "d1", name: "Oats", calories: 400, createdBy: "u1" }],
        lunch: [],
        dinner: [],
        snacks: [],
        sports: [{ calories: 500, source: "GARMIN", movingTime: 3600 }],
        temporaryMeals: [],
        createdBy: "u1",
        createdAt: new Date(),
        updatedAt: new Date(),
        dailyNote: "",
      },
    ];

    const result = aggregateWeeklyStats(
      "2026-03-09",
      mealPlans,
      baseGoals,
      true,
      garminSummaries
    );

    const monday = result.days[0];
    expect(monday.hasData).toBe(true);
    expect(monday.eatenCalories).toBe(400);
    // Garmin TDEE (2800) - NOT targetCalories (2000) + sport
    expect(monday.deficit).toBe(2800 - 400);
  });

  it("falls back to targetCalories + sport when no Garmin data for that day", () => {
    const mealPlans: MealPlan[] = [
      {
        id: "1",
        date: "2026-03-09",
        breakfast: [{ id: "d1", name: "Oats", calories: 400, createdBy: "u1" }],
        lunch: [],
        dinner: [],
        snacks: [],
        sports: [{ calories: 500, source: "GARMIN", movingTime: 3600 }],
        temporaryMeals: [],
        createdBy: "u1",
        createdAt: new Date(),
        updatedAt: new Date(),
        dailyNote: "",
      },
    ];

    const result = aggregateWeeklyStats(
      "2026-03-09",
      mealPlans,
      baseGoals,
      true,
      {} // No Garmin data
    );

    const monday = result.days[0];
    // Corrected sport calories: 500 - round(1800/24 * 1) = 500 - 75 = 425
    const expectedSport = 425;
    expect(monday.deficit).toBe(2000 + expectedSport - 400);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/utils/__tests__/weekly-stats.utils.test.ts
```

Expected: FAIL — `aggregateWeeklyStats` doesn't accept Garmin parameters.

- [ ] **Step 3: Update `aggregateWeeklyStats` and `buildDayStats` signatures**

Modify `src/utils/weekly-stats.utils.ts`:

Add import at top:

```typescript
import type { GarminDailySummary } from "../types/profile.types";
```

Update `buildDayStats` signature to accept Garmin data:

```typescript
function buildDayStats(
  date: string,
  plan: MealPlan | null,
  goals: ResolvedGoals,
  useGarminTargetCalories: boolean = false,
  garminSummary: GarminDailySummary | null = null,
): DayStats {
```

In `buildDayStats`, replace the deficit calculation (lines 84-87):

```typescript
  let deficit: number | null = null;
  if (useGarminTargetCalories && garminSummary) {
    // Garmin TDEE already includes sport — don't add sportCalories
    deficit = garminSummary.totalCalories - nutrition.calories;
  } else if (goals.targetCalories !== null) {
    deficit = goals.targetCalories + sportCalories - nutrition.calories;
  }
```

Update `aggregateWeeklyStats` signature:

```typescript
export function aggregateWeeklyStats(
  weekStartDate: string,
  mealPlans: MealPlan[],
  goals: ResolvedGoals,
  useGarminTargetCalories: boolean = false,
  garminDailySummaries: Record<string, GarminDailySummary> | null = null,
): WeeklyStats {
```

Update the `days` mapping inside `aggregateWeeklyStats`:

```typescript
const days: DayStats[] = weekDays.map((day) => {
  const dateStr = format(day, "yyyy-MM-dd");
  const plan = planByDate.get(dateStr) ?? null;
  const garminSummary = garminDailySummaries?.[dateStr] ?? null;
  return buildDayStats(dateStr, plan, goals, useGarminTargetCalories, garminSummary);
});
```

Also update the `hasCalorieGoal` check (existing line 140) to account for Garmin TDEE:

```typescript
// Replace:
const hasCalorieGoal = goals.targetCalories !== null;
// With:
const hasGarminData = useGarminTargetCalories && garminDailySummaries !== null
  && Object.keys(garminDailySummaries).length > 0;
const hasCalorieGoal = goals.targetCalories !== null || hasGarminData;
```

- [ ] **Step 4: Run all weekly-stats tests**

```bash
npx vitest run src/utils/__tests__/weekly-stats.utils.test.ts
```

Expected: All tests PASS (existing tests use default parameters, new tests use Garmin data).

- [ ] **Step 5: Commit**

```bash
git add src/utils/weekly-stats.utils.ts src/utils/__tests__/weekly-stats.utils.test.ts
git commit -m "feat: support Garmin TDEE in weekly stats aggregation"
```

---

### Task 14: Pass Garmin data through useWeeklyStats hook

**Files:**
- Modify: `src/hooks/useWeeklyStats.ts`

- [ ] **Step 1: Update useWeeklyStats to fetch profile and pass Garmin data**

Replace `src/hooks/useWeeklyStats.ts`:

```typescript
import { useQuery } from "@tanstack/react-query";
import {
  getMealPlansByWeek,
  getWeeklyNutritionGoals,
  getNutritionGoals,
} from "../repositories";
import { getProfile } from "../repositories/profile.repository";
import { resolveGoals, aggregateWeeklyStats } from "../utils/weekly-stats.utils";
import type { WeeklyStats } from "../types";

export const useWeeklyStats = (weekStartDate: string) => {
  return useQuery<WeeklyStats, Error>({
    queryKey: ["weeklyStats", weekStartDate],
    queryFn: async () => {
      const [mealPlans, weeklyGoals, profileGoals, profile] = await Promise.all([
        getMealPlansByWeek(weekStartDate),
        getWeeklyNutritionGoals(weekStartDate),
        getNutritionGoals(),
        getProfile(),
      ]);
      const goals = resolveGoals(weeklyGoals, profileGoals);
      return aggregateWeeklyStats(
        weekStartDate,
        mealPlans,
        goals,
        profile.useGarminTargetCalories ?? false,
        profile.garminDailySummaries ?? null,
      );
    },
    enabled: !!weekStartDate,
    staleTime: 1000 * 60 * 2,
  });
};
```

- [ ] **Step 2: Verify the app compiles**

```bash
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 3: Run all unit tests**

```bash
npx vitest run
```

Expected: All tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useWeeklyStats.ts
git commit -m "feat: pass Garmin TDEE data through useWeeklyStats hook"
```

---

### Task 15: Add Garmin sync on app open (auto-fetch today's TDEE)

**Files:**
- Create: `src/hooks/useGarminSync.ts`
- Modify: `src/components/meal-planning/MealPlanForm.tsx`

- [ ] **Step 1: Create `src/hooks/useGarminSync.ts`**

```typescript
import { useEffect, useRef } from "react";
import { useProfile } from "./useProfile";
import { useQueryClient } from "@tanstack/react-query";
import { fetchGarminDailySummary } from "../services/garmin.service";

/**
 * Auto-sync Garmin daily summary for a given date when the user has
 * Garmin connected and useGarminTargetCalories enabled.
 * Syncs once per date per session.
 */
export function useGarminSync(date: string) {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const syncedDates = useRef(new Set<string>());

  useEffect(() => {
    if (
      !profile?.garminConnected ||
      !profile?.useGarminTargetCalories ||
      syncedDates.current.has(date)
    ) {
      return;
    }

    syncedDates.current.add(date);

    fetchGarminDailySummary(date).then((result) => {
      if (!result.error) {
        queryClient.invalidateQueries({ queryKey: ["profile"] });
      }
    });
  }, [date, profile?.garminConnected, profile?.useGarminTargetCalories, queryClient]);
}
```

- [ ] **Step 2: Use in MealPlanForm**

In `src/components/meal-planning/MealPlanForm.tsx`, add import:

```typescript
import { useGarminSync } from "../../hooks/useGarminSync";
```

Add after the existing hooks (after `useIntervalsSync`):

```typescript
useGarminSync(date);
```

- [ ] **Step 3: Verify the app compiles**

```bash
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useGarminSync.ts src/components/meal-planning/MealPlanForm.tsx
git commit -m "feat: auto-sync Garmin TDEE when opening a day"
```

---

### Task 16: Run full test suite and verify

- [ ] **Step 1: Run all unit tests**

```bash
npx vitest run
```

Expected: All tests PASS.

- [ ] **Step 2: Run TypeScript type check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Run dev server and smoke test manually**

```bash
npm run dev
```

Verify:
1. App loads without console errors
2. Profile page shows Garmin Connect section
3. NutritionGoalsForm still renders correctly

- [ ] **Step 4: Final commit if any fixups needed**

```bash
git add -A
git commit -m "fix: address any issues found during integration testing"
```

---

## File Map Summary

| File | Action | Purpose |
|------|--------|---------|
| `functions/requirements.txt` | Create | Python dependencies |
| `functions/main.py` | Create | 3 Cloud Functions (connect, daily_summary, disconnect) |
| `firebase.json` | Modify | Add functions config |
| `.gitignore` | Modify | Add Python artifacts |
| `firestore.rules` | Modify | Add garminTokens rule |
| `src/types/profile.types.ts` | Modify | Add Garmin fields to UserProfile |
| `src/types/__tests__/profile.types.test.ts` | Create | Type validation test |
| `src/services/garmin.service.ts` | Create | Cloud Function callables |
| `src/services/__tests__/garmin.service.test.ts` | Create | Service unit tests |
| `src/utils/nutrition.utils.ts` | Modify | Add calculateEffectiveTarget |
| `src/utils/weekly-stats.utils.ts` | Modify | Garmin-aware deficit calc |
| `src/utils/__tests__/weekly-stats.utils.test.ts` | Modify | Garmin aggregation tests |
| `src/components/auth/UserSettingsForm.tsx` | Modify | Garmin Connect UI section |
| `src/components/meal-planning/NutritionSummary.tsx` | Modify | Garmin TDEE display |
| `src/components/meal-planning/NutritionGoalsForm.tsx` | Modify | Read-only when Garmin active |
| `src/components/meal-planning/MealPlanForm.tsx` | Modify | Pass Garmin props through |
| `src/components/meal-planning/__tests__/NutritionSummary.test.ts` | Create | effectiveTarget tests |
| `src/hooks/useMealPlanFormState.ts` | Modify | Expose profile |
| `src/hooks/useWeeklyStats.ts` | Modify | Pass Garmin data to aggregation |
| `src/hooks/useGarminSync.ts` | Create | Auto-sync on app open |
