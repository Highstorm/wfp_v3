import { parseISO, endOfISOWeek, eachDayOfInterval, format } from "date-fns";
import type { MealPlan, WeeklyNutritionGoals, NutritionGoals } from "../types";
import type { DayStats, ResolvedGoals, WeeklyStats } from "../types";
import {
  calculateTotalMealPlanNutrition,
  calculateTotalBurnedCalories,
} from "./nutrition.utils";

/**
 * Resolve the effective nutrition goals from a weekly override and a profile fallback.
 * Each macro is resolved independently: weekly ?? profile ?? null.
 * A value of 0 is treated as "set" (nullish coalescing, not logical OR).
 */
export function resolveGoals(
  weeklyGoals: WeeklyNutritionGoals | null,
  profileGoals: NutritionGoals
): ResolvedGoals {
  return {
    baseCalories: profileGoals.baseCalories ?? null,
    targetCalories:
      weeklyGoals?.targetCalories ?? profileGoals.targetCalories ?? null,
    protein: weeklyGoals?.protein ?? profileGoals.protein ?? null,
    carbs: weeklyGoals?.carbs ?? profileGoals.carbs ?? null,
    fat: weeklyGoals?.fat ?? profileGoals.fat ?? null,
  };
}

/**
 * A day is considered "logged" if it has at least one dish in any meal slot
 * or at least one temporaryMeal. Sport-only or empty documents are NOT logged.
 */
function isLoggedDay(plan: MealPlan): boolean {
  const dishCount =
    plan.breakfast.length +
    plan.lunch.length +
    plan.dinner.length +
    plan.snacks.length;
  const tempMealCount = (plan.temporaryMeals ?? []).length;
  return dishCount > 0 || tempMealCount > 0;
}

/**
 * Build a single DayStats entry for a given date.
 */
function buildDayStats(
  date: string,
  plan: MealPlan | null,
  goals: ResolvedGoals
): DayStats {
  if (plan === null) {
    return {
      date,
      hasData: false,
      eatenCalories: 0,
      sportCalories: 0,
      deficit: null,
      protein: 0,
      carbs: 0,
      fat: 0,
      sportSessions: 0,
    };
  }

  const sports = plan.sports ?? [];
  const sportCalories = calculateTotalBurnedCalories(sports, goals.baseCalories);
  const sportSessions = sports.length;
  const hasData = isLoggedDay(plan);

  if (!hasData) {
    return {
      date,
      hasData: false,
      eatenCalories: 0,
      sportCalories,
      deficit: null,
      protein: 0,
      carbs: 0,
      fat: 0,
      sportSessions,
    };
  }

  const nutrition = calculateTotalMealPlanNutrition(plan);
  const deficit =
    goals.targetCalories !== null
      ? goals.targetCalories + sportCalories - nutrition.calories
      : null;

  return {
    date,
    hasData: true,
    eatenCalories: nutrition.calories,
    sportCalories,
    deficit,
    protein: nutrition.protein,
    carbs: nutrition.carbs,
    fat: nutrition.fat,
    sportSessions,
  };
}

/**
 * Aggregate weekly meal plan data into a typed WeeklyStats summary.
 * Always returns exactly 7 DayStats entries (Mon–Sun).
 * Unlogged days (no dishes, no temporaryMeals) have hasData: false and are
 * excluded from averages and deficit — but their sport calories are still counted.
 */
export function aggregateWeeklyStats(
  weekStartDate: string,
  mealPlans: MealPlan[],
  goals: ResolvedGoals
): WeeklyStats {
  const weekStart = parseISO(weekStartDate);
  const weekEnd = endOfISOWeek(weekStart);

  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const planByDate = new Map<string, MealPlan>(
    mealPlans.map((p) => [p.date, p])
  );

  const days: DayStats[] = weekDays.map((day) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const plan = planByDate.get(dateStr) ?? null;
    return buildDayStats(dateStr, plan, goals);
  });

  const loggedDays = days.filter((d) => d.hasData);
  const loggedDayCount = loggedDays.length;

  const totalEatenCalories = loggedDays.reduce(
    (sum, d) => sum + d.eatenCalories,
    0
  );
  const totalSportCalories = days.reduce((sum, d) => sum + d.sportCalories, 0);
  const totalSportSessions = days.reduce(
    (sum, d) => sum + d.sportSessions,
    0
  );

  const hasCalorieGoal = goals.targetCalories !== null;
  const totalDeficit = hasCalorieGoal
    ? loggedDays.reduce((sum, d) => sum + (d.deficit ?? 0), 0)
    : null;

  const avgEatenCalories =
    loggedDayCount > 0 ? totalEatenCalories / loggedDayCount : null;

  return {
    weekStartDate,
    days,
    goals,
    totalEatenCalories,
    totalSportCalories,
    totalSportSessions,
    totalDeficit,
    loggedDayCount,
    avgEatenCalories,
  };
}
