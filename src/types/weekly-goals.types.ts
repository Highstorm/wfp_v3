export interface WeeklyNutritionGoals {
  id?: string;
  weekStartDate: string;
  targetCalories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
