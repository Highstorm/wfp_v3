import { describe, it, expect } from "vitest";
import {
  formatWeekLabel,
  calcMacroPercent,
  toChartData,
  CHART_COLORS,
  DAY_LABELS,
} from "../stats.utils";
import type { DayStats } from "../../types";

// --- helpers -------------------------------------------------------

function makeDay(overrides: Partial<DayStats> = {}): DayStats {
  return {
    date: "2026-03-09",
    hasData: false,
    eatenCalories: 0,
    sportCalories: 0,
    deficit: null,
    protein: 0,
    carbs: 0,
    fat: 0,
    sportSessions: 0,
    ...overrides,
  };
}

function makeWeek(overrides: Partial<DayStats>[] = []): DayStats[] {
  const dates = [
    "2026-03-09",
    "2026-03-10",
    "2026-03-11",
    "2026-03-12",
    "2026-03-13",
    "2026-03-14",
    "2026-03-15",
  ];
  return dates.map((date, i) => makeDay({ date, ...overrides[i] }));
}

// --- DAY_LABELS ----------------------------------------------------

describe("DAY_LABELS", () => {
  it("has exactly 7 entries", () => {
    expect(DAY_LABELS).toHaveLength(7);
  });

  it("contains German short day names in order", () => {
    expect(DAY_LABELS).toEqual(["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]);
  });
});

// --- CHART_COLORS --------------------------------------------------

describe("CHART_COLORS", () => {
  it("has success, destructive, muted keys", () => {
    expect(CHART_COLORS).toHaveProperty("success");
    expect(CHART_COLORS).toHaveProperty("destructive");
    expect(CHART_COLORS).toHaveProperty("muted");
  });

  it("each color has light and dark variants", () => {
    for (const key of ["success", "destructive", "muted"] as const) {
      expect(CHART_COLORS[key]).toHaveProperty("light");
      expect(CHART_COLORS[key]).toHaveProperty("dark");
    }
  });

  it("success light matches index.css value", () => {
    expect(CHART_COLORS.success.light).toBe("hsl(142, 72%, 37%)");
  });

  it("success dark matches index.css value", () => {
    expect(CHART_COLORS.success.dark).toBe("hsl(142, 70%, 45%)");
  });

  it("destructive light matches index.css value", () => {
    expect(CHART_COLORS.destructive.light).toBe("hsl(0, 72%, 51%)");
  });

  it("destructive dark matches index.css value", () => {
    expect(CHART_COLORS.destructive.dark).toBe("hsl(0, 63%, 31%)");
  });

  it("muted light matches index.css value", () => {
    expect(CHART_COLORS.muted.light).toBe("hsl(210, 40%, 96%)");
  });

  it("muted dark matches index.css value", () => {
    expect(CHART_COLORS.muted.dark).toBe("hsl(217, 33%, 17%)");
  });
});

// --- formatWeekLabel -----------------------------------------------

describe("formatWeekLabel", () => {
  it("returns correct label for KW 11 (Mon 2026-03-09)", () => {
    expect(formatWeekLabel(new Date("2026-03-09"))).toBe("KW 11 · 9.–15. Mär");
  });

  it("returns correct label for cross-year week (KW 1, Mon 2025-12-29)", () => {
    expect(formatWeekLabel(new Date("2025-12-29"))).toBe("KW 1 · 29.–4. Jan");
  });
});

// --- calcMacroPercent ----------------------------------------------

describe("calcMacroPercent", () => {
  it("returns average percent rounded to integer", () => {
    const days: DayStats[] = [
      makeDay({ hasData: true, protein: 80 }),
      makeDay({ hasData: true, protein: 100 }),
    ];
    expect(calcMacroPercent(days, 100, (d) => d.protein)).toBe(90);
  });

  it("returns null when goal is null", () => {
    const days = [makeDay({ hasData: true, protein: 80 })];
    expect(calcMacroPercent(days, null, (d) => d.protein)).toBeNull();
  });

  it("returns null when goal is 0", () => {
    const days = [makeDay({ hasData: true, protein: 80 })];
    expect(calcMacroPercent(days, 0, (d) => d.protein)).toBeNull();
  });

  it("returns null when no logged days", () => {
    const days = [makeDay({ hasData: false, protein: 80 })];
    expect(calcMacroPercent(days, 100, (d) => d.protein)).toBeNull();
  });

  it("ignores days with hasData: false in average", () => {
    const days: DayStats[] = [
      makeDay({ hasData: true, protein: 80 }),
      makeDay({ hasData: false, protein: 999 }), // should be ignored
    ];
    expect(calcMacroPercent(days, 100, (d) => d.protein)).toBe(80);
  });

  it("rounds to nearest integer", () => {
    // avg = 75, goal = 100 → 75%
    const days = [makeDay({ hasData: true, protein: 75 })];
    expect(calcMacroPercent(days, 100, (d) => d.protein)).toBe(75);
  });

  it("rounds 66.666... to 67", () => {
    const days = [makeDay({ hasData: true, protein: 200 })];
    expect(calcMacroPercent(days, 300, (d) => d.protein)).toBe(67);
  });
});

// --- toChartData ---------------------------------------------------

describe("toChartData", () => {
  it("returns exactly 7 entries", () => {
    const week = makeWeek();
    expect(toChartData(week)).toHaveLength(7);
  });

  it("assigns DAY_LABELS in order", () => {
    const week = makeWeek();
    const result = toChartData(week);
    expect(result.map((d) => d.label)).toEqual(DAY_LABELS);
  });

  it("preserves date values", () => {
    const week = makeWeek();
    const result = toChartData(week);
    expect(result[0].date).toBe("2026-03-09");
    expect(result[6].date).toBe("2026-03-15");
  });

  it("sets isStub: true and eatenCalories = STUB_HEIGHT for unlogged days", () => {
    const week = makeWeek();
    const result = toChartData(week);
    expect(result[0].isStub).toBe(true);
    expect(result[0].eatenCalories).toBe(24); // STUB_HEIGHT
  });

  it("sets isStub: false and actual eatenCalories for logged days", () => {
    const week = makeWeek([{ hasData: true, eatenCalories: 1800 }]);
    const result = toChartData(week);
    expect(result[0].isStub).toBe(false);
    expect(result[0].eatenCalories).toBe(1800);
  });

  it("includes sportCalories from source day", () => {
    const week = makeWeek([{ hasData: true, eatenCalories: 1800, sportCalories: 300 }]);
    const result = toChartData(week);
    expect(result[0].sportCalories).toBe(300);
  });

  it("includes deficit from source day", () => {
    const week = makeWeek([{ hasData: true, eatenCalories: 1800, deficit: 200 }]);
    const result = toChartData(week);
    expect(result[0].deficit).toBe(200);
  });

  it("passes deficit as null for days without data", () => {
    const week = makeWeek();
    const result = toChartData(week);
    expect(result[0].deficit).toBeNull();
  });
});
