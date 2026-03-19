import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  updateProfile,
  updateEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { FirebaseError } from "firebase/app";
import { hasEarlyAccess } from "../../config/earlyAccessFeatures";
import { useProfile } from "../../hooks/useProfile";
import { logger } from "../../utils/logger";
import { connectGarmin, disconnectGarmin, fetchGarminDailySummary } from "../../services/garmin.service";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

interface UserSettings {
  displayName: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  "intervals.icu-API-KEY": string;
  "intervals.icu-AthleteID": string;
  stomachPainTrackingEnabled: boolean;
  weeklyNutritionGoalsEnabled: boolean;
  dailyNoteEnabled: boolean;
  sportEnabled: boolean;
  porridgeCalculatorEnabled: boolean;
  garminEmail: string;
  garminPassword: string;
  garminMfaCode: string;
}

export const UserSettingsForm = () => {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const [userSettings, setUserSettings] = useState<UserSettings>({
    displayName: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    "intervals.icu-API-KEY": "",
    "intervals.icu-AthleteID": "",
    stomachPainTrackingEnabled: false,
    weeklyNutritionGoalsEnabled: true,
    dailyNoteEnabled: true,
    sportEnabled: true,
    porridgeCalculatorEnabled: true,
    garminEmail: "",
    garminPassword: "",
    garminMfaCode: "",
  });
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [userMessage, setUserMessage] = useState("");
  const [isConnectingGarmin, setIsConnectingGarmin] = useState(false);
  const [garminMessage, setGarminMessage] = useState("");
  const [showMfaField, setShowMfaField] = useState(false);
  const [isSyncingGarmin, setIsSyncingGarmin] = useState(false);
  const [isDisconnectingGarmin, setIsDisconnectingGarmin] = useState(false);

  const hasPorridgeAccess = hasEarlyAccess(
    "porridgeCalculator",
    auth.currentUser?.email
  );

  useEffect(() => {
    if (auth.currentUser) {
      setUserSettings((prev) => ({
        ...prev,
        displayName: auth.currentUser?.displayName || "",
        email: auth.currentUser?.email || "",
      }));
    }
  }, []);

  useEffect(() => {
    if (profile) {
      setUserSettings((prev) => ({
        ...prev,
        "intervals.icu-API-KEY": profile["intervals.icu-API-KEY"] || "",
        "intervals.icu-AthleteID": profile["intervals.icu-AthleteID"] || "",
        stomachPainTrackingEnabled: profile.stomachPainTrackingEnabled ?? false,
        weeklyNutritionGoalsEnabled: profile.weeklyNutritionGoalsEnabled ?? true,
        dailyNoteEnabled: profile.dailyNoteEnabled ?? true,
        sportEnabled: profile.sportEnabled ?? true,
        porridgeCalculatorEnabled: profile.porridgeCalculatorEnabled ?? true,
      }));
    }
  }, [profile]);

  const handleUserSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser?.email) return;

    const email = auth.currentUser.email;
    const currentUser = auth.currentUser;

    setIsUpdatingUser(true);
    setUserMessage("");

    try {
      if (userSettings.email !== email || userSettings.newPassword) {
        const credential = EmailAuthProvider.credential(
          email,
          userSettings.currentPassword
        );
        await reauthenticateWithCredential(currentUser, credential);
      }

      if (userSettings.displayName !== currentUser.displayName) {
        await updateProfile(currentUser, {
          displayName: userSettings.displayName,
        });
      }

      if (userSettings.email !== email) {
        await updateEmail(currentUser, userSettings.email);
      }

      if (userSettings.newPassword) {
        await updatePassword(currentUser, userSettings.newPassword);
      }

      await setDoc(
        doc(db, "profiles", email),
        {
          "intervals.icu-API-KEY": userSettings["intervals.icu-API-KEY"],
          "intervals.icu-AthleteID": userSettings["intervals.icu-AthleteID"],
          stomachPainTrackingEnabled: userSettings.stomachPainTrackingEnabled,
          weeklyNutritionGoalsEnabled: userSettings.weeklyNutritionGoalsEnabled,
          dailyNoteEnabled: userSettings.dailyNoteEnabled,
          sportEnabled: userSettings.sportEnabled,
          porridgeCalculatorEnabled: userSettings.porridgeCalculatorEnabled,
        },
        { merge: true }
      );

      setUserMessage("Einstellungen gespeichert!");
      setUserSettings((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
      }));
    } catch (error: unknown) {
      logger.error("Error updating user settings:", error);
      const errorCode = error instanceof FirebaseError ? error.code : undefined;
      switch (errorCode) {
        case "auth/requires-recent-login":
          setUserMessage("Bitte melde dich erneut an.");
          break;
        case "auth/wrong-password":
          setUserMessage("Aktuelles Passwort ist falsch.");
          break;
        case "auth/weak-password":
          setUserMessage("Neues Passwort muss min. 6 Zeichen haben.");
          break;
        case "auth/email-already-in-use":
          setUserMessage("E-Mail wird bereits verwendet.");
          break;
        default:
          setUserMessage("Ein Fehler ist aufgetreten.");
      }
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const handleChange =
    (field: keyof UserSettings) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setUserSettings((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

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
      } else if (result.error === "RATE_LIMITED") {
        setGarminMessage("Garmin blockiert Anfragen. Bitte in ca. 1 Stunde erneut versuchen.");
        setShowMfaField(false);
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
          TOKEN_INVALID: "Token ungültig. Bitte Garmin trennen und neu verbinden.",
          RATE_LIMITED: "Garmin blockiert Anfragen. Bitte in ca. 1 Stunde erneut versuchen.",
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

  const [sportSyncConfirmDialog, setSportSyncConfirmDialog] = useState<{
    isOpen: boolean;
    newSource: "garmin" | "intervals" | null;
  }>({ isOpen: false, newSource: null });

  const currentSportSyncSource = profile?.sportSyncSource ?? null;

  const handleSportSyncSourceChange = async (newSource: "garmin" | "intervals" | null) => {
    if (currentSportSyncSource && newSource && currentSportSyncSource !== newSource) {
      setSportSyncConfirmDialog({ isOpen: true, newSource });
      return;
    }
    await saveSportSyncSource(newSource);
  };

  const saveSportSyncSource = async (newSource: "garmin" | "intervals" | null) => {
    if (!auth.currentUser?.email) return;
    await setDoc(
      doc(db, "profiles", auth.currentUser.email),
      { sportSyncSource: newSource },
      { merge: true }
    );
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    setSportSyncConfirmDialog({ isOpen: false, newSource: null });
  };

  const toggleFeatures: {
    key: keyof UserSettings;
    label: string;
    earlyAccess?: boolean;
  }[] = [
    { key: "stomachPainTrackingEnabled", label: "Bauchweh-Tracking" },
    { key: "weeklyNutritionGoalsEnabled", label: "Wochenziele" },
    { key: "dailyNoteEnabled", label: "Tagesnotiz" },
    { key: "sportEnabled", label: "Sport-Tracking" },
    ...(hasPorridgeAccess
      ? [{ key: "porridgeCalculatorEnabled" as keyof UserSettings, label: "Porridge-Rechner", earlyAccess: true }]
      : []),
  ];

  return (
    <div>
      <h2 className="font-display font-extrabold text-lg mb-4">Einstellungen</h2>

      <form onSubmit={handleUserSettingsSubmit} className="space-y-4">
        {/* Personal info */}
        <div className="space-y-3">
          <div>
            <label htmlFor="displayName" className="block text-xs text-muted-foreground mb-1">Name</label>
            <input
              id="displayName"
              type="text"
              value={userSettings.displayName}
              onChange={handleChange("displayName")}
              className="input"
              placeholder="Dein Name"
            />
          </div>
          <div>
            <label htmlFor="userEmail" className="block text-xs text-muted-foreground mb-1">E-Mail</label>
            <input
              id="userEmail"
              type="email"
              value={userSettings.email}
              onChange={handleChange("email")}
              className="input"
              placeholder="deine@email.de"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="currentPassword" className="block text-xs text-muted-foreground mb-1">Aktuelles PW</label>
              <input
                id="currentPassword"
                type="password"
                value={userSettings.currentPassword}
                onChange={handleChange("currentPassword")}
                className="input"
                placeholder="••••••"
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-xs text-muted-foreground mb-1">Neues PW</label>
              <input
                id="newPassword"
                type="password"
                value={userSettings.newPassword}
                onChange={handleChange("newPassword")}
                className="input"
                placeholder="••••••"
              />
            </div>
          </div>
        </div>

        {/* Feature Toggles - Zinc surface rows */}
        <div className="space-y-1.5">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Features</h3>
          {toggleFeatures.map(({ key, label, earlyAccess }) => (
            <label
              key={key}
              className="flex items-center justify-between bg-zinc-100 dark:bg-zinc-800/50 rounded-xl px-4 py-3 cursor-pointer hover:bg-zinc-200/70 dark:hover:bg-zinc-800/70 transition-colors"
            >
              <span className="text-sm font-medium">
                {label}
                {earlyAccess && (
                  <span className="ml-2 text-xs text-primary font-semibold">Early Access</span>
                )}
              </span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={userSettings[key] as boolean}
                  onChange={(e) =>
                    setUserSettings((prev) => ({ ...prev, [key]: e.target.checked }))
                  }
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-zinc-300 dark:bg-zinc-600 rounded-full peer-checked:bg-primary transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4" />
              </div>
            </label>
          ))}
        </div>

        {/* Intervals.icu */}
        <div className="space-y-3">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Intervals.icu</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="athleteId" className="block text-xs text-muted-foreground mb-1">Athlete ID</label>
              <input
                id="athleteId"
                type="text"
                value={userSettings["intervals.icu-AthleteID"]}
                onChange={handleChange("intervals.icu-AthleteID")}
                className="input text-sm"
              />
            </div>
            <div>
              <label htmlFor="apiKey" className="block text-xs text-muted-foreground mb-1">API Key</label>
              <input
                id="apiKey"
                type="text"
                value={userSettings["intervals.icu-API-KEY"]}
                onChange={handleChange("intervals.icu-API-KEY")}
                className="input text-sm"
              />
            </div>
          </div>
        </div>

        {/* Sport Sync Source */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sport-Synchronisation</h3>
          {(([
            { value: null, label: "Aus", disabled: false },
            { value: "intervals", label: "Intervals.icu", disabled: !profile?.["intervals.icu-API-KEY"] || !profile?.["intervals.icu-AthleteID"] },
            { value: "garmin", label: "Garmin Connect", disabled: !profile?.garminConnected },
          ] as { value: "garmin" | "intervals" | null; label: string; disabled: boolean }[])).map((option) => (
            <label
              key={option.label}
              className={`flex items-center justify-between bg-zinc-100 dark:bg-zinc-800/50 rounded-xl px-4 py-3 transition-colors ${
                option.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-zinc-200/70 dark:hover:bg-zinc-800/70"
              }`}
            >
              <span className="text-sm font-medium">{option.label}</span>
              <div className="relative flex items-center justify-center">
                <input
                  type="radio"
                  name="sportSyncSource"
                  checked={currentSportSyncSource === option.value}
                  onChange={() => !option.disabled && handleSportSyncSourceChange(option.value)}
                  disabled={option.disabled}
                  className="sr-only peer"
                />
                <div className="w-5 h-5 border-2 border-zinc-300 dark:border-zinc-600 rounded-full peer-checked:border-primary transition-colors flex items-center justify-center">
                  {currentSportSyncSource === option.value && (
                    <div className="w-2.5 h-2.5 bg-primary rounded-full" />
                  )}
                </div>
              </div>
            </label>
          ))}
        </div>

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
                  {!!profile?.garminConnectedAt && (
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
              <button
                type="button"
                onClick={handleGarminConnect}
                disabled={isConnectingGarmin || !userSettings.garminEmail || !userSettings.garminPassword || (showMfaField && !userSettings.garminMfaCode)}
                className="btn-primary w-full text-sm"
              >
                {isConnectingGarmin ? "Verbinde..." : showMfaField ? "Mit MFA-Code verbinden" : "Mit Garmin verbinden"}
              </button>
            </div>
          )}

          {garminMessage && (
            <p className={`text-sm text-center ${
              garminMessage.includes("Fehler") || garminMessage.includes("Ungültig") || garminMessage.includes("abgelaufen") || garminMessage.includes("nicht") || garminMessage.includes("fehlgeschlagen")
                ? "text-destructive"
                : "text-green-600"
            }`}>
              {garminMessage}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isUpdatingUser}
          className="btn-primary w-full"
        >
          {isUpdatingUser ? "Wird gespeichert..." : "Speichern"}
        </button>

        {userMessage && (
          <p className={`text-sm text-center ${
            userMessage.includes("Fehler") || userMessage.includes("falsch") || userMessage.includes("erneut")
              ? "text-destructive"
              : "text-green-600"
          }`}>
            {userMessage}
          </p>
        )}

        {sportSyncConfirmDialog.isOpen && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
            <div className="card w-full max-w-md p-6">
              <h3 className="mb-4 text-lg font-medium">Sport-Sync wechseln?</h3>
              <p className="mb-6 text-sm text-muted-foreground">
                Sport-Sync über <strong>{currentSportSyncSource === "garmin" ? "Garmin" : "Intervals.icu"}</strong> wird
                deaktiviert und <strong>{sportSyncConfirmDialog.newSource === "garmin" ? "Garmin" : "Intervals.icu"}</strong> aktiviert.
                Fortfahren?
              </p>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setSportSyncConfirmDialog({ isOpen: false, newSource: null })}
                  className="btn-secondary"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={() => saveSportSyncSource(sportSyncConfirmDialog.newSource)}
                  className="btn-primary"
                >
                  Wechseln
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </form>
    </div>
  );
};
