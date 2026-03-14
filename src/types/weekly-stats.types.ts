export interface DayStats {
  date: string; // "yyyy-MM-dd"
  hasData: boolean; // true only if >=1 dish OR temporaryMeal
  eatenCalories: number; // 0 if !hasData
  sportCalories: number; // always sum of activities (even if !hasData)
  deficit: number | null; // null if !hasData or no calorie goal
  protein: number; // 0 if !hasData
  carbs: number;
  fat: number;
  sportSessions: number; // count of SportActivity objects
}

export interface ResolvedGoals {
  baseCalories: number | null;
  targetCalories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

export interface WeeklyStats {
  weekStartDate: string;
  days: DayStats[]; // always 7 entries, Mon-Sun
  goals: ResolvedGoals;
  totalEatenCalories: number; // sum of logged days only
  totalSportCalories: number; // sum of ALL days (logged + unlogged)
  totalSportSessions: number; // count of ALL sport activities across week
  totalDeficit: number | null; // null if no goal; sum of logged day deficits
  loggedDayCount: number;
  avgEatenCalories: number | null; // null if loggedDayCount === 0
}
