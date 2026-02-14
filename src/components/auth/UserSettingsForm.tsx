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

  // Prüfe Early Access für Porridge Calculator
  const hasPorridgeAccess = hasEarlyAccess(
    "porridgeCalculator",
    auth.currentUser?.email
  );

  // Sync auth user data into form state
  useEffect(() => {
    if (auth.currentUser) {
      setUserSettings((prev) => ({
        ...prev,
        displayName: auth.currentUser?.displayName || "",
        email: auth.currentUser?.email || "",
      }));
    }
  }, []);

  // Sync profile data from useProfile() hook into form state
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
      // Re-authentifizierung, wenn E-Mail oder Passwort geändert werden soll
      if (userSettings.email !== email || userSettings.newPassword) {
        const credential = EmailAuthProvider.credential(
          email,
          userSettings.currentPassword
        );
        await reauthenticateWithCredential(currentUser, credential);
      }

      // Update Display Name
      if (userSettings.displayName !== currentUser.displayName) {
        await updateProfile(currentUser, {
          displayName: userSettings.displayName,
        });
      }

      // Update E-Mail
      if (userSettings.email !== email) {
        await updateEmail(currentUser, userSettings.email);
      }

      // Update Passwort
      if (userSettings.newPassword) {
        await updatePassword(currentUser, userSettings.newPassword);
      }

      // Speichere die Intervals.icu-Daten und Feature-Toggle-Einstellungen im Profil
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

      setUserMessage("Benutzereinstellungen erfolgreich aktualisiert!");
      // Passwortfelder zurücksetzen
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
          setUserMessage(
            "Bitte melde dich erneut an, um diese Änderungen vorzunehmen."
          );
          break;
        case "auth/wrong-password":
          setUserMessage("Das aktuelle Passwort ist nicht korrekt.");
          break;
        case "auth/weak-password":
          setUserMessage(
            "Das neue Passwort muss mindestens 6 Zeichen lang sein."
          );
          break;
        case "auth/email-already-in-use":
          setUserMessage("Diese E-Mail-Adresse wird bereits verwendet.");
          break;
        default:
          setUserMessage(
            "Ein Fehler ist aufgetreten. Bitte versuche es später erneut."
          );
      }
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const handleUserSettingsChange =
    (field: keyof UserSettings) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setUserSettings((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  return (
    <div className="card p-3 sm:p-4 lg:p-8">
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <h2 className="text-center text-xl sm:text-2xl lg:text-3xl font-bold break-words px-2">
          Benutzereinstellungen
        </h2>
        <p className="text-center text-sm sm:text-base text-muted-foreground mt-1.5 sm:mt-2">
          Verwalte deine persönlichen Daten
        </p>
      </div>

      <form onSubmit={handleUserSettingsSubmit} className="space-y-3 sm:space-y-4 lg:space-y-5">
        <div>
          <label htmlFor="displayName" className="block text-sm sm:text-sm font-medium mb-1.5">
            Name
          </label>
          <div>
            <input
              id="displayName"
              type="text"
              value={userSettings.displayName}
              onChange={handleUserSettingsChange("displayName")}
              className="input text-base sm:text-sm"
              placeholder="Dein Name"
            />
          </div>
        </div>

        <div>
          <label htmlFor="userEmail" className="block text-sm sm:text-sm font-medium mb-1.5">
            E-Mail
          </label>
          <div>
            <input
              id="userEmail"
              type="email"
              value={userSettings.email}
              onChange={handleUserSettingsChange("email")}
              className="input text-base sm:text-sm"
              placeholder="deine@email.de"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="currentPassword"
            className="block text-sm sm:text-sm font-medium mb-1.5"
          >
            Aktuelles Passwort
          </label>
          <div>
            <input
              id="currentPassword"
              type="password"
              value={userSettings.currentPassword}
              onChange={handleUserSettingsChange("currentPassword")}
              className="input text-base sm:text-sm"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div>
          <label htmlFor="newPassword" className="block text-sm sm:text-sm font-medium mb-1.5">
            Neues Passwort (optional)
          </label>
          <div>
            <input
              id="newPassword"
              type="password"
              value={userSettings.newPassword}
              onChange={handleUserSettingsChange("newPassword")}
              className="input text-base sm:text-sm"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className="p-3 sm:p-4 border border-border rounded-lg mt-3 sm:mt-4 lg:mt-5">
          <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">
            Intervals.icu Integration
          </h3>
          <div className="mb-3 sm:mb-4">
            <label htmlFor="athleteId" className="block text-sm sm:text-sm font-medium mb-1.5">
              Athlete ID
            </label>
            <div>
              <input
                id="athleteId"
                type="text"
                value={userSettings["intervals.icu-AthleteID"]}
                onChange={handleUserSettingsChange("intervals.icu-AthleteID")}
                className="input text-base sm:text-sm"
                placeholder="Deine Athlete ID"
              />
            </div>
          </div>
          <div className="mb-3 sm:mb-4">
            <label htmlFor="apiKey" className="block text-sm sm:text-sm font-medium mb-1.5">
              API Key
            </label>
            <div>
              <input
                id="apiKey"
                type="text"
                value={userSettings["intervals.icu-API-KEY"]}
                onChange={handleUserSettingsChange("intervals.icu-API-KEY")}
                className="input text-base sm:text-sm"
                placeholder="Dein API Key"
              />
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-4 border border-border rounded-lg mt-3 sm:mt-4 lg:mt-5">
          <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Mealplan-Features</h3>
          <div className="space-y-2.5 sm:space-y-3">
            <div className="flex items-start space-x-2.5 sm:space-x-3">
              <input
                id="stomachPainTracking"
                type="checkbox"
                checked={userSettings.stomachPainTrackingEnabled}
                onChange={(e) =>
                  setUserSettings((prev) => ({
                    ...prev,
                    stomachPainTrackingEnabled: e.target.checked,
                  }))
                }
                className="h-5 w-5 sm:h-4 sm:w-4 text-primary focus-visible:ring-2 focus-visible:ring-ring border-input bg-background rounded mt-0.5 flex-shrink-0"
              />
              <label
                htmlFor="stomachPainTracking"
                className="text-sm sm:text-sm font-medium leading-relaxed"
              >
                Tägliches Bauchweh-Tracking aktivieren (0-10 Skala)
              </label>
            </div>
            <div className="flex items-start space-x-2.5 sm:space-x-3">
              <input
                id="weeklyNutritionGoals"
                type="checkbox"
                checked={userSettings.weeklyNutritionGoalsEnabled}
                onChange={(e) =>
                  setUserSettings((prev) => ({
                    ...prev,
                    weeklyNutritionGoalsEnabled: e.target.checked,
                  }))
                }
                className="h-5 w-5 sm:h-4 sm:w-4 text-primary focus-visible:ring-2 focus-visible:ring-ring border-input bg-background rounded mt-0.5 flex-shrink-0"
              />
              <label
                htmlFor="weeklyNutritionGoals"
                className="text-sm sm:text-sm font-medium leading-relaxed"
              >
                Wochenspezifische Ernährungsziele anzeigen
              </label>
            </div>
            <div className="flex items-start space-x-2.5 sm:space-x-3">
              <input
                id="dailyNote"
                type="checkbox"
                checked={userSettings.dailyNoteEnabled}
                onChange={(e) =>
                  setUserSettings((prev) => ({
                    ...prev,
                    dailyNoteEnabled: e.target.checked,
                  }))
                }
                className="h-5 w-5 sm:h-4 sm:w-4 text-primary focus-visible:ring-2 focus-visible:ring-ring border-input bg-background rounded mt-0.5 flex-shrink-0"
              />
              <label htmlFor="dailyNote" className="text-sm sm:text-sm font-medium leading-relaxed">
                Tagesnotiz anzeigen
              </label>
            </div>
            <div className="flex items-start space-x-2.5 sm:space-x-3">
              <input
                id="sport"
                type="checkbox"
                checked={userSettings.sportEnabled}
                onChange={(e) =>
                  setUserSettings((prev) => ({
                    ...prev,
                    sportEnabled: e.target.checked,
                  }))
                }
                className="h-5 w-5 sm:h-4 sm:w-4 text-primary focus-visible:ring-2 focus-visible:ring-ring border-input bg-background rounded mt-0.5 flex-shrink-0"
              />
              <label htmlFor="sport" className="text-sm sm:text-sm font-medium leading-relaxed">
                Sport anzeigen
              </label>
            </div>
            {hasPorridgeAccess && (
              <div className="flex items-start space-x-2.5 sm:space-x-3">
                <input
                  id="porridgeCalculator"
                  type="checkbox"
                  checked={userSettings.porridgeCalculatorEnabled}
                  onChange={(e) =>
                    setUserSettings((prev) => ({
                      ...prev,
                      porridgeCalculatorEnabled: e.target.checked,
                    }))
                  }
                  className="h-5 w-5 sm:h-4 sm:w-4 text-primary focus-visible:ring-2 focus-visible:ring-ring border-input bg-background rounded mt-0.5 flex-shrink-0"
                />
                <label
                  htmlFor="porridgeCalculator"
                  className="text-sm sm:text-sm font-medium leading-relaxed"
                >
                  Porridge Calculator anzeigen
                  <span className="ml-2 text-xs text-primary font-semibold">
                    Early Access
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isUpdatingUser}
          className="btn-primary w-full text-base sm:text-sm py-2.5 sm:py-2 min-h-[44px] sm:min-h-0"
        >
          {isUpdatingUser ? "Wird aktualisiert..." : "Einstellungen speichern"}
        </button>

        {userMessage && (
          <p
            className={`mt-2 sm:mt-2 text-sm sm:text-sm text-center leading-relaxed ${
              userMessage.includes("Fehler") || userMessage.includes("nicht")
                ? "text-destructive"
                : "text-green-600"
            }`}
          >
            {userMessage}
          </p>
        )}
      </form>
    </div>
  );
};
