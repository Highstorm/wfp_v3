import { describe, it, expect } from "vitest";
import {
  calculateDishNutrition,
  calculateIngredientNutrition,
  calculateTemporaryMealNutrition,
  calculateTotalBurnedCalories,
  correctActivityCalories,
} from "../nutrition.utils";
import type { DishIngredient, TemporaryMeal, SportActivity } from "../../types";

describe("calculateDishNutrition", () => {
  it("returns zero nutrition for an empty array", () => {
    expect(calculateDishNutrition([])).toEqual({
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    });
  });

  it("returns values as-is for a single dish without quantity", () => {
    const dishes = [{ calories: 400, protein: 30, carbs: 50, fat: 10 }];
    expect(calculateDishNutrition(dishes)).toEqual({
      calories: 400,
      protein: 30,
      carbs: 50,
      fat: 10,
    });
  });

  it("doubles values for a dish with quantity 2", () => {
    const dishes = [{ calories: 200, protein: 15, carbs: 25, fat: 5, quantity: 2 }];
    expect(calculateDishNutrition(dishes)).toEqual({
      calories: 400,
      protein: 30,
      carbs: 50,
      fat: 10,
    });
  });

  it("sums nutrition correctly for multiple dishes", () => {
    const dishes = [
      { calories: 200, protein: 10, carbs: 20, fat: 5 },
      { calories: 300, protein: 20, carbs: 30, fat: 10 },
    ];
    expect(calculateDishNutrition(dishes)).toEqual({
      calories: 500,
      protein: 30,
      carbs: 50,
      fat: 15,
    });
  });

  it("handles decimal quantity (1.5) correctly", () => {
    const dishes = [{ calories: 100, protein: 10, carbs: 20, fat: 4, quantity: 1.5 }];
    expect(calculateDishNutrition(dishes)).toEqual({
      calories: 150,
      protein: 15,
      carbs: 30,
      fat: 6,
    });
  });

  it("treats undefined optional fields as 0", () => {
    const dishes = [{ calories: 200 }];
    expect(calculateDishNutrition(dishes)).toEqual({
      calories: 200,
      protein: 0,
      carbs: 0,
      fat: 0,
    });
  });
});

describe("calculateIngredientNutrition", () => {
  it("returns zero nutrition for an empty array", () => {
    expect(calculateIngredientNutrition([])).toEqual({
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    });
  });

  it("applies factor 2 for nutritionUnit '100g' and quantity 200", () => {
    const ingredients: DishIngredient[] = [
      {
        name: "Oats",
        quantity: 200,
        unit: "g",
        nutritionUnit: "100g",
        caloriesPerUnit: 350,
        proteinPerUnit: 13,
        carbsPerUnit: 60,
        fatPerUnit: 7,
      },
    ];
    expect(calculateIngredientNutrition(ingredients)).toEqual({
      calories: 700,
      protein: 26,
      carbs: 120,
      fat: 14,
    });
  });

  it("applies factor 0.5 for nutritionUnit '100ml' and quantity 50", () => {
    const ingredients: DishIngredient[] = [
      {
        name: "Milk",
        quantity: 50,
        unit: "ml",
        nutritionUnit: "100ml",
        caloriesPerUnit: 64,
        proteinPerUnit: 3.4,
        carbsPerUnit: 4.8,
        fatPerUnit: 3.6,
      },
    ];
    const result = calculateIngredientNutrition(ingredients);
    expect(result.calories).toBeCloseTo(32);
    expect(result.protein).toBeCloseTo(1.7);
    expect(result.carbs).toBeCloseTo(2.4);
    expect(result.fat).toBeCloseTo(1.8);
  });

  it("applies factor 3 for nutritionUnit '1 Stück' and quantity 3", () => {
    const ingredients: DishIngredient[] = [
      {
        name: "Egg",
        quantity: 3,
        unit: "Stück",
        nutritionUnit: "1 Stück",
        caloriesPerUnit: 80,
        proteinPerUnit: 7,
        carbsPerUnit: 0.5,
        fatPerUnit: 5.5,
      },
    ];
    expect(calculateIngredientNutrition(ingredients)).toEqual({
      calories: 240,
      protein: 21,
      carbs: 1.5,
      fat: 16.5,
    });
  });

  it("sums nutrition correctly for multiple ingredients", () => {
    const ingredients: DishIngredient[] = [
      {
        name: "Oats",
        quantity: 100,
        unit: "g",
        nutritionUnit: "100g",
        caloriesPerUnit: 350,
        proteinPerUnit: 13,
        carbsPerUnit: 60,
        fatPerUnit: 7,
      },
      {
        name: "Banana",
        quantity: 1,
        unit: "Stück",
        nutritionUnit: "1 Stück",
        caloriesPerUnit: 95,
        proteinPerUnit: 1.1,
        carbsPerUnit: 21,
        fatPerUnit: 0.3,
      },
    ];
    const result = calculateIngredientNutrition(ingredients);
    expect(result.calories).toBeCloseTo(445);
    expect(result.protein).toBeCloseTo(14.1);
    expect(result.carbs).toBeCloseTo(81);
    expect(result.fat).toBeCloseTo(7.3);
  });
});

