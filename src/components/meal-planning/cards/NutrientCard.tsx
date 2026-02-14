interface NutrientCardProps {
  title: string;
  currentValue: number;
  targetValue: number | null;
}

export const NutrientCard = ({
  title,
  currentValue,
  targetValue,
}: NutrientCardProps) => {
  const getNutrientPercentage = (
    current: number,
    goal: number | null
  ): string => {
    if (!goal) return "";
    return `${Math.round((current / goal) * 100)}%`;
  };

  return (
    <div className="card p-4">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="text-2xl font-bold">
        {currentValue.toFixed(1)}g
        {targetValue && (
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {getNutrientPercentage(currentValue, targetValue)}
          </span>
        )}
      </div>
    </div>
  );
};
