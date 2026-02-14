interface CalorieCardProps {
  currentCalories: number;
  nutritionGoals: {
    baseCalories: number | null;
    targetCalories: number | null;
  };
  burnedCalories: number;
}

export const CalorieCard = ({
  currentCalories,
  nutritionGoals,
  burnedCalories,
}: CalorieCardProps) => {
  const getCaloriesColor = (calories: number): string => {
    // Berechne die Zielkalorien (targetCalories + Sport oder baseCalories + Sport)
    const effectiveTargetCalories = nutritionGoals.targetCalories
      ? nutritionGoals.targetCalories + burnedCalories
      : nutritionGoals.baseCalories
      ? nutritionGoals.baseCalories + burnedCalories
      : null;

    // Wenn keine Zielkalorien definiert sind, zeige rot
    if (!effectiveTargetCalories) return "text-red-600";

    // Berechne den erlaubten Bereich (±10%)
    const minAllowedCalories = effectiveTargetCalories * 0.9;
    const maxAllowedCalories = effectiveTargetCalories * 1.1;

    // Wenn innerhalb des ±10% Bereichs, zeige grün
    if (calories >= minAllowedCalories && calories <= maxAllowedCalories) {
      return "text-green-600";
    }

    // Ansonsten zeige rot
    return "text-red-600";
  };

  const adjustedTargetCalories = nutritionGoals.targetCalories
    ? nutritionGoals.targetCalories + burnedCalories
    : null;

  const renderInfoText = () => {
    // Zeige InfoText nur wenn burnedCalories > 0
    if (!burnedCalories || burnedCalories <= 0) return null;

    // Wenn targetCalories gesetzt sind
    if (nutritionGoals.targetCalories) {
      return (
        <div className="text-sm text-muted-foreground">
          Ziel: {nutritionGoals.targetCalories.toFixed(1)} kcal
          <span className="text-xs">
            {" "}
            + {burnedCalories.toFixed(1)} kcal Sport ={" "}
            {(nutritionGoals.targetCalories + burnedCalories).toFixed(1)} kcal
          </span>
        </div>
      );
    }

    // Wenn nur baseCalories gesetzt sind
    if (nutritionGoals.baseCalories) {
      return (
        <div className="text-sm text-muted-foreground">
          Grundbedarf: {nutritionGoals.baseCalories.toFixed(1)} kcal
          <span className="text-xs">
            {" "}
            + {burnedCalories.toFixed(1)} kcal Sport ={" "}
            {(nutritionGoals.baseCalories + burnedCalories).toFixed(1)} kcal
          </span>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="card p-4">
      <div className="text-sm text-muted-foreground">Kalorien</div>
      <div
        className={`text-2xl font-bold ${getCaloriesColor(currentCalories)}`}
      >
        {currentCalories.toFixed(1)} kcal
        {adjustedTargetCalories && (
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            / {adjustedTargetCalories.toFixed(1)} kcal
          </span>
        )}
      </div>
      {renderInfoText()}
    </div>
  );
};
