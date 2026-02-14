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

  return (
    <div className="card p-3 sm:p-4">
      <div className="mb-3 sm:mb-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4">
          <h2 className="text-base sm:text-xl font-semibold">Sport</h2>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <button
              onClick={onLoadIntervalsActivities}
              className="flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 sm:py-2 text-sm sm:text-sm font-medium text-primary hover:bg-primary/10 active:bg-primary/10 transition-colors touch-manipulation min-h-[44px] sm:min-h-0"
            >
              <svg
                className="w-4 h-4 sm:w-4 sm:h-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>Aktivitäten laden</span>
            </button>
            <button
              onClick={() => setIsFormVisible(!isFormVisible)}
              className="rounded-lg px-4 py-2.5 sm:py-2 text-sm sm:text-sm font-medium text-primary hover:bg-primary/10 active:bg-primary/10 transition-colors touch-manipulation min-h-[44px] sm:min-h-0"
            >
              {isFormVisible ? "Formular ausblenden ↑" : "Formular anzeigen ↓"}
            </button>
          </div>
        </div>
      </div>

      {isFormVisible && (
        <form onSubmit={handleSubmit} className="mb-4 sm:mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label
                htmlFor="calories"
                className="mb-1.5 sm:mb-1 block text-sm font-medium"
              >
                Verbrauchte Kalorien
              </label>
              <input
                type="number"
                id="calories"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                min="0"
                className="input"
                placeholder="z.B. 300"
              />
            </div>
            <div>
              <label
                htmlFor="description"
                className="mb-1.5 sm:mb-1 block text-sm font-medium"
              >
                Beschreibung (optional)
              </label>
              <input
                type="text"
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input"
                placeholder="z.B. 30 min Joggen"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={!calories || parseInt(calories) <= 0}
            className="btn-primary mt-3 sm:mt-4 w-full sm:w-auto"
          >
            Hinzufügen
          </button>
        </form>
      )}

      {activities.length > 0 && (
        <div className="space-y-2 sm:space-y-3">
          {activities.map((activity, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-muted rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 gap-2"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-base sm:text-base">{activity.calories} kcal</div>
                {activity.description && (
                  <div className="text-sm sm:text-sm text-muted-foreground mt-0.5">
                    {activity.description}
                  </div>
                )}
              </div>
              <button
                onClick={() => onRemoveActivity(index)}
                className="text-muted-foreground hover:text-destructive active:text-destructive p-2 sm:p-1 rounded-lg hover:bg-accent active:bg-accent transition-colors touch-manipulation min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center flex-shrink-0"
                aria-label="Aktivität entfernen"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
