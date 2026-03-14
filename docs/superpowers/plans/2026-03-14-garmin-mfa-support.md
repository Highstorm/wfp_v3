# Garmin MFA Support — Implementation Plan

**Goal:** MFA (Multi-Factor Authentication) für Garmin Connect unterstützen.

**Ansatz:** Zwei-Schritt-Flow über die bestehende `garmin_connect` Cloud Function mit optionalem `mfaCode`-Parameter.

---

## Flow

1. User gibt Email + Passwort ein → Frontend ruft `garmin_connect` auf
2. Falls MFA aktiv: Function gibt `{"error": "MFA_REQUIRED"}` zurück
3. Frontend zeigt MFA-Code-Feld → User gibt Code ein → Frontend ruft `garmin_connect` nochmal auf mit Email + Passwort + MFA-Code
4. Function loggt sich ein mit `prompt_mfa=lambda: mfa_code` — garth nutzt den Code direkt

## Technischer Hintergrund

- `garminconnect.Garmin(email, password, prompt_mfa=<callable>)` — der Constructor akzeptiert ein Callable
- `garth.sso.login` erkennt MFA an `"MFA" in title` nach dem Passwort-Submit
- Ohne `prompt_mfa` (bzw. `prompt_mfa=None`) + `return_on_mfa=True` gibt garth `{"needs_mfa": True, ...}` zurück
- Einfachster Ansatz: Bei fehlendem MFA-Code einen neuen Login-Versuch machen, der scheitert → `MFA_REQUIRED` zurückgeben. Beim zweiten Aufruf mit Code: `prompt_mfa=lambda: mfa_code`

---

## Task 1: Backend — `garmin_connect` Cloud Function erweitern

**File:** `functions/main.py`

- [ ] **Step 1:** `mfaCode` aus `req.data` lesen (optional)

```python
mfa_code = req.data.get("mfaCode")
```

- [ ] **Step 2:** Login-Logik anpassen

```python
try:
    if mfa_code:
        client = Garmin(garmin_email, garmin_password, prompt_mfa=lambda: mfa_code)
    else:
        client = Garmin(garmin_email, garmin_password, prompt_mfa=None)
    client.login()
except GarthException as e:
    if "MFA" in str(e):
        return {"error": "MFA_REQUIRED"}
    return {"error": "INVALID_CREDENTIALS"}
except Exception:
    return {"error": "INVALID_CREDENTIALS"}
```

Hinweis: Wenn `prompt_mfa=None` und MFA nötig ist, wirft garth eine Exception (da `return_on_mfa` default `False` und `prompt_mfa` None → der Code versucht `None()` aufzurufen). Wir müssen prüfen ob garth in dem Fall sauber eine Exception wirft oder ob wir `return_on_mfa=True` auf garth-Level nutzen müssen. Ggf. direkten garth-Aufruf statt Garmin-Wrapper.

- [ ] **Step 3:** Import ergänzen

```python
from garth.exc import GarthException
```

- [ ] **Step 4:** Syntax verifizieren und committen

---

## Task 2: Frontend — MFA-Code-Feld in UserSettingsForm

**File:** `src/components/auth/UserSettingsForm.tsx`

- [ ] **Step 1:** State für MFA hinzufügen

```typescript
const [showMfaField, setShowMfaField] = useState(false);
```

Und in `UserSettings` Interface + initial state:
```typescript
garminMfaCode: string;
// initial: garminMfaCode: "",
```

- [ ] **Step 2:** `handleGarminConnect` erweitern — MFA-Response behandeln

```typescript
const handleGarminConnect = async () => {
  setIsConnectingGarmin(true);
  setGarminMessage("");
  try {
    const result = await connectGarmin(
      userSettings.garminEmail,
      userSettings.garminPassword,
      showMfaField ? userSettings.garminMfaCode : undefined
    );
    if (result.error === "MFA_REQUIRED") {
      setShowMfaField(true);
      setGarminMessage("MFA-Code eingeben (aus Authenticator-App).");
    } else if (result.error === "INVALID_CREDENTIALS") {
      setGarminMessage("Ungültige Garmin-Zugangsdaten.");
      setShowMfaField(false);
    } else if (result.success) {
      setGarminMessage("Erfolgreich verbunden!");
      setShowMfaField(false);
      setUserSettings((prev) => ({ ...prev, garminEmail: "", garminPassword: "", garminMfaCode: "" }));
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    }
  } catch {
    setGarminMessage("Verbindung fehlgeschlagen.");
  } finally {
    setIsConnectingGarmin(false);
  }
};
```

- [ ] **Step 3:** MFA-Eingabefeld im JSX (conditional)

```tsx
{showMfaField && (
  <div>
    <label htmlFor="garminMfaCode" className="block text-xs text-muted-foreground mb-1">
      MFA-Code
    </label>
    <input
      id="garminMfaCode"
      type="text"
      inputMode="numeric"
      value={userSettings.garminMfaCode}
      onChange={handleChange("garminMfaCode")}
      className="input text-sm"
      placeholder="123456"
      autoComplete="one-time-code"
    />
  </div>
)}
```

- [ ] **Step 4:** Verify + Commit

---

## Task 3: Service — `connectGarmin` Signatur erweitern

**File:** `src/services/garmin.service.ts`

- [ ] **Step 1:** `mfaCode` als optionalen Parameter hinzufügen

```typescript
export async function connectGarmin(
  garminEmail: string,
  garminPassword: string,
  mfaCode?: string
): Promise<GarminConnectResponse> {
  const callable = httpsCallable<
    { garminEmail: string; garminPassword: string; mfaCode?: string },
    GarminConnectResponse
  >(functions, "garmin_connect");
  const result = await callable({ garminEmail, garminPassword, ...(mfaCode && { mfaCode }) });
  return result.data;
}
```

- [ ] **Step 2:** Test erweitern für MFA-Case

- [ ] **Step 3:** Verify + Commit

---

## Offene Fragen

1. **Exception-Handling bei `prompt_mfa=None`:** Muss getestet werden ob garth sauber eine Exception wirft oder crasht. Alternative: garth direkt nutzen mit `return_on_mfa=True`.
2. **MFA-Code Timeout:** Garmin MFA-Codes sind typischerweise 30s gültig (TOTP). Der User muss schnell sein. Kein spezielles Handling nötig — bei abgelaufenem Code kommt einfach `INVALID_CREDENTIALS`.
