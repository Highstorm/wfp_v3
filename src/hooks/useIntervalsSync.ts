import { IntervalsService } from "../services/intervals.service";
import type { SportActivity } from "../types";
import type { MealPlanFormState } from "./useMealPlanFormState";

export function useIntervalsSync(
  state: Pick<
    MealPlanFormState,
    "date" | "mealPlan" | "setMessage" | "intervalsCredentials"
  >,
  handleAddSportActivity: (activity: SportActivity) => void
) {
  const { date, mealPlan, setMessage, intervalsCredentials } = state;

  const handleLoadIntervalsActivities = async () => {
    if (!intervalsCredentials) {
      setMessage({
        text: "Keine Intervals.icu Credentials gefunden.",
        type: "error",
      });
      return;
    }

    try {
      const activities = await IntervalsService.getActivitiesForDate(
        date,
        intervalsCredentials
      );
      let newActivitiesAdded = false;

      for (const activity of activities) {
        const existingActivity = mealPlan?.sports?.some((sport) => {
          const sameById =
            sport.intervalsId && sport.intervalsId === String(activity.id);
          const sameByData =
            !sport.intervalsId &&
            sport.description === activity.name &&
            sport.calories === activity.calories;
          return Boolean(sameById || sameByData);
        });

        if (!existingActivity) {
          handleAddSportActivity({
            description: activity.name,
            calories: activity.calories,
            intervalsId: String(activity.id),
          });
          newActivitiesAdded = true;
        }
      }

      if (newActivitiesAdded) {
        setMessage({
          text: "Ein Sporteintrag wurde automatisch erzeugt.",
          type: "success",
        });
      } else {
        setMessage({
          text: "Keine neuen Aktivitäten gefunden.",
          type: "info",
        });
      }
    } catch {
      setMessage({
        text: "Fehler beim Laden der Aktivitäten.",
        type: "error",
      });
    }
  };

  return { handleLoadIntervalsActivities } as const;
}
