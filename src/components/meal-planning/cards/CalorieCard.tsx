import { cn } from "../../../lib/utils";

interface CalorieCardProps {
  currentCalories: number;
  nutritionGoals: {
    baseCalories: number | null;
    targetCalories: number | null;
  };
  burnedCalories: number;
}

function CalorieRing({
  value,
  max,
  size = 80,
  strokeWidth = 6,
}: {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = max > 0 ? Math.min(value / max, 1.5) : 0;
  const offset = circumference - percentage * circumference;
  const isOver = value > max * 1.1;
  const isOnTarget = value >= max * 0.9 && value <= max * 1.1;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="hsl(var(--muted))"
        strokeWidth={strokeWidth}
      />
      {/* Progress ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={
          isOver
            ? "hsl(var(--destructive))"
            : isOnTarget
            ? "hsl(var(--success))"
            : "hsl(var(--color-calories))"
        }
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-500 ease-out"
      />
    </svg>
  );
}

export const CalorieCard = ({
  currentCalories,
  nutritionGoals,
  burnedCalories,
}: CalorieCardProps) => {
  const effectiveTargetCalories = nutritionGoals.targetCalories
    ? nutritionGoals.targetCalories + burnedCalories
    : nutritionGoals.baseCalories
    ? nutritionGoals.baseCalories + burnedCalories
    : null;

  const isOnTarget =
    effectiveTargetCalories &&
    currentCalories >= effectiveTargetCalories * 0.9 &&
    currentCalories <= effectiveTargetCalories * 1.1;

  const isOver =
    effectiveTargetCalories && currentCalories > effectiveTargetCalories * 1.1;

  const adjustedTargetCalories = nutritionGoals.targetCalories
    ? nutritionGoals.targetCalories + burnedCalories
    : null;

  const renderInfoText = () => {
    if (!burnedCalories || burnedCalories <= 0) return null;

    if (nutritionGoals.targetCalories) {
      return (
        <div className="text-xs text-muted-foreground">
          Ziel: {nutritionGoals.targetCalories.toFixed(0)} + {burnedCalories.toFixed(0)} Sport ={" "}
          {(nutritionGoals.targetCalories + burnedCalories).toFixed(0)} kcal
        </div>
      );
    }

    if (nutritionGoals.baseCalories) {
      return (
        <div className="text-xs text-muted-foreground">
          Bedarf: {nutritionGoals.baseCalories.toFixed(0)} + {burnedCalories.toFixed(0)} Sport ={" "}
          {(nutritionGoals.baseCalories + burnedCalories).toFixed(0)} kcal
        </div>
      );
    }

    return null;
  };

  return (
    <div className="card p-4">
      <div className="flex items-center gap-4">
        {effectiveTargetCalories && (
          <div className="relative shrink-0">
            <CalorieRing
              value={currentCalories}
              max={effectiveTargetCalories}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-semibold tabular-nums text-foreground">
                {effectiveTargetCalories > 0
                  ? Math.round((currentCalories / effectiveTargetCalories) * 100)
                  : 0}
                %
              </span>
            </div>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-sm text-muted-foreground">Kalorien</div>
          <div
            className={cn(
              "text-2xl font-bold tabular-nums",
              isOver
                ? "text-destructive"
                : isOnTarget
                ? "text-success"
                : "text-foreground"
            )}
          >
            {currentCalories.toFixed(0)}
            <span className="text-sm font-normal text-muted-foreground ml-1">
              kcal
            </span>
            {adjustedTargetCalories && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                / {adjustedTargetCalories.toFixed(0)}
              </span>
            )}
          </div>
          {renderInfoText()}
        </div>
      </div>
    </div>
  );
};
