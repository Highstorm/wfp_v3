import { useEffect, useRef } from "react";
import { IntervalsService } from "../services/intervals.service";
import { fetchGarminActivities } from "../services/garmin.service";
import type { SportActivity } from "../types";
import type { MealPlanFormState } from "./useMealPlanFormState";

export function useSportSync(
  state: Pick<
    MealPlanFormState,
    "date" | "mealPlan" | "setMessage" | "intervalsCredentials" | "profile" | "isMealPlanLoading"
  >,
  handleAddSportActivity: (activity: SportActivity) => void
) {
  const { date, mealPlan, setMessage, intervalsCredentials, profile, isMealPlanLoading } = state;
  const sportSyncSource = profile?.sportSyncSource ?? null;
  const syncedDates = useRef(new Set<string>());

  const syncGarminActivities = async (isAutoSync: boolean) => {
    try {
      const response = await fetchGarminActivities(date);

      if (response.error) {
        if (!isAutoSync) {
          const errorMessages: Record<string, string> = {
            NOT_CONNECTED: "Garmin ist nicht verbunden.",
            TOKEN_EXPIRED: "Garmin-Verbindung abgelaufen. Bitte erneut verbinden.",
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
      let newActivitiesAdded = false;

      for (const activity of activities) {
        const exists = mealPlan?.sports?.some((sport) => {
          const sameById =
            sport.garminActivityId &&
            sport.garminActivityId === activity.activityId;
          return Boolean(sameById);
        });

        if (!exists) {
          handleAddSportActivity({
            description: activity.activityName,
            calories: activity.calories,
            garminActivityId: activity.activityId,
            movingTime: activity.movingDuration,
            source: "GARMIN",
          });
          newActivitiesAdded = true;
        }
      }

      if (!isAutoSync) {
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
        const exists = mealPlan?.sports?.some((sport) => {
          const sameById =
            sport.intervalsId && sport.intervalsId === String(activity.id);
          const sameByData =
            !sport.intervalsId &&
            sport.description === activity.name &&
            sport.calories === activity.calories;
          return Boolean(sameById || sameByData);
        });

        if (!exists) {
          handleAddSportActivity({
            description: activity.name,
            calories: activity.calories,
            intervalsId: String(activity.id),
            movingTime: activity.movingTime,
            source: activity.source,
          });
          newActivitiesAdded = true;
        }
      }

      if (!isAutoSync) {
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
