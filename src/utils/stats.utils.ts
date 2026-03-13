import { getISOWeek, addDays, format } from "date-fns";
import { de } from "date-fns/locale";
import type { DayStats } from "../types";

// --- Constants -----------------------------------------------------

export const DAY_LABELS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"] as const;

/** Fixed kcal-unit height for unlogged day bars in the chart */
export const STUB_HEIGHT = 24;

/**
 * Explicit HSL strings for chart fill attributes.
 * CSS variables cannot be resolved inside Recharts SVG, so we hardcode
 * the values from index.css here.
 */
export const CHART_COLORS = {
  success: {
    light: "hsl(142, 72%, 37%)",
    dark: "hsl(142, 70%, 45%)",
  },
  destructive: {
    light: "hsl(0, 84%, 60%)",
    dark: "hsl(0, 91%, 71%)",
  },
  muted: {
    light: "hsl(210, 40%, 96%)",
    dark: "hsl(217, 33%, 17%)",
  },
} as const;

// --- Types ---------------------------------------------------------

export interface ChartDataPoint {
  label: string;     // "Mo", "Di", etc.
  date: string;      // "yyyy-MM-dd"
  eatenCalories: number; // actual or STUB_HEIGHT
  isStub: boolean;
  sportCalories: number;
  deficit: number | null;
}

// --- Functions -----------------------------------------------------

/**
 * Formats a Monday date as "KW N · D.–D. Mmm" (German).
 * Example: 2026-03-09 → "KW 11 · 9.–15. Mär"
 */
export function formatWeekLabel(weekStart: Date): string {
  const weekNumber = getISOWeek(weekStart);
  const weekEnd = addDays(weekStart, 6);

  const startDay = format(weekStart, "d");
  const endDay = format(weekEnd, "d");
  // Use LLL (abbreviated without inflection) and strip trailing dot if present
  const rawMonth = format(weekEnd, "LLL", { locale: de });
  const month = rawMonth.endsWith(".") ? rawMonth.slice(0, -1) : rawMonth;

  return `KW ${weekNumber} · ${startDay}.–${endDay}. ${month}`;
}

/**
 * Calculates a macro as a percentage of the goal, averaged over logged days.
 * Returns null if goal is null/0 or no logged days exist.
 */
export function calcMacroPercent(
  days: DayStats[],
  goal: number | null,
  accessor: (d: DayStats) => number
): number | null {
  if (goal === null || goal === 0) return null;

  const loggedDays = days.filter((d) => d.hasData);
  if (loggedDays.length === 0) return null;

  const avg = loggedDays.reduce((sum, d) => sum + accessor(d), 0) / loggedDays.length;
  return Math.round((avg / goal) * 100);
}

/**
 * Maps 7 DayStats to chart-ready objects.
 * Unlogged days get a fixed stub height and isStub: true.
 */
export function toChartData(days: DayStats[]): ChartDataPoint[] {
  return days.map((day, index) => ({
    label: DAY_LABELS[index],
    date: day.date,
    eatenCalories: day.hasData ? day.eatenCalories : STUB_HEIGHT,
    isStub: !day.hasData,
    sportCalories: day.sportCalories,
    deficit: day.deficit,
  }));
}
