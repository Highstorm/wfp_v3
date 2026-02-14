interface DeficitCardProps {
  currentCalories: number;
  nutritionGoals: {
    baseCalories: number | null;
    targetCalories: number | null;
  };
  burnedCalories: number;
}

export const DeficitCard = ({
  currentCalories,
  nutritionGoals,
  burnedCalories,
}: DeficitCardProps) => {
  // Berechne die effektiven Zielkalorien
  const effectiveTargetCalories = nutritionGoals.targetCalories
    ? nutritionGoals.targetCalories + burnedCalories
    : nutritionGoals.baseCalories
    ? nutritionGoals.baseCalories + burnedCalories
    : null;

  // Berechne das Defizit
  const deficit =
    effectiveTargetCalories !== null
      ? effectiveTargetCalories - currentCalories
      : null;

  return (
    <div className="card p-4">
      <div className="text-sm text-muted-foreground">Defizit</div>
      <div className={`text-2xl font-bold`}>
        {deficit !== null ? deficit.toFixed(1) + " kcal" : "N/A"}
      </div>
      {effectiveTargetCalories !== null && deficit !== null && (
        <div
          className={`text-sm text-muted-foreground`}
        >{`(${effectiveTargetCalories.toFixed(1)} kcal) - ${currentCalories.toFixed(1)} kcal = ${deficit.toFixed(1)} kcal`}</div>
      )}
    </div>
  );
};
