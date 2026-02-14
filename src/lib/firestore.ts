import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Re-export types for backward compatibility
export type {
  DishIngredient,
  Dish,
  SportActivity,
  TemporaryMeal,
  MealPlan,
  NutritionGoals,
  UserProfile,
  WeeklyNutritionGoals,
  SharedDish,
} from "../types";

import type { Dish, MealPlan } from "../types";

// Import repository functions
import {
  getDishes,
  getDish,
  createDish,
  updateDish,
  deleteDish,
  updateDishRating,
} from "../repositories/dish.repository";

import {
  getMealPlans,
  getMealPlan,
  getMealPlanByDate,
  createMealPlan,
  updateMealPlan,
  deleteMealPlan,
} from "../repositories/mealplan.repository";

import { getNutritionGoals } from "../repositories/profile.repository";

import {
  getWeeklyNutritionGoals,
  createWeeklyNutritionGoals,
  updateWeeklyNutritionGoals,
  deleteWeeklyNutritionGoals,
} from "../repositories/weekly-goals.repository";

import {
  shareDish,
  getSharedDishByCode,
  importSharedDish,
} from "../repositories/shared-dish.repository";

// React Query Hooks — Dishes
export const useDishes = () => {
  return useQuery<Dish[], Error>({
    queryKey: ["dishes"],
    queryFn: getDishes,
  });
};

export const useDish = (id: string, options?: { enabled?: boolean }) => {
  return useQuery<Dish, Error>({
    queryKey: ["dishes", id],
    queryFn: () => getDish(id),
    enabled: options?.enabled,
  });
};

export const useCreateDish = () => {
  const queryClient = useQueryClient();

  return useMutation<Dish, Error, Omit<Dish, "id" | "createdBy">>({
    mutationFn: createDish,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dishes"] });
    },
  });
};

export const useUpdateDish = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, Partial<Dish> & { id: string }>({
    mutationFn: updateDish,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dishes", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["dishes"] });

      queryClient.setQueryData<Dish>(["dishes", variables.id], (oldData) => {
        if (!oldData) return undefined;
        return { ...oldData, ...variables };
      });

      queryClient.setQueryData<Dish[]>(["dishes"], (oldDishes = []) => {
        return oldDishes.map((dish) =>
          dish.id === variables.id ? { ...dish, ...variables } : dish
        );
      });
    },
  });
};

export const useDeleteDish = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deleteDish,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dishes"] });
    },
  });
};

export const useUpdateDishRating = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { id: string; rating: number }>({
    mutationFn: ({ id, rating }) => updateDishRating(id, rating),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dishes", variables.id] });

      queryClient.setQueryData<Dish[]>(["dishes"], (oldDishes = []) => {
        return oldDishes.map((dish) =>
          dish.id === variables.id
            ? { ...dish, rating: variables.rating }
            : dish
        );
      });
    },
  });
};

// React Query Hooks — MealPlans
export const useMealPlans = () => {
  return useQuery<MealPlan[], Error>({
    queryKey: ["mealPlans"],
    queryFn: getMealPlans,
  });
};

export const useMealPlan = (id: string) => {
  return useQuery<MealPlan, Error>({
    queryKey: ["mealPlans", id],
    queryFn: () => getMealPlan(id),
  });
};

export const useMealPlanByDate = (date: string) => {
  return useQuery<MealPlan | null, Error>({
    queryKey: ["mealPlans", "byDate", date],
    queryFn: () => getMealPlanByDate(date),
    enabled: !!date,
  });
};

export const useCreateMealPlan = () => {
  const queryClient = useQueryClient();

  return useMutation<MealPlan, Error, Omit<MealPlan, "id" | "createdBy">>({
    mutationFn: createMealPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mealPlans"] });
    },
  });
};

export const useUpdateMealPlan = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, Partial<MealPlan> & { id: string }>({
    mutationFn: updateMealPlan,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["mealPlans"] });
      queryClient.invalidateQueries({ queryKey: ["mealPlans", variables.id] });
    },
  });
};

export const useDeleteMealPlan = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deleteMealPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mealPlans"] });
    },
  });
};

// React Query Hooks — Nutrition Goals
export const useNutritionGoals = () => {
  return useQuery({
    queryKey: ["nutritionGoals"],
    queryFn: getNutritionGoals,
    staleTime: 1000 * 60 * 5,
  });
};

// React Query Hooks — Weekly Nutrition Goals
export const useWeeklyNutritionGoals = (weekStartDate: string) => {
  return useQuery({
    queryKey: ["weeklyNutritionGoals", weekStartDate],
    queryFn: () => getWeeklyNutritionGoals(weekStartDate),
    staleTime: 1000 * 60 * 5,
    enabled: !!weekStartDate,
  });
};

export const useCreateWeeklyNutritionGoals = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createWeeklyNutritionGoals,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["weeklyNutritionGoals", data.weekStartDate],
      });
    },
  });
};

export const useUpdateWeeklyNutritionGoals = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateWeeklyNutritionGoals,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["weeklyNutritionGoals", variables.weekStartDate],
      });
    },
  });
};

export const useDeleteWeeklyNutritionGoals = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteWeeklyNutritionGoals,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weeklyNutritionGoals"] });
    },
  });
};

// React Query Hooks — Shared Dishes
export const useShareDish = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: shareDish,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dishes"] });
    },
  });
};

export const useGetSharedDishByCode = (
  shareCode: string,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ["sharedDish", shareCode],
    queryFn: () => getSharedDishByCode(shareCode),
    enabled: options?.enabled !== false && !!shareCode,
  });
};

export const useImportSharedDish = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: importSharedDish,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dishes"] });
    },
  });
};
