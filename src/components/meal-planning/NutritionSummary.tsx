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
}

export const NutritionSummary = ({
  currentNutrition,
  nutritionGoals,
  burnedCalories,
}: NutritionSummaryProps) => {
  const effectiveTargetCalories = nutritionGoals.targetCalories
    ? nutritionGoals.targetCalories + burnedCalories
    : nutritionGoals.baseCalories
    ? nutritionGoals.baseCalories + burnedCalories
    : null;

  const deficit =
    effectiveTargetCalories !== null
      ? effectiveTargetCalories - currentNutrition.calories
      : null;

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
        {burnedCalories > 0 && (
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
