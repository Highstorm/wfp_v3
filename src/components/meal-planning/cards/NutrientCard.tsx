import { cn } from "../../../lib/utils";

interface NutrientCardProps {
  title: string;
  currentValue: number;
  targetValue: number | null;
  colorVar?: string;
}

export const NutrientCard = ({
  title,
  currentValue,
  targetValue,
  colorVar,
}: NutrientCardProps) => {
  const percentage = targetValue
    ? Math.round((currentValue / targetValue) * 100)
    : 0;
  const isOver = targetValue && currentValue > targetValue * 1.1;
  const barWidth = targetValue
    ? Math.min((currentValue / targetValue) * 100, 100)
    : 0;

  return (
    <div className="card p-4">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-sm text-muted-foreground">{title}</span>
        {targetValue && (
          <span
            className={cn(
              "text-xs font-medium tabular-nums",
              isOver ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {percentage}%
          </span>
        )}
      </div>
      <div className="text-xl font-bold tabular-nums text-foreground">
        {currentValue.toFixed(1)}
        <span className="text-sm font-normal text-muted-foreground ml-0.5">
          g
        </span>
        {targetValue && (
          <span className="ml-1 text-sm font-normal text-muted-foreground">
            / {targetValue.toFixed(0)}g
          </span>
        )}
      </div>
      {targetValue && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500 ease-out",
              isOver && "bg-destructive"
            )}
            style={{
              width: `${barWidth}%`,
              ...(colorVar && !isOver
                ? { backgroundColor: `hsl(var(${colorVar}))` }
                : !isOver
                ? { backgroundColor: "hsl(var(--primary))" }
                : {}),
            }}
          />
        </div>
      )}
    </div>
  );
};
