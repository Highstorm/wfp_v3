import type { Dish } from "./dish.types";

export interface SportActivity {
  calories: number;
  description?: string;
  intervalsId?: string;
}

export interface TemporaryMeal {
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealPlan {
  id: string;
  date: string;
  breakfast: Dish[];
  lunch: Dish[];
  dinner: Dish[];
  snacks: Dish[];
  sports: SportActivity[];
  temporaryMeals: TemporaryMeal[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  dailyNote: string;
  stomachPainLevel?: number;
}
