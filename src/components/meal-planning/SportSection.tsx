import { useState } from "react";
import type { SportActivity } from "../../types";
import { correctActivityCalories } from "../../utils/nutrition.utils";
import GarminDelta from "../../assets/garmin-delta.svg";

interface SyncFeedback {
  text: string;
  type: "success" | "error" | "info";
}

interface SportSectionProps {
  activities: SportActivity[];
  baseCalories: number | null;
  onAddActivity: (activity: SportActivity) => void;
  onRemoveActivity: (index: number) => void;
  onSyncActivities?: () => Promise<SyncFeedback | void>;
}

export const SportSection = ({
  activities = [],
  baseCalories,
  onAddActivity,
  onRemoveActivity,
  onSyncActivities,
}: SportSectionProps) => {
  const [calories, setCalories] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<SyncFeedback | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!calories || parseInt(calories) <= 0) return;

    onAddActivity({
      calories: parseInt(calories),
      description: description.trim() || undefined,
    });

    setCalories("");
    setDescription("");
  };

  const totalBurned = activities.reduce((sum, a) => {
    const { calories: corrected } = correctActivityCalories(a, baseCalories);
    return sum + corrected;
  }, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="font-display font-extrabold text-base">Sport</h3>
        {totalBurned > 0 && (
          <span className="text-sm text-muted-foreground tabular-nums">
            -{totalBurned} kcal
          </span>
        )}
      </div>

      {/* Activities */}
      <div className="space-y-2">
        {activities.map((activity, index) => (
          <div
            key={index}
            className="bg-zinc-100 dark:bg-zinc-800/50 rounded-xl px-3 py-2.5"
          >
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate flex items-center gap-1.5">
                  {activity.garminActivityId && (
                    <img src={GarminDelta} alt="Garmin" className="w-3 h-3 inline-block shrink-0" />
                  )}
                  {activity.description || "Aktivität"}
                </div>
                {(() => {
                  const correction = correctActivityCalories(activity, baseCalories);
                  return (
                    <div className="flex items-center gap-1.5 text-xs tabular-nums">
                      <span className="text-muted-foreground">
                        -{correction.calories} kcal
                      </span>
                      {correction.wasCorrected && (
                        <span className="flex items-center gap-1 text-muted-foreground/60">
                          <img src={GarminDelta} alt="Garmin" className="w-3 h-3 inline-block" />
                          ({correction.originalCalories} - {correction.restingDeduction})
                        </span>
                      )}
                    </div>
                  );
                })()}
              </div>
              <button
                onClick={() => onRemoveActivity(index)}
                className="p-1.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors touch-manipulation"
                aria-label="Aktivität entfernen"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}

        {/* Sync feedback */}
        {syncFeedback && (
          <div
            className={`rounded-xl px-3 py-2 text-sm font-medium ${
              syncFeedback.type === "success"
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                : syncFeedback.type === "error"
                ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-400"
            }`}
          >
            {syncFeedback.text}
          </div>
        )}

        {/* Add activity - dashed button / form */}
        {!isFormVisible ? (
          <div className="space-y-2">
            <button
              onClick={() => setIsFormVisible(true)}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-xl px-4 py-3 text-sm text-muted-foreground hover:border-primary hover:text-foreground transition-colors touch-manipulation"
            >
              + Aktivität hinzufügen
            </button>
            {onSyncActivities && (
              <button
                onClick={async () => {
                  setIsSyncing(true);
                  setSyncFeedback(null);
                  const result = await onSyncActivities();
                  if (result) setSyncFeedback(result);
                  setIsSyncing(false);
                  if (result) {
                    setTimeout(() => setSyncFeedback(null), 5000);
                  }
                }}
                disabled={isSyncing}
                className="w-full text-left text-xs text-muted-foreground hover:text-foreground transition-colors touch-manipulation py-1"
              >
                {isSyncing ? "Synchronisiere..." : "Aktivitäten synchronisieren ↓"}
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-zinc-100 dark:bg-zinc-800/50 rounded-xl p-4 space-y-3">
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input"
              placeholder="Beschreibung (optional)"
            />
            <input
              type="number"
              id="calories"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              min="0"
              className="input text-center font-display font-bold text-lg"
              placeholder="Verbrauchte kcal"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!calories || parseInt(calories) <= 0}
                className="btn-primary flex-1"
              >
                Hinzufügen
              </button>
              <button
                type="button"
                onClick={() => setIsFormVisible(false)}
                className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
