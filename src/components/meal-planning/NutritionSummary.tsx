import { CalorieCard } from "./cards/CalorieCard";
import { DeficitCard } from "./cards/DeficitCard";
import { NutrientCard } from "./cards/NutrientCard";

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
  const getNutrientPercentage = (
    current: number,
    goal: number | null
  ): string => {
    if (!goal) return "";
    return `${Math.round((current / goal) * 100)}%`;
  };

  return (
    <div className="mt-2">
      {/* Desktop Layout */}
      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <CalorieCard
          currentCalories={currentNutrition.calories}
          nutritionGoals={nutritionGoals}
          burnedCalories={burnedCalories}
        />
        <DeficitCard
          currentCalories={currentNutrition.calories}
          nutritionGoals={nutritionGoals}
          burnedCalories={burnedCalories}
        />
        <NutrientCard
          title="Protein"
          currentValue={currentNutrition.protein}
          targetValue={nutritionGoals.protein}
          colorVar="--color-protein"
        />
        <NutrientCard
          title="Kohlenhydrate"
          currentValue={currentNutrition.carbs}
          targetValue={nutritionGoals.carbs}
          colorVar="--color-carbs"
        />
        <NutrientCard
          title="Fette"
          currentValue={currentNutrition.fat}
          targetValue={nutritionGoals.fat}
          colorVar="--color-fat"
        />
      </div>

      {/* Mobile Layout */}
      <div className="sm:hidden">
        <div className="card p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Kalorien</div>
              <div className="text-xl font-bold">
                {currentNutrition.calories.toFixed(1)} kcal
                {nutritionGoals.targetCalories && (
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    / {(nutritionGoals.targetCalories + burnedCalories).toFixed(1)} kcal
                  </span>
                )}
              </div>
              {burnedCalories > 0 && (
                <div className="text-xs text-muted-foreground">
                  + {burnedCalories.toFixed(1)} kcal Sport
                </div>
              )}
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Defizit</div>
              <div className="text-xl font-bold">
                {nutritionGoals.targetCalories
                  ? (
                      nutritionGoals.targetCalories +
                      burnedCalories -
                      currentNutrition.calories
                    ).toFixed(1)
                  : nutritionGoals.baseCalories
                  ? (
                      nutritionGoals.baseCalories +
                      burnedCalories -
                      currentNutrition.calories
                    ).toFixed(1)
                  : "N/A"}{" "}
                kcal
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Protein</div>
              <div className="text-xl font-bold">
                {currentNutrition.protein.toFixed(1)}g
                {nutritionGoals.protein && (
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    {getNutrientPercentage(
                      currentNutrition.protein,
                      nutritionGoals.protein
                    )}
                  </span>
                )}
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">KH</div>
              <div className="text-xl font-bold">
                {currentNutrition.carbs.toFixed(1)}g
                {nutritionGoals.carbs && (
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    {getNutrientPercentage(
                      currentNutrition.carbs,
                      nutritionGoals.carbs
                    )}
                  </span>
                )}
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Fett</div>
              <div className="text-xl font-bold">
                {currentNutrition.fat.toFixed(1)}g
                {nutritionGoals.fat && (
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    {getNutrientPercentage(
                      currentNutrition.fat,
                      nutritionGoals.fat
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
