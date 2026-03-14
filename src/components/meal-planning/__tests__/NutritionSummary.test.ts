import { describe, it, expect } from "vitest";
import { calculateEffectiveTarget } from "../../../utils/nutrition.utils";

describe("calculateEffectiveTarget", () => {
  it("returns Garmin TDEE when available and toggle is on", () => {
    const result = calculateEffectiveTarget({
      targetCalories: 2000,
      baseCalories: 1800,
      burnedCalories: 300,
      useGarminTargetCalories: true,
      garminTotalCalories: 2500,
    });
    expect(result).toEqual({
      effectiveTarget: 2500,
      isGarminBased: true,
    });
  });

  it("returns static target + sport when Garmin toggle is off", () => {
    const result = calculateEffectiveTarget({
      targetCalories: 2000,
      baseCalories: 1800,
      burnedCalories: 300,
      useGarminTargetCalories: false,
      garminTotalCalories: 2500,
    });
    expect(result).toEqual({
      effectiveTarget: 2300,
      isGarminBased: false,
    });
  });

  it("falls back to static target + sport when no Garmin data", () => {
    const result = calculateEffectiveTarget({
      targetCalories: 2000,
      baseCalories: 1800,
      burnedCalories: 300,
      useGarminTargetCalories: true,
      garminTotalCalories: null,
    });
    expect(result).toEqual({
      effectiveTarget: 2300,
      isGarminBased: false,
    });
  });

  it("returns null when no target at all", () => {
    const result = calculateEffectiveTarget({
      targetCalories: null,
      baseCalories: null,
      burnedCalories: 300,
      useGarminTargetCalories: false,
      garminTotalCalories: null,
    });
    expect(result).toEqual({
      effectiveTarget: null,
      isGarminBased: false,
    });
  });

  it("falls back to baseCalories + sport when no targetCalories set", () => {
    const result = calculateEffectiveTarget({
      targetCalories: null,
      baseCalories: 1800,
      burnedCalories: 300,
      useGarminTargetCalories: false,
      garminTotalCalories: null,
    });
    expect(result).toEqual({
      effectiveTarget: 2100,
      isGarminBased: false,
    });
  });
});
