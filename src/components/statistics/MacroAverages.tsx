import { calcMacroPercent } from "../../utils/stats.utils";
import type { DayStats } from "../../types";
import type { ResolvedGoals } from "../../types/weekly-stats.types";

interface MacroAveragesProps {
  days: DayStats[];
  goals: ResolvedGoals;
  loggedDayCount: number;
}

export function MacroAverages({ days, goals, loggedDayCount }: MacroAveragesProps) {
  if (loggedDayCount === 0) return null;

  const proteinPct = calcMacroPercent(days, goals.protein, (d) => d.protein);
  const carbsPct = calcMacroPercent(days, goals.carbs, (d) => d.carbs);
  const fatPct = calcMacroPercent(days, goals.fat, (d) => d.fat);

  return (
    <div className="card p-4">
      <div className="text-sm text-muted-foreground mb-3">Makros Ø</div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <div className="text-2xl font-bold tabular-nums font-display text-protein">
            {proteinPct !== null ? `${proteinPct}%` : "–"}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">Protein</div>
        </div>
        <div>
          <div className="text-2xl font-bold tabular-nums font-display text-carbs">
            {carbsPct !== null ? `${carbsPct}%` : "–"}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">Kohlenhydrate</div>
        </div>
        <div>
          <div className="text-2xl font-bold tabular-nums font-display text-fat">
            {fatPct !== null ? `${fatPct}%` : "–"}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">Fett</div>
        </div>
      </div>
    </div>
  );
}
