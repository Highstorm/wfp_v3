import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Dish } from "../types";
import {
  getDishes,
  getDish,
  createDish,
  updateDish,
  deleteDish,
  updateDishRating,
} from "../repositories/dish.repository";

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
