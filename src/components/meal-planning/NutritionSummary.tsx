import { calculateEffectiveTarget } from "../../utils/nutrition.utils";

interface NutritionSummaryProps {
  currentNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  nutritionGoals: {
    baseCalories: number | null;
    targetCalories: number | null;
    protein: number | null;
    carbs: number | null;
    fat: number | null;
  };
  burnedCalories: number;
  useGarminTargetCalories?: boolean;
  garminTotalCalories?: number | null;
  date: string; // YYYY-MM-DD
}

export const NutritionSummary = ({
  currentNutrition,
  nutritionGoals,
  burnedCalories,
  useGarminTargetCalories = false,
  garminTotalCalories = null,
  date,
}: NutritionSummaryProps) => {
  const { effectiveTarget: effectiveTargetCalories, isGarminBased } =
    calculateEffectiveTarget({
      targetCalories: nutritionGoals.targetCalories,
      baseCalories: nutritionGoals.baseCalories,
      burnedCalories,
      useGarminTargetCalories,
      garminTotalCalories,
    });

  const deficit =
    effectiveTargetCalories !== null
      ? effectiveTargetCalories - currentNutrition.calories
      : null;

  // Projected end-of-day calories: remaining hours × resting cal/hour
  const today = new Date().toISOString().slice(0, 10);
  const isToday = date === today;
  const baseCalories = nutritionGoals.baseCalories;
  const projectedRemaining = (() => {
    if (!isToday || !isGarminBased || effectiveTargetCalories === null || !baseCalories) {
      return null;
    }
    const now = new Date();
    const remainingHours = (24 - now.getHours()) - now.getMinutes() / 60;
    if (remainingHours <= 0) return null;
    const restPerHour = baseCalories / 24;
    const projectedEndOfDay = effectiveTargetCalories + Math.round(restPerHour * remainingHours);
    return projectedEndOfDay - currentNutrition.calories;
  })();

  return (
    <div className="text-center py-4">
      {/* Calorie Hero */}
      <div className="font-display font-black text-8xl leading-none tabular-nums">
        {currentNutrition.calories.toFixed(0)}
      </div>
      <div className="text-muted-foreground mt-1 text-sm">
        {effectiveTargetCalories
          ? `von ${effectiveTargetCalories.toFixed(0)} kcal`
          : "kcal"}
        {isGarminBased && (
          <span className="ml-1 text-green-600 dark:text-green-400">(Garmin)</span>
        )}
        {!isGarminBased && burnedCalories > 0 && (
          <span className="ml-1">
            (+{burnedCalories.toFixed(0)} Sport)
          </span>
        )}
      </div>

      {/* Deficit */}
      {deficit !== null && (
        <div className="text-xs text-muted-foreground mt-1">
          {deficit >= 0
            ? `Noch ${deficit.toFixed(0)} kcal übrig`
            : `${Math.abs(deficit).toFixed(0)} kcal drüber`}
        </div>
      )}

      {/* Projected end-of-day deficit (Garmin, today only) */}
      {projectedRemaining !== null && (
        <div className="text-xs text-muted-foreground mt-0.5">
          {projectedRemaining >= 0
            ? `~${projectedRemaining.toFixed(0)} kcal bis Tagesende`
            : `~${Math.abs(projectedRemaining).toFixed(0)} kcal drüber bis Tagesende`}
        </div>
      )}

      {/* Macro Bar */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div>
          <div className="font-display font-extrabold text-2xl tabular-nums text-protein">
            {currentNutrition.protein.toFixed(0)}
            <span className="text-sm font-normal ml-0.5">g</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Protein
            {nutritionGoals.protein && (
              <span className="ml-1">
                / {nutritionGoals.protein}g
              </span>
            )}
          </div>
        </div>
        <div>
          <div className="font-display font-extrabold text-2xl tabular-nums text-carbs">
            {currentNutrition.carbs.toFixed(0)}
            <span className="text-sm font-normal ml-0.5">g</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Kohlenhydrate
            {nutritionGoals.carbs && (
              <span className="ml-1">
                / {nutritionGoals.carbs}g
              </span>
            )}
          </div>
        </div>
        <div>
          <div className="font-display font-extrabold text-2xl tabular-nums text-fat">
            {currentNutrition.fat.toFixed(0)}
            <span className="text-sm font-normal ml-0.5">g</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Fett
            {nutritionGoals.fat && (
              <span className="ml-1">
                / {nutritionGoals.fat}g
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
