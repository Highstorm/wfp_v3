import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { MealPlan } from "../types";
import {
  getMealPlans,
  getMealPlan,
  getMealPlanByDate,
  createMealPlan,
  updateMealPlan,
  deleteMealPlan,
} from "../repositories/mealplan.repository";

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
