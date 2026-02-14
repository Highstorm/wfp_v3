import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getWeeklyNutritionGoals,
  createWeeklyNutritionGoals,
  updateWeeklyNutritionGoals,
  deleteWeeklyNutritionGoals,
} from "../repositories/weekly-goals.repository";

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
