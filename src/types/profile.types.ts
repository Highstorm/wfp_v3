export interface NutritionGoals {
  baseCalories: number | null;
  targetCalories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

export interface UserProfile {
  baseCalories?: number | null;
  targetCalories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
  stomachPainTrackingEnabled?: boolean;
  weeklyNutritionGoalsEnabled?: boolean;
  dailyNoteEnabled?: boolean;
  sportEnabled?: boolean;
  porridgeCalculatorEnabled?: boolean;
  dishIngredientBuilderEnabled?: boolean;
  "intervals.icu-API-KEY"?: string;
  "intervals.icu-AthleteID"?: string;
  garminConnected?: boolean;
  garminConnectedAt?: unknown; // Firestore Timestamp
  useGarminTargetCalories?: boolean;
  garminDailySummaries?: Record<string, GarminDailySummary> | null;
}

export interface GarminDailySummary {
  totalCalories: number;
  activeCalories: number;
  bmrCalories: number;
  syncedAt: unknown; // Firestore Timestamp from server, unknown to avoid coupling
}
