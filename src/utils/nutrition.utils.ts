import type { DishIngredient, TemporaryMeal, SportActivity, MealPlan } from "../types";

export interface NutritionValues {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const ZERO_NUTRITION: NutritionValues = { calories: 0, protein: 0, carbs: 0, fat: 0 };

/** Calculate nutrition for dishes with quantity multiplier. */
export function calculateDishNutrition(
  dishes: Array<{ calories: number; protein?: number; carbs?: number; fat?: number; quantity?: number }>
): NutritionValues {
  return dishes.reduce<NutritionValues>((total, dish) => {
    const quantity = dish.quantity ?? 1;
    return {
      calories: total.calories + (dish.calories || 0) * quantity,
      protein: total.protein + (dish.protein || 0) * quantity,
      carbs: total.carbs + (dish.carbs || 0) * quantity,
      fat: total.fat + (dish.fat || 0) * quantity,
    };
  }, { ...ZERO_NUTRITION });
}

/** Calculate nutrition for ingredients using nutritionUnit-based factor. */
export function calculateIngredientNutrition(ingredients: DishIngredient[]): NutritionValues {
  return ingredients.reduce((acc, ingredient) => {
    const nutritionUnitValue =
      parseFloat(ingredient.nutritionUnit.replace(/[^0-9.]/g, "")) || 100;
    const factor = ingredient.quantity / nutritionUnitValue;

    return {
      calories: acc.calories + ingredient.caloriesPerUnit * factor,
      protein: acc.protein + ingredient.proteinPerUnit * factor,
      carbs: acc.carbs + ingredient.carbsPerUnit * factor,
      fat: acc.fat + ingredient.fatPerUnit * factor,
    };
  }, { ...ZERO_NUTRITION });
}

/** Calculate nutrition for temporary meals. */
export function calculateTemporaryMealNutrition(meals: TemporaryMeal[]): NutritionValues {
  return meals.reduce(
    (total, meal) => ({
      calories: total.calories + meal.calories,
      protein: total.protein + meal.protein,
      carbs: total.carbs + meal.carbs,
      fat: total.fat + meal.fat,
    }),
    { ...ZERO_NUTRITION }
  );
}

/** Calculate combined nutrition for an entire MealPlan (dishes + temporary meals). */
export function calculateTotalMealPlanNutrition(mealPlan: MealPlan): NutritionValues {
  const allDishes = [
    ...mealPlan.breakfast,
    ...mealPlan.lunch,
    ...mealPlan.dinner,
    ...mealPlan.snacks,
  ];

  const dishNutrition = calculateDishNutrition(allDishes);
  const tempMealNutrition = calculateTemporaryMealNutrition(mealPlan.temporaryMeals || []);

  return {
    calories: dishNutrition.calories + tempMealNutrition.calories,
    protein: dishNutrition.protein + tempMealNutrition.protein,
    carbs: dishNutrition.carbs + tempMealNutrition.carbs,
    fat: dishNutrition.fat + tempMealNutrition.fat,
  };
}

/** Sum burned calories from sport activities. */
export function calculateTotalBurnedCalories(activities: SportActivity[]): number {
  return activities.reduce((total, activity) => total + activity.calories, 0);
}
