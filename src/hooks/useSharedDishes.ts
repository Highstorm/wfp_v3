import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  shareDish,
  getSharedDishByCode,
  importSharedDish,
} from "../repositories/shared-dish.repository";

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
