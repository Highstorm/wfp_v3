import { useQuery } from "@tanstack/react-query";
import { getNutritionGoals } from "../repositories/profile.repository";

export const useNutritionGoals = () => {
  return useQuery({
    queryKey: ["nutritionGoals"],
    queryFn: getNutritionGoals,
    staleTime: 1000 * 60 * 5,
  });
};
