import { describe, it, expect } from "vitest";
import { resolveGoals, aggregateWeeklyStats } from "../weekly-stats.utils";
import type { Dish, MealPlan } from "../../types";
import type { WeeklyNutritionGoals } from "../../types";
import type { NutritionGoals } from "../../types";
import type { ResolvedGoals } from "../../types";
import type { GarminDailySummary } from "../../types/profile.types";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const emptyProfileGoals: NutritionGoals = {
  baseCalories: null,
  targetCalories: null,
  protein: null,
  carbs: null,
  fat: null,
};

const fullProfileGoals: NutritionGoals = {
  baseCalories: 2000,
  targetCalories: 2000,
  protein: 150,
  carbs: 200,
  fat: 70,
};

const fullWeeklyGoals: WeeklyNutritionGoals = {
  weekStartDate: "2026-03-09",
  targetCalories: 1800,
  protein: 160,
  carbs: 180,
  fat: 60,
  createdBy: "user1",
  createdAt: new Date("2026-03-09"),
  updatedAt: new Date("2026-03-09"),
};

/** Build a minimal Dish fixture. */
function buildDish(overrides: Partial<Dish> & Pick<Dish, "id" | "name" | "calories">): Dish {
  return {
    createdBy: "user1",
    quantity: 1,
    ...overrides,
  };
}

/** Build a minimal MealPlan for a given date. */
function buildMealPlan(
  date: string,
  overrides: Partial<MealPlan> = {}
): MealPlan {
  return {
    id: `plan-${date}`,
    date,
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: [],
    sports: [],
    temporaryMeals: [],
    createdBy: "user1",
    createdAt: new Date(date),
    updatedAt: new Date(date),
    dailyNote: "",
    ...overrides,
  };
}

const weekStartDate = "2026-03-09"; // Monday

// ---------------------------------------------------------------------------
// resolveGoals
// ---------------------------------------------------------------------------

