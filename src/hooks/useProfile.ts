import { useQuery } from "@tanstack/react-query";
import { getNutritionGoals, getProfile } from "../repositories/profile.repository";
import type { UserProfile } from "../types";

export const useProfile = () => {
  return useQuery<UserProfile>({
    queryKey: ["profile"],
    queryFn: getProfile,
    staleTime: 1000 * 60 * 5,
  });
};

export const useNutritionGoals = () => {
  return useQuery({
    queryKey: ["nutritionGoals"],
    queryFn: getNutritionGoals,
    staleTime: 1000 * 60 * 5,
  });
};
