/**
 * @deprecated Import types from "../types" and hooks from "../hooks" instead.
 * This file only provides backward-compatible re-exports.
 */

// @deprecated — use imports from "../types" directly
export type {
  DishIngredient,
  Dish,
  SportActivity,
  TemporaryMeal,
  MealPlan,
  NutritionGoals,
  UserProfile,
  WeeklyNutritionGoals,
  SharedDish,
} from "../types";

// @deprecated — use imports from "../hooks" directly
export {
  useDishes,
  useDish,
  useCreateDish,
  useUpdateDish,
  useDeleteDish,
  useUpdateDishRating,
  useMealPlans,
  useMealPlan,
  useMealPlanByDate,
  useCreateMealPlan,
  useUpdateMealPlan,
  useDeleteMealPlan,
  useNutritionGoals,
  useWeeklyNutritionGoals,
  useCreateWeeklyNutritionGoals,
  useUpdateWeeklyNutritionGoals,
  useDeleteWeeklyNutritionGoals,
  useShareDish,
  useGetSharedDishByCode,
  useImportSharedDish,
} from "../hooks";