describe("calculateTemporaryMealNutrition", () => {
  it("returns zero nutrition for an empty array", () => {
    expect(calculateTemporaryMealNutrition([])).toEqual({
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    });
  });

  it("sums nutrition correctly for multiple meals", () => {
    const meals: TemporaryMeal[] = [
      { description: "Snack", calories: 150, protein: 5, carbs: 20, fat: 6 },
      { description: "Coffee", calories: 50, protein: 2, carbs: 5, fat: 2 },
    ];
    expect(calculateTemporaryMealNutrition(meals)).toEqual({
      calories: 200,
      protein: 7,
      carbs: 25,
      fat: 8,
    });
  });
});

describe("calculateTotalBurnedCalories", () => {
  it("returns 0 for an empty array", () => {
    expect(calculateTotalBurnedCalories([])).toBe(0);
  });

  it("sums burned calories correctly for multiple activities", () => {
    const activities: SportActivity[] = [
      { calories: 300, description: "Running" },
      { calories: 150, description: "Walking" },
      { calories: 200 },
    ];
    expect(calculateTotalBurnedCalories(activities)).toBe(650);
  });

  it("applies Garmin correction when baseCalories is provided", () => {
    const activities: SportActivity[] = [
      { calories: 450, description: "Garmin Run", source: "GARMIN", movingTime: 3600 },
      { calories: 300, description: "Zwift Ride", source: "ZWIFT", movingTime: 3600 },
    ];
    // Garmin: 450 - 75 = 375, Zwift: 300 (no correction)
    expect(calculateTotalBurnedCalories(activities, 1800)).toBe(675);
  });
});

describe("correctActivityCalories", () => {
  it("corrects Garmin activity: subtracts resting calories for duration", () => {
    const result = correctActivityCalories(
      { calories: 450, source: "GARMIN", movingTime: 3600 },
      1800
    );
    // restPerHour = 1800/24 = 75, deduction = 75 * 1 = 75
    expect(result).toEqual({
      calories: 375,
      originalCalories: 450,
      restingDeduction: 75,
      wasCorrected: true,
    });
  });

  it("handles case-insensitive garmin source", () => {
    const result = correctActivityCalories(
      { calories: 300, source: "garmin", movingTime: 1800 },
      2400
    );
    // restPerHour = 2400/24 = 100, deduction = 100 * 0.5 = 50
    expect(result).toEqual({
      calories: 250,
      originalCalories: 300,
      restingDeduction: 50,
      wasCorrected: true,
    });
  });

  it("handles source containing garmin (e.g. GARMIN_CONNECT)", () => {
    const result = correctActivityCalories(
      { calories: 200, source: "GARMIN_CONNECT", movingTime: 3600 },
      1800
    );
    expect(result.wasCorrected).toBe(true);
    expect(result.calories).toBe(125);
  });

  it("does not correct non-Garmin activities", () => {
    const result = correctActivityCalories(
      { calories: 300, source: "ZWIFT", movingTime: 3600 },
      1800
    );
    expect(result).toEqual({
      calories: 300,
      originalCalories: 300,
      restingDeduction: 0,
      wasCorrected: false,
    });
  });

  it("does not correct when baseCalories is null", () => {
    const result = correctActivityCalories(
      { calories: 300, source: "GARMIN", movingTime: 3600 },
      null
    );
    expect(result.wasCorrected).toBe(false);
    expect(result.calories).toBe(300);
  });

  it("does not correct when baseCalories is 0", () => {
    const result = correctActivityCalories(
      { calories: 300, source: "GARMIN", movingTime: 3600 },
      0
    );
    expect(result.wasCorrected).toBe(false);
    expect(result.calories).toBe(300);
  });

  it("does not correct when movingTime is missing", () => {
    const result = correctActivityCalories(
      { calories: 300, source: "GARMIN" },
      1800
    );
    expect(result.wasCorrected).toBe(false);
    expect(result.calories).toBe(300);
  });

  it("does not correct when source is missing", () => {
    const result = correctActivityCalories(
      { calories: 300, movingTime: 3600 },
      1800
    );
    expect(result.wasCorrected).toBe(false);
    expect(result.calories).toBe(300);
  });

  it("clamps corrected calories to 0 minimum", () => {
    const result = correctActivityCalories(
      { calories: 10, source: "GARMIN", movingTime: 7200 },
      2400
    );
    // restPerHour = 100, deduction = 200, but clamped to 0
    expect(result.calories).toBe(0);
    expect(result.restingDeduction).toBe(200);
    expect(result.wasCorrected).toBe(true);
  });

  it("rounds corrected calories to nearest integer", () => {
    const result = correctActivityCalories(
      { calories: 300, source: "GARMIN", movingTime: 2700 },
      1800
    );
    // restPerHour = 75, deduction = 75 * 0.75 = 56.25 → rounds
    expect(result.calories).toBe(244);
    expect(result.restingDeduction).toBe(56);
  });
});
