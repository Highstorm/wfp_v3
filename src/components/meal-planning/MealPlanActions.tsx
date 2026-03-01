import { useState } from "react";
import type { MealPlan } from "../../types";
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
    <div>
      {/* Bauchweh-Tracker */}
      <StomachPainTracker
        stomachPainLevel={mealPlan.stomachPainLevel}
        onStomachPainChange={onStomachPainChange}
        isEnabled={stomachPainTrackingEnabled}
      />

      {/* Tagesnotiz - Ausklappbar */}
      {dailyNoteEnabled && (
        <div className="mt-4">
          <button
            onClick={() => setIsNoteVisible(!isNoteVisible)}
            className="w-full text-left text-xs text-muted-foreground hover:text-foreground transition-colors touch-manipulation py-1"
          >
            {isNoteVisible ? "Tagesnotiz ausblenden ↑" : "Tagesnotiz anzeigen ↓"}
          </button>
          {isNoteVisible && (
            <textarea
              id="dailyNote"
              value={mealPlan.dailyNote || ""}
              onChange={(e) => onDailyNoteChange(e.target.value)}
              placeholder="Notizen für diesen Tag..."
              className="input h-32 w-full resize-none mt-2"
            />
          )}
        </div>
      )}

      {/* Benachrichtigungen */}
      {message.text && (
        <div
          className={`mt-4 rounded-2xl p-3 text-sm text-center ${
            message.type === "error"
              ? "bg-destructive/10 text-destructive-foreground"
              : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Aktionsschaltflächen */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={onSave}
          disabled={isCreating || isUpdating}
          className={`btn-primary flex-1 ${
            isCreating || isUpdating ? "cursor-not-allowed opacity-50" : ""
          }`}
        >
          {isCreating || isUpdating ? "Wird gespeichert..." : "Speichern"}
        </button>
        {mealPlan.id && (
          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            className={`px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors ${
              isDeleting ? "cursor-not-allowed opacity-50" : ""
            }`}
          >
            Löschen
          </button>
        )}
      </div>

      {/* Zurücksetzen als dezenter Link */}
      <button
        type="button"
        onClick={onReset}
        className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors touch-manipulation py-3 mt-1"
      >
        Zurücksetzen
      </button>
    </div>
  );
};
