import { useEffect, useRef } from "react";
import { IntervalsService } from "../services/intervals.service";
import { fetchGarminActivities, type GarminActivity } from "../services/garmin.service";
import type { SportActivity } from "../types";
import type { MealPlanFormState } from "./useMealPlanFormState";

export function useSportSync(
  state: Pick<
    MealPlanFormState,
    "date" | "setMealPlan" | "setMessage" | "intervalsCredentials" | "profile" | "isMealPlanLoading"
  >,
  _handleAddSportActivity?: (activity: SportActivity) => void
) {
  const { date, setMealPlan, setMessage, intervalsCredentials, profile, isMealPlanLoading } = state;
  const sportSyncSource = profile?.sportSyncSource ?? null;
  const syncedDates = useRef(new Set<string>());

  /**
   * Add activities atomically via setMealPlan functional updater.
   * This always reads the LATEST state, avoiding stale closure issues
   * that cause duplicates on auto-sync after page refresh.
   */
  const addGarminActivitiesIfNew = (activities: GarminActivity[]): boolean => {
    let added = false;
    setMealPlan((prev) => {
      const existingSports = prev.sports || [];
      const newSports = activities.filter((activity) => {
        return !existingSports.some((sport) => {
          const sameById =
            sport.garminActivityId &&
            sport.garminActivityId === activity.activityId;
          const sameByData =
            !sport.garminActivityId &&
            sport.description === activity.activityName &&
            sport.calories === activity.calories;
          return Boolean(sameById || sameByData);
        });
      });
      if (newSports.length === 0) return prev;
      added = true;
      return {
        ...prev,
        sports: [
          ...existingSports,
          ...newSports.map((a) => ({
            description: a.activityName,
            calories: a.calories,
            garminActivityId: a.activityId,
            movingTime: a.movingDuration,
            source: a.manufacturer || "GARMIN",
          })),
        ],
      };
    });
    return added;
  };

  const syncGarminActivities = async (isAutoSync: boolean) => {
    try {
      const response = await fetchGarminActivities(date);

      if (response.error) {
        if (!isAutoSync) {
          const errorMessages: Record<string, string> = {
            NOT_CONNECTED: "Garmin ist nicht verbunden.",
            TOKEN_EXPIRED: "Garmin-Verbindung abgelaufen. Bitte erneut verbinden.",
            TOKEN_INVALID: "Garmin-Token ungültig. Bitte in den Einstellungen neu verbinden.",
            RATE_LIMITED: "Garmin blockiert Anfragen. Bitte in ca. 1 Stunde erneut versuchen.",
            GARMIN_UNAVAILABLE: "Garmin-Dienst ist derzeit nicht verfügbar.",
          };
          setMessage({
            text: errorMessages[response.error] ?? "Fehler beim Laden der Garmin-Aktivitäten.",
            type: "error",
          });
        }
        return;
      }

      const activities = response.activities ?? [];
      const newActivitiesAdded = addGarminActivitiesIfNew(activities);

      if (!isAutoSync) {
        setMessage({
          text: newActivitiesAdded
            ? "Garmin-Aktivitäten synchronisiert."
            : "Keine neuen Aktivitäten gefunden.",
          type: newActivitiesAdded ? "success" : "info",
        });
      }
    } catch {
      if (!isAutoSync) {
        setMessage({
          text: "Fehler beim Laden der Garmin-Aktivitäten.",
          type: "error",
        });
      }
    }
  };

  const syncIntervalsActivities = async (isAutoSync: boolean) => {
    if (!intervalsCredentials) {
      if (!isAutoSync) {
        setMessage({
          text: "Keine Intervals.icu Credentials gefunden.",
          type: "error",
        });
      }
      return;
    }

    try {
      const activities = await IntervalsService.getActivitiesForDate(
        date,
        intervalsCredentials
      );
      let newActivitiesAdded = false;

      for (const activity of activities) {
        // Use handleAddSportActivity for Intervals (manual sync only, no stale closure issue)
        setMealPlan((prev) => {
          const existingSports = prev.sports || [];
          const alreadyExists = existingSports.some((sport) => {
            const sameById =
              sport.intervalsId && sport.intervalsId === String(activity.id);
            const sameByData =
              !sport.intervalsId &&
              sport.description === activity.name &&
              sport.calories === activity.calories;
            return Boolean(sameById || sameByData);
          });
          if (alreadyExists) return prev;
          newActivitiesAdded = true;
          return {
            ...prev,
            sports: [
              ...existingSports,
              {
                description: activity.name,
                calories: activity.calories,
                intervalsId: String(activity.id),
                movingTime: activity.movingTime,
                source: activity.source,
              },
            ],
          };
        });
      }

      if (!isAutoSync) {
        setMessage({
          text: newActivitiesAdded
            ? "Aktivitäten synchronisiert."
            : "Keine neuen Aktivitäten gefunden.",
          type: newActivitiesAdded ? "success" : "info",
        });
      }
    } catch (error) {
      if (!isAutoSync) {
        if (error instanceof Error && error.message === "STRAVA_RESTRICTED") {
          setMessage({
            text: "Strava-Aktivitäten sind über die Intervals.icu API nicht verfügbar. Strava erlaubt keinen Zugriff über Drittanbieter-APIs.",
            type: "error",
          });
        } else {
          setMessage({
            text: "Fehler beim Laden der Aktivitäten.",
            type: "error",
          });
        }
      }
    }
  };

  // Auto-sync once per date per session (wait until mealPlan is loaded to avoid dupes)
  useEffect(() => {
    if (!sportSyncSource || isMealPlanLoading) return;
    if (syncedDates.current.has(date)) return;
    syncedDates.current.add(date);

    if (sportSyncSource === "garmin") {
      syncGarminActivities(true);
    } else if (sportSyncSource === "intervals") {
      syncIntervalsActivities(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, sportSyncSource, isMealPlanLoading]);

  const handleSyncActivities = async () => {
    if (sportSyncSource === "garmin") {
      await syncGarminActivities(false);
    } else if (sportSyncSource === "intervals") {
      await syncIntervalsActivities(false);
    } else {
      setMessage({
        text: "Keine Sport-Sync-Quelle konfiguriert.",
        type: "info",
      });
    }
  };

  return { handleSyncActivities, sportSyncSource } as const;
}
