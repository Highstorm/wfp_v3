import { cn } from "../../lib/utils";

interface WeeklySummaryCardsProps {
  totalEatenCalories: number;
  totalDeficit: number | null;
  totalSportCalories: number;
  totalSportSessions: number;
}

export function WeeklySummaryCards({
  totalEatenCalories,
  totalDeficit,
  totalSportCalories,
  totalSportSessions,
}: WeeklySummaryCardsProps) {
  const deficitColor =
    totalDeficit === null
      ? ""
      : totalDeficit >= 0
      ? "text-success"
      : "text-destructive";

  return (
    <div className="grid grid-cols-3 gap-3">
      {/* Kalorien */}
      <div className="card p-4">
        <div className="text-sm text-muted-foreground mb-1">Kalorien</div>
        <div className="text-2xl font-bold tabular-nums font-display">
          {totalEatenCalories === 0 ? "–" : totalEatenCalories.toFixed(0)}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">kcal</div>
      </div>

      {/* Defizit */}
      <div className="card p-4">
        <div className="text-sm text-muted-foreground mb-1">Defizit</div>
        <div className={cn("text-2xl font-bold tabular-nums font-display", deficitColor)}>
          {totalDeficit === null ? "–" : totalDeficit.toFixed(0)}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">kcal</div>
      </div>

      {/* Sport */}
      <div className="card p-4">
        <div className="text-sm text-muted-foreground mb-1">Sport</div>
        <div className="text-2xl font-bold tabular-nums font-display">
          {totalSportSessions === 0 ? "–" : totalSportCalories.toFixed(0)}
        </div>
        {totalSportSessions > 0 ? (
          <div className="text-xs text-muted-foreground mt-0.5">
            {totalSportSessions} {totalSportSessions === 1 ? "Session" : "Sessions"}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground mt-0.5">kcal</div>
        )}
      </div>
    </div>
  );
}
