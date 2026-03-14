import { useEffect, useRef } from "react";
import { useProfile } from "./useProfile";
import { useQueryClient } from "@tanstack/react-query";
import { fetchGarminDailySummary } from "../services/garmin.service";

/**
 * Auto-sync Garmin daily summary for a given date when the user has
 * Garmin connected and useGarminTargetCalories enabled.
 * Syncs once per date per session.
 */
export function useGarminSync(date: string) {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const syncedDates = useRef(new Set<string>());

  useEffect(() => {
    if (
      !profile?.garminConnected ||
      !profile?.useGarminTargetCalories ||
      syncedDates.current.has(date)
    ) {
      return;
    }

    syncedDates.current.add(date);

    fetchGarminDailySummary(date).then((result) => {
      if (!result.error) {
        queryClient.invalidateQueries({ queryKey: ["profile"] });
      }
    });
  }, [date, profile?.garminConnected, profile?.useGarminTargetCalories, queryClient]);
}
