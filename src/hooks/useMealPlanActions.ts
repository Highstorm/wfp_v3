import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { auth } from "../lib/firebase";
import { IntervalsService } from "../services/intervals.service";
import type { Dish, MealPlan, SportActivity, TemporaryMeal } from "../types";
import { getWeekStartDate, type MealPlanFormState } from "./useMealPlanFormState";

export function useMealPlanActions(state: MealPlanFormState) {
  const {
    date,
    mealPlan,
    selectedMeal,
    intervalsCredentials,
    setDate,
    setWeekStartDate,
    setMealPlan,
    setMessage,
    setSearchTerm,
    setShowDishList,
    setShowSnacksDishList,
    setSelectedMeal,
    setDeleteConfirmDialog,
    setResetConfirmDialog,
    setExpandedRecipes,
    resetForm,
    createMealPlan,
    updateMealPlan,
    deleteMealPlan,
    calculateTotalNutrition,
  } = state;

  const queryClient = useQueryClient();

  const handleDateChange = (newDate: string) => {
    if (newDate !== date) {
      setDate(newDate);
      setWeekStartDate(getWeekStartDate(newDate));
      resetForm();
    }
  };

  const handleInputFocus = (
    sectionKey: keyof Pick<
      MealPlan,
      "breakfast" | "lunch" | "dinner" | "snacks"
    >
  ) => {
    setSelectedMeal(sectionKey);
    if (sectionKey === "snacks") {
      setShowSnacksDishList(true);
    } else {
      setShowDishList(true);
    }
  };

  const handleInputBlur = (e: React.FocusEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    const isInputOrListItem =
      relatedTarget?.tagName === "INPUT" ||
      relatedTarget?.closest(".dish-list-item");

    if (!isInputOrListItem) {
      setTimeout(() => {
        setShowDishList(false);
        setShowSnacksDishList(false);
      }, 200);
    }
  };

  const handleAddDish = (dish: Dish) => {
    const uniqueId = `${dish.id}-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    setMealPlan((prev) => ({
      ...prev,
      [selectedMeal]: [
        ...prev[selectedMeal],
        {
          ...dish,
          id: uniqueId,
          originalId: dish.id,
          createdBy: auth.currentUser?.uid || "",
          quantity: 1,
        },
      ],
    }));
    setSearchTerm("");
  };

  const handleRemoveDish = (
    mealType: keyof Pick<
      MealPlan,
      "breakfast" | "lunch" | "dinner" | "snacks"
    >,
    dishId: string
  ) => {
    setMealPlan((prev) => ({
      ...prev,
      [mealType]: (prev[mealType] as Dish[]).filter(
        (dish) => dish.id !== dishId
      ),
    }));
  };

  const handleUpdateDishQuantity = (dishId: string, newQuantity: number) => {
    setMealPlan((prev) => {
      const updateDishesInMeal = (mealDishes: Dish[]) =>
        mealDishes.map((dish) =>
          dish.id === dishId ? { ...dish, quantity: newQuantity } : dish
        );
      return {
        ...prev,
        breakfast: updateDishesInMeal(prev.breakfast || []),
        lunch: updateDishesInMeal(prev.lunch || []),
        dinner: updateDishesInMeal(prev.dinner || []),
        snacks: updateDishesInMeal(prev.snacks || []),
      };
    });
  };

  const handleAddSportActivity = (activity: SportActivity) => {
    setMealPlan((prev) => {
      const currentSports = Array.isArray(prev.sports) ? prev.sports : [];
      return { ...prev, sports: [...currentSports, activity] };
    });
  };

  const handleRemoveSportActivity = (index: number) => {
    setMealPlan((prev) => ({
      ...prev,
      sports: prev.sports.filter((_, i) => i !== index),
    }));
  };

  const handleAddTemporaryMeal = (meal: TemporaryMeal) => {
    setMealPlan((prev) => ({
      ...prev,
      temporaryMeals: [...prev.temporaryMeals, meal],
    }));
  };

  const handleRemoveTemporaryMeal = (index: number) => {
    setMealPlan((prev) => ({
      ...prev,
      temporaryMeals: prev.temporaryMeals.filter((_, i) => i !== index),
    }));
  };

  const handleStomachPainChange = (level: number) => {
    setMealPlan((prev) => ({ ...prev, stomachPainLevel: level }));
  };

  const handleDailyNoteChange = (value: string) => {
    setMealPlan((prev) => ({ ...prev, dailyNote: value }));
  };

  const toggleRecipe = (dishId: string) => {
    setExpandedRecipes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dishId)) {
        newSet.delete(dishId);
      } else {
        newSet.add(dishId);
      }
      return newSet;
    });
  };

  const handleSave = () => {
    if (!auth.currentUser?.uid) return;

    const mealPlanData = {
      ...mealPlan,
      date,
      createdBy: auth.currentUser.uid,
      updatedAt: new Date(),
    };

    const onSuccess = () => {
      setMessage({
        text: mealPlan.id
          ? "Tagesplan erfolgreich aktualisiert!"
          : "Tagesplan erfolgreich gespeichert!",
        type: "success",
      });

      // Invalidate calendar-related queries so UI stays in sync
      queryClient.invalidateQueries({ queryKey: ["mealPlans"] });

      // Sync wellness data to Intervals.icu
      if (intervalsCredentials) {
        const nutrition = calculateTotalNutrition();
        IntervalsService.updateWellnessForDate(
          date,
          nutrition.calories,
          intervalsCredentials
        ).catch(() => {
          // Intervals sync failure is non-critical
        });
      }
    };

    const onError = () => {
      setMessage({
        text: "Fehler beim Speichern des Tagesplans.",
        type: "error",
      });
    };

    if (mealPlan.id) {
      const { id, ...updateData } = mealPlanData;
      updateMealPlan({ id, ...updateData }, { onSuccess, onError });
    } else {
      createMealPlan(mealPlanData, { onSuccess, onError });
    }
  };

  const handleDelete = () => {
    if (!auth.currentUser?.uid || !mealPlan.id) return;

    deleteMealPlan(mealPlan.id, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["mealPlans"] });
        setMessage({
          text: "Tagesplan erfolgreich gelöscht!",
          type: "success",
        });
        resetForm();
        setDeleteConfirmDialog({ isOpen: false, planDate: "" });
      },
      onError: () => {
        setMessage({
          text: "Fehler beim Löschen des Tagesplans.",
          type: "error",
        });
      },
    });
  };

  const handleReset = () => {
    resetForm();
    setResetConfirmDialog({ isOpen: false, planDate: "" });
  };

  return {
    handleDateChange,
    handleInputFocus,
    handleInputBlur,
    handleAddDish,
    handleRemoveDish,
    handleUpdateDishQuantity,
    handleAddSportActivity,
    handleRemoveSportActivity,
    handleAddTemporaryMeal,
    handleRemoveTemporaryMeal,
    handleStomachPainChange,
    handleDailyNoteChange,
    toggleRecipe,
    handleSave,
    handleDelete,
    handleReset,
  } as const;
}
