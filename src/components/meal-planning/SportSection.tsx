import { useState } from "react";

interface SportActivity {
  calories: number;
  description?: string;
}

interface SportSectionProps {
  activities: SportActivity[];
  onAddActivity: (activity: SportActivity) => void;
  onRemoveActivity: (index: number) => void;
  onLoadIntervalsActivities: () => void;
}

export const SportSection = ({
  activities = [],
  onAddActivity,
  onRemoveActivity,
  onLoadIntervalsActivities,
}: SportSectionProps) => {
  const [calories, setCalories] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isFormVisible, setIsFormVisible] = useState(false);

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

  const totalBurned = activities.reduce((sum, a) => sum + a.calories, 0);

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
                <div className="font-medium text-sm truncate">
                  {activity.description || "Aktivität"}
                </div>
                <div className="text-xs text-muted-foreground tabular-nums">
                  -{activity.calories} kcal
                </div>
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

        {/* Add activity - dashed button / form */}
        {!isFormVisible ? (
          <div className="space-y-2">
            <button
              onClick={() => setIsFormVisible(true)}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-xl px-4 py-3 text-sm text-muted-foreground hover:border-primary hover:text-foreground transition-colors touch-manipulation"
            >
              + Aktivität hinzufügen
            </button>
            <button
              onClick={onLoadIntervalsActivities}
              className="w-full text-left text-xs text-muted-foreground hover:text-foreground transition-colors touch-manipulation py-1"
            >
              Aktivitäten aus Intervals laden
            </button>
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
