import { useQuery } from "@tanstack/react-query";
import {
  getMealPlansByWeek,
  getWeeklyNutritionGoals,
  getNutritionGoals,
} from "../repositories";
import { resolveGoals, aggregateWeeklyStats } from "../utils/weekly-stats.utils";
import type { WeeklyStats } from "../types";

export const useWeeklyStats = (weekStartDate: string) => {
  return useQuery<WeeklyStats, Error>({
    queryKey: ["weeklyStats", weekStartDate],
    queryFn: async () => {
      const [mealPlans, weeklyGoals, profileGoals] = await Promise.all([
        getMealPlansByWeek(weekStartDate),
        getWeeklyNutritionGoals(weekStartDate),
        getNutritionGoals(),
      ]);
      const goals = resolveGoals(weeklyGoals, profileGoals);
      return aggregateWeeklyStats(weekStartDate, mealPlans, goals);
    },
    enabled: !!weekStartDate,
    staleTime: 1000 * 60 * 2,
  });
};
