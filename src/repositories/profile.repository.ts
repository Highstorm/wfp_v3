import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import type { NutritionGoals, UserProfile } from "../types";

export const getProfile = async (): Promise<UserProfile> => {
  if (!auth.currentUser?.email) throw new Error("Not authenticated");

  const profileRef = doc(db, "profiles", auth.currentUser.email);
  const profileSnap = await getDoc(profileRef);

  if (profileSnap.exists()) {
    return profileSnap.data() as UserProfile;
  }

  return {};
};

export const getNutritionGoals = async (): Promise<NutritionGoals> => {
  if (!auth.currentUser?.email) throw new Error("Not authenticated");

  const profileRef = doc(db, "profiles", auth.currentUser.email);
  const profileSnap = await getDoc(profileRef);

  if (profileSnap.exists()) {
    const data = profileSnap.data();
    return {
      baseCalories: data.baseCalories ?? null,
      targetCalories: data.targetCalories ?? null,
      protein: data.protein ?? null,
      carbs: data.carbs ?? null,
      fat: data.fat ?? null,
    };
  }

  return {
    baseCalories: null,
    targetCalories: null,
    protein: null,
    carbs: null,
    fat: null,
  };
};
