import { useState, useEffect, useMemo } from "react";
import { auth } from "../lib/firebase";
import { useDishes } from "./useDishes";
import {
  useMealPlanByDate,
  useCreateMealPlan,
  useUpdateMealPlan,
  useDeleteMealPlan,
} from "./useMealPlans";
import { useNutritionGoals, useProfile } from "./useProfile";
import { useWeeklyNutritionGoals } from "./useWeeklyGoals";
import type { Dish, MealPlan, NutritionGoals } from "../types";
import type { IntervalsCredentials } from "../services/intervals.service";

export type MealType = keyof Pick<
  MealPlan,
  "breakfast" | "lunch" | "dinner" | "snacks"
>;

export interface MealSectionDef {
  title: string;
  key: MealType;
  dishes: Dish[];
}

export function getWeekStartDate(dateString: string): string {
  const d = new Date(dateString);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const weekStart = new Date(d);
  weekStart.setDate(diff);
  return weekStart.toISOString().split("T")[0];
}

function getLocalToday(): string {
  const today = new Date();
  const offset = today.getTimezoneOffset();
  const localDate = new Date(today.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split("T")[0];
}

function createEmptyMealPlan(planDate: string): MealPlan {
  return {
    id: "",
    date: planDate,
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: [],
    sports: [],
    temporaryMeals: [],
    createdBy: auth.currentUser?.uid || "",
    createdAt: new Date(),
    updatedAt: new Date(),
    dailyNote: "",
  };
}

export function useMealPlanFormState() {
  // Date state
  const [date, setDate] = useState<string>(getLocalToday);
  const [weekStartDate, setWeekStartDate] = useState<string>(
    getWeekStartDate(date)
  );

  // MealPlan state
  const [mealPlan, setMealPlan] = useState<MealPlan>(
    createEmptyMealPlan(date)
  );

  // UI state
  const [message, setMessage] = useState({ text: "", type: "" });
  const [selectedMeal, setSelectedMeal] = useState<MealType>("breakfast");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDishList, setShowDishList] = useState(false);
  const [showSnacksDishList, setShowSnacksDishList] = useState(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState({
    isOpen: false,
    planDate: "",
  });
  const [resetConfirmDialog, setResetConfirmDialog] = useState({
    isOpen: false,
    planDate: "",
  });
  const [expandedRecipes, setExpandedRecipes] = useState<Set<string>>(
    new Set()
  );

  // Data hooks
  const { data: dishes = [], isLoading: isDishesLoading } = useDishes();
  const {
    data: nutritionGoals = {
      baseCalories: null,
      targetCalories: null,
      protein: null,
      carbs: null,
      fat: null,
    },
  } = useNutritionGoals();
  const { data: weeklyNutritionGoals } =
    useWeeklyNutritionGoals(weekStartDate);
  const { data: existingMealPlan, isLoading: isMealPlanLoading } =
    useMealPlanByDate(date);
  const { data: profile } = useProfile();

  // Mutations
  const { mutate: createMealPlan, isPending: isCreating } =
    useCreateMealPlan();
  const { mutate: updateMealPlan, isPending: isUpdating } =
    useUpdateMealPlan();
  const { mutate: deleteMealPlan, isPending: isDeleting } =
    useDeleteMealPlan();

  // Feature toggles derived from profile
  const stomachPainTrackingEnabled =
    profile?.stomachPainTrackingEnabled ?? false;
  const weeklyNutritionGoalsEnabled =
    profile?.weeklyNutritionGoalsEnabled ?? true;
  const dailyNoteEnabled = profile?.dailyNoteEnabled ?? true;
  const sportEnabled = profile?.sportEnabled ?? true;

  // Intervals credentials derived from profile
  const intervalsCredentials: IntervalsCredentials | null = useMemo(() => {
    const athleteId = profile?.["intervals.icu-AthleteID"];
    const apiKey = profile?.["intervals.icu-API-KEY"];
    if (!athleteId || !apiKey) return null;
    return { athleteId, apiKey };
  }, [profile]);

  // Combined nutrition goals (weekly overrides global)
  const combinedNutritionGoals: NutritionGoals = useMemo(() => {
    if (!weeklyNutritionGoals) return nutritionGoals;
    return {
      baseCalories: nutritionGoals.baseCalories,
      targetCalories:
        weeklyNutritionGoals.targetCalories ?? nutritionGoals.targetCalories,
      protein: weeklyNutritionGoals.protein ?? nutritionGoals.protein,
      carbs: weeklyNutritionGoals.carbs ?? nutritionGoals.carbs,
      fat: weeklyNutritionGoals.fat ?? nutritionGoals.fat,
    };
  }, [nutritionGoals, weeklyNutritionGoals]);

  // Reset form to empty state
  const resetForm = () => {
    setMealPlan(createEmptyMealPlan(date));
    setMessage({ text: "", type: "" });
  };

  // Sync existing meal plan from server into local state
  useEffect(() => {
    if (!isMealPlanLoading) {
      if (existingMealPlan) {
        setMealPlan({
          ...existingMealPlan,
          sports: existingMealPlan.sports || [],
          temporaryMeals: existingMealPlan.temporaryMeals || [],
          breakfast: existingMealPlan.breakfast || [],
          lunch: existingMealPlan.lunch || [],
          dinner: existingMealPlan.dinner || [],
          snacks: existingMealPlan.snacks || [],
        });
      } else {
        resetForm();
      }
    }
  }, [existingMealPlan, isMealPlanLoading]);

  // Calculate total nutrition across all meals
  const calculateTotalNutrition = () => {
    const allDishes = [
      ...mealPlan.breakfast,
      ...mealPlan.lunch,
      ...mealPlan.dinner,
      ...mealPlan.snacks,
    ];

    const dishNutrition = allDishes.reduce(
      (total, dish) => {
        const quantity = (dish as Dish & { quantity?: number }).quantity ?? 1;
        return {
          calories: total.calories + (dish.calories || 0) * quantity,
          protein: total.protein + (dish.protein || 0) * quantity,
          carbs: total.carbs + (dish.carbs || 0) * quantity,
          fat: total.fat + (dish.fat || 0) * quantity,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    const tempMealNutrition = (mealPlan.temporaryMeals || []).reduce(
      (total, meal) => ({
        calories: total.calories + meal.calories,
        protein: total.protein + meal.protein,
        carbs: total.carbs + meal.carbs,
        fat: total.fat + meal.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    return {
      calories: dishNutrition.calories + tempMealNutrition.calories,
      protein: dishNutrition.protein + tempMealNutrition.protein,
      carbs: dishNutrition.carbs + tempMealNutrition.carbs,
      fat: dishNutrition.fat + tempMealNutrition.fat,
    };
  };

  // Filter dishes by meal-type category
  const getCategoryFilteredDishes = (mealType: MealType) => {
    const categoryMap: Record<MealType, string> = {
      breakfast: "breakfast",
      lunch: "mainDish",
      dinner: "mainDish",
      snacks: "snack",
    };

    const matchingCategory = categoryMap[mealType] as
      | "breakfast"
      | "mainDish"
      | "snack";
    const hasCategorizedDishes = dishes.some(
      (dish) => dish.category === matchingCategory
    );

    if (hasCategorizedDishes) {
      return dishes.filter((dish) => dish.category === matchingCategory);
    }
    return dishes.filter(
      (dish) => dish.category === matchingCategory || !dish.category
    );
  };

  const mealSections: MealSectionDef[] = [
    { title: "Frühstück", key: "breakfast", dishes: mealPlan.breakfast },
    { title: "Mittagessen", key: "lunch", dishes: mealPlan.lunch },
    { title: "Abendessen", key: "dinner", dishes: mealPlan.dinner },
  ];

  return {
    // Date
    date,
    setDate,
    weekStartDate,
    setWeekStartDate,

    // MealPlan
    mealPlan,
    setMealPlan,

    // UI
    message,
    setMessage,
    selectedMeal,
    setSelectedMeal,
    searchTerm,
    setSearchTerm,
    showDishList,
    setShowDishList,
    showSnacksDishList,
    setShowSnacksDishList,
    deleteConfirmDialog,
    setDeleteConfirmDialog,
    resetConfirmDialog,
    setResetConfirmDialog,
    expandedRecipes,
    setExpandedRecipes,

    // Feature toggles
    stomachPainTrackingEnabled,
    weeklyNutritionGoalsEnabled,
    dailyNoteEnabled,
    sportEnabled,
    intervalsCredentials,

    // Data
    dishes,
    combinedNutritionGoals,

    // Loading / mutation states
    isDishesLoading,
    isMealPlanLoading,
    isCreating,
    isUpdating,
    isDeleting,

    // Mutations
    createMealPlan,
    updateMealPlan,
    deleteMealPlan,

    // Helpers
    resetForm,
    calculateTotalNutrition,
    getCategoryFilteredDishes,
    mealSections,
  } as const;
}

export type MealPlanFormState = ReturnType<typeof useMealPlanFormState>;