describe("resolveGoals", () => {
  it("returns weekly goals when weekly goals are fully set", () => {
    const result = resolveGoals(fullWeeklyGoals, fullProfileGoals);
    expect(result.targetCalories).toBe(1800);
    expect(result.protein).toBe(160);
    expect(result.carbs).toBe(180);
    expect(result.fat).toBe(60);
  });

  it("falls back to profile goals when weeklyGoals is null", () => {
    const result = resolveGoals(null, fullProfileGoals);
    expect(result.targetCalories).toBe(2000);
    expect(result.protein).toBe(150);
    expect(result.carbs).toBe(200);
    expect(result.fat).toBe(70);
  });

  it("returns null for each macro when neither weekly nor profile has a value", () => {
    const result = resolveGoals(null, emptyProfileGoals);
    expect(result.targetCalories).toBeNull();
    expect(result.protein).toBeNull();
    expect(result.carbs).toBeNull();
    expect(result.fat).toBeNull();
  });

  it("resolves each macro independently: weekly > profile > null", () => {
    const partialWeekly: WeeklyNutritionGoals = {
      weekStartDate: "2026-03-09",
      targetCalories: null,
      protein: 170,
      carbs: null,
      fat: null,
      createdBy: "user1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const partialProfile: NutritionGoals = {
      baseCalories: null,
      targetCalories: 2100,
      protein: null,
      carbs: 210,
      fat: null,
    };
    const result = resolveGoals(partialWeekly, partialProfile);
    expect(result.targetCalories).toBe(2100); // falls back to profile
    expect(result.protein).toBe(170); // from weekly
    expect(result.carbs).toBe(210); // falls back to profile
    expect(result.fat).toBeNull(); // neither set
  });

  it("treats goal value of 0 as set (uses ?? not ||)", () => {
    const zeroWeekly: WeeklyNutritionGoals = {
      weekStartDate: "2026-03-09",
      targetCalories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      createdBy: "user1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = resolveGoals(zeroWeekly, fullProfileGoals);
    expect(result.targetCalories).toBe(0); // 0 is "set", not null
    expect(result.protein).toBe(0);
    expect(result.carbs).toBe(0);
    expect(result.fat).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// aggregateWeeklyStats
// ---------------------------------------------------------------------------

describe("aggregateWeeklyStats", () => {
  const noGoals: ResolvedGoals = {
    baseCalories: null,
    targetCalories: null,
    protein: null,
    carbs: null,
    fat: null,
  };
  const goals: ResolvedGoals = {
    baseCalories: 1800,
    targetCalories: 2000,
    protein: 150,
    carbs: 200,
    fat: 70,
  };

  it("always returns exactly 7 DayStats entries even with no mealPlans", () => {
    const result = aggregateWeeklyStats(weekStartDate, [], noGoals);
    expect(result.days).toHaveLength(7);
  });

  it("days span Mon through Sun for the given weekStartDate", () => {
    const result = aggregateWeeklyStats(weekStartDate, [], noGoals);
    expect(result.days[0].date).toBe("2026-03-09"); // Monday
    expect(result.days[6].date).toBe("2026-03-15"); // Sunday
  });

  it("a day with no MealPlan document has hasData: false", () => {
    const result = aggregateWeeklyStats(weekStartDate, [], noGoals);
    result.days.forEach((day) => {
      expect(day.hasData).toBe(false);
    });
  });

  it("a day with MealPlan but 0 dishes AND 0 temporaryMeals has hasData: false", () => {
    const emptyPlan = buildMealPlan("2026-03-09"); // no dishes, no temp meals
    const result = aggregateWeeklyStats(weekStartDate, [emptyPlan], noGoals);
    expect(result.days[0].hasData).toBe(false);
  });

  it("a day with at least 1 dish has hasData: true", () => {
    const planWithDish = buildMealPlan("2026-03-09", {
      breakfast: [
        buildDish({ id: "d1", name: "Oats", calories: 300, protein: 10, carbs: 50, fat: 5, quantity: 1 }),
      ],
    });
    const result = aggregateWeeklyStats(weekStartDate, [planWithDish], noGoals);
    expect(result.days[0].hasData).toBe(true);
  });

  it("a day with at least 1 temporaryMeal has hasData: true", () => {
    const planWithTemp = buildMealPlan("2026-03-09", {
      temporaryMeals: [
        { description: "Banana", calories: 90, protein: 1, carbs: 23, fat: 0 },
      ],
    });
    const result = aggregateWeeklyStats(weekStartDate, [planWithTemp], noGoals);
    expect(result.days[0].hasData).toBe(true);
  });

  it("eatenCalories is 0 for unlogged days", () => {
    const result = aggregateWeeklyStats(weekStartDate, [], noGoals);
    result.days.forEach((day) => {
      expect(day.eatenCalories).toBe(0);
    });
  });

  it("eatenCalories equals sum of dish + temporaryMeal calories for logged day", () => {
    const plan = buildMealPlan("2026-03-09", {
      breakfast: [
        buildDish({ id: "d1", name: "Oats", calories: 300, protein: 10, carbs: 50, fat: 5, quantity: 2 }),
      ],
      temporaryMeals: [
        { description: "Banana", calories: 90, protein: 1, carbs: 23, fat: 0 },
      ],
    });
    const result = aggregateWeeklyStats(weekStartDate, [plan], noGoals);
    // 300 * 2 (quantity) + 90 = 690
    expect(result.days[0].eatenCalories).toBe(690);
  });

  it("sportCalories for a missing day (no document) is 0", () => {
    const result = aggregateWeeklyStats(weekStartDate, [], noGoals);
    result.days.forEach((day) => {
      expect(day.sportCalories).toBe(0);
    });
  });

  it("sportCalories for an unlogged day with sports is still counted", () => {
    // Empty plan = not logged, but has a sport activity
    const sportOnlyPlan = buildMealPlan("2026-03-09", {
      sports: [{ calories: 400, description: "Run" }],
    });
    const result = aggregateWeeklyStats(weekStartDate, [sportOnlyPlan], noGoals);
    expect(result.days[0].hasData).toBe(false);
    expect(result.days[0].sportCalories).toBe(400);
  });

  it("deficit is null for unlogged days", () => {
    const result = aggregateWeeklyStats(weekStartDate, [], goals);
    result.days.forEach((day) => {
      expect(day.deficit).toBeNull();
    });
  });

  it("deficit is null for logged days when no calorie goal", () => {
    const plan = buildMealPlan("2026-03-09", {
      breakfast: [
        buildDish({ id: "d1", name: "Oats", calories: 300, protein: 10, carbs: 50, fat: 5, quantity: 1 }),
      ],
    });
    const result = aggregateWeeklyStats(weekStartDate, [plan], noGoals);
    expect(result.days[0].deficit).toBeNull();
  });

  it("deficit for a logged day with a goal = (targetCalories + sportCalories) - eatenCalories", () => {
    const plan = buildMealPlan("2026-03-09", {
      breakfast: [
        buildDish({ id: "d1", name: "Chicken", calories: 500, protein: 40, carbs: 10, fat: 15, quantity: 1 }),
      ],
      sports: [{ calories: 300, description: "Cycling" }],
    });
    const result = aggregateWeeklyStats(weekStartDate, [plan], goals);
    // deficit = (2000 + 300) - 500 = 1800
    expect(result.days[0].deficit).toBe(1800);
  });

  it("totalSportCalories sums sport from ALL days including unlogged days", () => {
    const loggedPlan = buildMealPlan("2026-03-09", {
      breakfast: [
        buildDish({ id: "d1", name: "Oats", calories: 300, protein: 10, carbs: 50, fat: 5, quantity: 1 }),
      ],
      sports: [{ calories: 200, description: "Run" }],
    });
    const unloggedPlan = buildMealPlan("2026-03-10", {
      // no dishes, no temp meals = unlogged
      sports: [{ calories: 150, description: "Walk" }],
    });
    const result = aggregateWeeklyStats(weekStartDate, [loggedPlan, unloggedPlan], goals);
    expect(result.totalSportCalories).toBe(350);
  });

  it("avgEatenCalories divides by loggedDayCount only (not 7)", () => {
    const plan1 = buildMealPlan("2026-03-09", {
      breakfast: [
        buildDish({ id: "d1", name: "Meal", calories: 1000, protein: 50, carbs: 100, fat: 40, quantity: 1 }),
      ],
    });
    const plan2 = buildMealPlan("2026-03-10", {
      breakfast: [
        buildDish({ id: "d2", name: "Meal", calories: 2000, protein: 80, carbs: 200, fat: 60, quantity: 1 }),
      ],
    });
    const result = aggregateWeeklyStats(weekStartDate, [plan1, plan2], noGoals);
    expect(result.loggedDayCount).toBe(2);
    expect(result.avgEatenCalories).toBe(1500); // (1000 + 2000) / 2
  });

  it("avgEatenCalories is null when no logged days", () => {
    const result = aggregateWeeklyStats(weekStartDate, [], noGoals);
    expect(result.avgEatenCalories).toBeNull();
  });

  it("totalSportSessions counts individual SportActivity objects across all days", () => {
    const plan1 = buildMealPlan("2026-03-09", {
      sports: [
        { calories: 200, description: "Run" },
        { calories: 100, description: "Swim" },
      ],
    });
    const plan2 = buildMealPlan("2026-03-10", {
      sports: [{ calories: 300, description: "Bike" }],
    });
    const result = aggregateWeeklyStats(weekStartDate, [plan1, plan2], noGoals);
    expect(result.totalSportSessions).toBe(3); // 2 + 1
  });

  it("totalDeficit is null when no calorie goal", () => {
    const plan = buildMealPlan("2026-03-09", {
      breakfast: [
        buildDish({ id: "d1", name: "Meal", calories: 500, protein: 20, carbs: 50, fat: 20, quantity: 1 }),
      ],
    });
    const result = aggregateWeeklyStats(weekStartDate, [plan], noGoals);
    expect(result.totalDeficit).toBeNull();
  });

  it("totalDeficit sums deficits from logged days only", () => {
    const plan1 = buildMealPlan("2026-03-09", {
      breakfast: [
        buildDish({ id: "d1", name: "Meal", calories: 1500, protein: 50, carbs: 150, fat: 50, quantity: 1 }),
      ],
    });
    const plan2 = buildMealPlan("2026-03-10", {
      breakfast: [
        buildDish({ id: "d2", name: "Meal", calories: 1800, protein: 80, carbs: 180, fat: 60, quantity: 1 }),
      ],
      sports: [{ calories: 200, description: "Run" }],
    });
    const result = aggregateWeeklyStats(weekStartDate, [plan1, plan2], goals);
    // Day 1 deficit: (2000 + 0) - 1500 = 500
    // Day 2 deficit: (2000 + 200) - 1800 = 400
    // total: 900
    expect(result.totalDeficit).toBe(900);
  });

  it("weekStartDate is preserved in the returned WeeklyStats", () => {
    const result = aggregateWeeklyStats(weekStartDate, [], noGoals);
    expect(result.weekStartDate).toBe(weekStartDate);
  });

  it("goals are preserved in the returned WeeklyStats", () => {
    const result = aggregateWeeklyStats(weekStartDate, [], goals);
    expect(result.goals).toEqual(goals);
  });

  it("protein/carbs/fat are 0 for unlogged days", () => {
    const result = aggregateWeeklyStats(weekStartDate, [], noGoals);
    result.days.forEach((day) => {
      expect(day.protein).toBe(0);
      expect(day.carbs).toBe(0);
      expect(day.fat).toBe(0);
    });
  });

  it("protein/carbs/fat reflect actual nutrition for logged days", () => {
    const plan = buildMealPlan("2026-03-09", {
      breakfast: [
        buildDish({ id: "d1", name: "Chicken", calories: 200, protein: 30, carbs: 5, fat: 8, quantity: 1 }),
      ],
      temporaryMeals: [
        { description: "Shake", calories: 100, protein: 20, carbs: 10, fat: 2 },
      ],
    });
    const result = aggregateWeeklyStats(weekStartDate, [plan], noGoals);
    expect(result.days[0].protein).toBe(50);
    expect(result.days[0].carbs).toBe(15);
    expect(result.days[0].fat).toBe(10);
  });
});

describe("aggregateWeeklyStats with Garmin TDEE", () => {
  const baseGoals: ResolvedGoals = {
    baseCalories: 1800,
    targetCalories: 2000,
    protein: 150,
    carbs: 250,
    fat: 70,
  };

  it("uses Garmin TDEE instead of targetCalories + sport when Garmin data is available", () => {
    const garminSummaries: Record<string, GarminDailySummary> = {
      "2026-03-09": {
        totalCalories: 2800,
        activeCalories: 1000,
        bmrCalories: 1800,
        syncedAt: new Date() as unknown,
      },
    };

    const mealPlans: MealPlan[] = [
      {
        id: "1",
        date: "2026-03-09",
        breakfast: [{ id: "d1", name: "Oats", calories: 400, createdBy: "u1" }],
        lunch: [],
        dinner: [],
        snacks: [],
        sports: [{ calories: 500, source: "GARMIN", movingTime: 3600 }],
        temporaryMeals: [],
        createdBy: "u1",
        createdAt: new Date(),
        updatedAt: new Date(),
        dailyNote: "",
      },
    ];

    const result = aggregateWeeklyStats(
      "2026-03-09",
      mealPlans,
      baseGoals,
      true,
      garminSummaries
    );

    const monday = result.days[0];
    expect(monday.hasData).toBe(true);
    expect(monday.eatenCalories).toBe(400);
    // Garmin TDEE (2800) - NOT targetCalories (2000) + sport
    expect(monday.deficit).toBe(2800 - 400);
  });

  it("falls back to targetCalories + sport when no Garmin data for that day", () => {
    const mealPlans: MealPlan[] = [
      {
        id: "1",
        date: "2026-03-09",
        breakfast: [{ id: "d1", name: "Oats", calories: 400, createdBy: "u1" }],
        lunch: [],
        dinner: [],
        snacks: [],
        sports: [{ calories: 500, source: "GARMIN", movingTime: 3600 }],
        temporaryMeals: [],
        createdBy: "u1",
        createdAt: new Date(),
        updatedAt: new Date(),
        dailyNote: "",
      },
    ];

    const result = aggregateWeeklyStats(
      "2026-03-09",
      mealPlans,
      baseGoals,
      true,
      {} // No Garmin data
    );

    const monday = result.days[0];
    // Corrected sport calories: 500 - round(1800/24 * 1) = 500 - 75 = 425
    const expectedSport = 425;
    expect(monday.deficit).toBe(2000 + expectedSport - 400);
  });
});
