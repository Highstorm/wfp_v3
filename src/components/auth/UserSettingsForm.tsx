import { useState, useEffect } from "react";
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
}

export const UserSettingsForm = () => {
  const { data: profile } = useProfile();
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
  });
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [userMessage, setUserMessage] = useState("");

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
      </form>
    </div>
  );
};
