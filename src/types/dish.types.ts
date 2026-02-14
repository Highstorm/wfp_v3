export interface DishIngredient {
  name: string;
  barcode?: string;
  quantity: number;
  unit: string;
  nutritionUnit: string;
  caloriesPerUnit: number;
  proteinPerUnit: number;
  carbsPerUnit: number;
  fatPerUnit: number;
  sourceName?: string;
  sourceUrl?: string;
}

export interface Dish {
  id: string;
  originalId?: string;
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  recipe?: string;
  recipeUrl?: string;
  createdBy: string;
  quantity?: number;
  category?: "breakfast" | "mainDish" | "snack";
  rating?: number;
  ingredients?: DishIngredient[];
  isIngredientBased?: boolean;
}
