import { useState } from "react";
import { type MealPlan } from "../../lib/firestore";
import { StomachPainTracker } from "./StomachPainTracker";

interface MealPlanActionsProps {
  mealPlan: MealPlan;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  message: { text: string; type: string };
  onSave: () => void;
  onReset: () => void;
  onDelete: () => void;
  onDailyNoteChange: (value: string) => void;
  onStomachPainChange: (level: number) => void;
  stomachPainTrackingEnabled: boolean;
  dailyNoteEnabled: boolean;
}

export const MealPlanActions = ({
  mealPlan,
  isCreating,
  isUpdating,
  isDeleting,
  message,
  onSave,
  onReset,
  onDelete,
  onDailyNoteChange,
  onStomachPainChange,
  stomachPainTrackingEnabled,
  dailyNoteEnabled,
}: MealPlanActionsProps) => {
  const [isNoteVisible, setIsNoteVisible] = useState(false);

  return (
    <div className="rounded-lg bg-card">
      <div className="card p-4 sm:p-6">
        {/* Aktionsschaltflächen - Immer sichtbar */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 mb-4">
          {mealPlan.id && (
            <button
              type="button"
              onClick={onDelete}
              disabled={isDeleting}
              className={`btn-primary w-full py-2.5 text-center text-sm sm:w-auto sm:text-base ${
                isDeleting ? "cursor-not-allowed opacity-50" : ""
              }`}
            >
              Löschen
            </button>
          )}
          <button
            type="button"
            onClick={onReset}
            className={`btn-secondary w-full py-2.5 text-center text-sm sm:w-auto sm:text-base`}
          >
            Zurücksetzen
          </button>
          <button
            onClick={onSave}
            disabled={isCreating || isUpdating}
            className={`btn-primary w-full py-2.5 text-center text-sm sm:w-auto sm:text-base ${
              isCreating || isUpdating ? "cursor-not-allowed opacity-50" : ""
            }`}
          >
            {isCreating || isUpdating ? "Wird gespeichert..." : "Speichern"}
          </button>
        </div>

        {/* Bauchweh-Tracker - Dauerhaft sichtbar */}
        <StomachPainTracker
          stomachPainLevel={mealPlan.stomachPainLevel}
          onStomachPainChange={onStomachPainChange}
          isEnabled={stomachPainTrackingEnabled}
        />

        {/* Tagesnotiz - Ausklappbar */}
        {dailyNoteEnabled && (
          <div className="border-t border-border pt-4">
            <div className="flex justify-between items-center mb-2">
              <label
                htmlFor="dailyNote"
                className={`block text-base sm:text-lg font-medium`}
              >
                Tagesnotiz
              </label>
              <button
                onClick={() => setIsNoteVisible(!isNoteVisible)}
                className="-m-2 rounded-lg p-2 text-sm text-primary hover:bg-accent"
              >
                {isNoteVisible ? "Notiz ausblenden ↑" : "Notiz anzeigen ↓"}
              </button>
            </div>
            {isNoteVisible && (
              <textarea
                id="dailyNote"
                value={mealPlan.dailyNote || ""}
                onChange={(e) => onDailyNoteChange(e.target.value)}
                placeholder="Notizen für diesen Tag..."
                className={`input h-32 w-full resize-none`}
              />
            )}
          </div>
        )}

        {/* Benachrichtigungen */}
        {message.text && (
          <div
            className={`mt-4 rounded-md p-3 text-sm sm:p-4 sm:text-base ${
              message.type === "error"
                ? "bg-destructive/10 text-destructive-foreground"
                : "bg-success/10 text-success-foreground"
            }`}
          >
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
};
