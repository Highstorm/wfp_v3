import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { TooltipProps } from "recharts";
import { toChartData, CHART_COLORS } from "../../utils/stats.utils";
import type { DayStats } from "../../types";
import type { ResolvedGoals } from "../../types/weekly-stats.types";
import type { ChartDataPoint } from "../../utils/stats.utils";

interface WeeklyBarChartProps {
  days: DayStats[];
  goals: ResolvedGoals;
  loggedDayCount: number;
}

function isDarkMode(): boolean {
  return (
    document.documentElement.classList.contains("dark") ||
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function getBarColor(point: ChartDataPoint, targetCalories: number | null): string {
  const colors = isDarkMode() ? "dark" : "light";
  if (point.isStub) return CHART_COLORS.muted[colors];
  if (targetCalories !== null && point.eatenCalories > targetCalories) {
    return CHART_COLORS.destructive[colors];
  }
  return CHART_COLORS.success[colors];
}

interface TooltipPayload {
  payload: ChartDataPoint;
}

function WeeklyChartTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;

  const data = (payload[0] as TooltipPayload).payload;
  if (data.isStub) return null;

  return (
    <div className="card p-3 text-sm shadow-md">
      <div className="font-medium mb-1">{data.date}</div>
      <div>{data.eatenCalories.toFixed(0)} kcal gegessen</div>
      {data.sportCalories > 0 && (
        <div className="text-success">+{data.sportCalories.toFixed(0)} Sport</div>
      )}
      {data.deficit !== null && (
        <div className={data.deficit >= 0 ? "text-success" : "text-destructive"}>
          {data.deficit.toFixed(0)} Defizit
        </div>
      )}
    </div>
  );
}

export function WeeklyBarChart({ days, goals, loggedDayCount }: WeeklyBarChartProps) {
  const navigate = useNavigate();
  const chartData = toChartData(days);

  function handleBarClick(entry: ChartDataPoint) {
    navigate(`/day-planning?date=${entry.date}`);
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData}>
          <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={36} />
          {goals.targetCalories !== null && (
            <ReferenceLine
              y={goals.targetCalories}
              stroke="hsl(215, 16%, 47%)"
              strokeDasharray="4 4"
            />
          )}
          <Tooltip content={<WeeklyChartTooltip />} />
          <Bar
            dataKey="eatenCalories"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
            cursor="pointer"
            animationBegin={0}
            onClick={(entry: ChartDataPoint) => handleBarClick(entry)}
          >
            {chartData.map((point, index) => (
              <Cell
                key={index}
                fill={getBarColor(point, goals.targetCalories)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {loggedDayCount === 0 && (
        <p className="text-center text-sm text-muted-foreground mt-2">
          Keine Daten für diese Woche. Starte mit der Tagesplanung!
        </p>
      )}
    </div>
  );
}
