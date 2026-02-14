import {
  collection,
  query,
  where,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import type { WeeklyNutritionGoals } from "../types";

export const getWeeklyNutritionGoals = async (
  weekStartDate: string
): Promise<WeeklyNutritionGoals | null> => {
  if (!auth.currentUser?.uid) throw new Error("Not authenticated");

  const q = query(
    collection(db, "weeklyNutritionGoals"),
    where("createdBy", "==", auth.currentUser.uid),
    where("weekStartDate", "==", weekStartDate)
  );

  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return null;
  }

  const goalDoc = querySnapshot.docs[0];
  return {
    id: goalDoc.id,
    ...goalDoc.data(),
    createdAt: goalDoc.data().createdAt.toDate(),
    updatedAt: goalDoc.data().updatedAt.toDate(),
  } as WeeklyNutritionGoals;
};

export const createWeeklyNutritionGoals = async (
  goals: Omit<WeeklyNutritionGoals, "id">
): Promise<WeeklyNutritionGoals> => {
  if (!auth.currentUser?.uid) throw new Error("Not authenticated");

  const docRef = await addDoc(collection(db, "weeklyNutritionGoals"), goals);
  return {
    id: docRef.id,
    ...goals,
  };
};

export const updateWeeklyNutritionGoals = async (
  goals: WeeklyNutritionGoals
): Promise<void> => {
  if (!auth.currentUser?.uid || !goals.id)
    throw new Error("Not authenticated or invalid goals");

  const { id, ...updateData } = goals;
  await updateDoc(doc(db, "weeklyNutritionGoals", id), updateData);
};

export const deleteWeeklyNutritionGoals = async (
  id: string
): Promise<void> => {
  if (!auth.currentUser?.uid) throw new Error("Not authenticated");

  await deleteDoc(doc(db, "weeklyNutritionGoals", id));
};
