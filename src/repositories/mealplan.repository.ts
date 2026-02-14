import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import type { MealPlan } from "../types";

export const getMealPlans = async (): Promise<MealPlan[]> => {
  if (!auth.currentUser) throw new Error("Not authenticated");

  const q = query(
    collection(db, "mealPlans"),
    where("createdBy", "==", auth.currentUser.uid)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as MealPlan[];
};

export const getMealPlan = async (id: string): Promise<MealPlan> => {
  if (!auth.currentUser) throw new Error("Not authenticated");

  const mealPlanDoc = await getDoc(doc(db, "mealPlans", id));
  if (!mealPlanDoc.exists()) throw new Error("MealPlan not found");

  return {
    id: mealPlanDoc.id,
    ...mealPlanDoc.data(),
  } as MealPlan;
};

export const getMealPlanByDate = async (
  date: string
): Promise<MealPlan | null> => {
  if (!auth.currentUser) throw new Error("Not authenticated");

  const q = query(
    collection(db, "mealPlans"),
    where("createdBy", "==", auth.currentUser.uid),
    where("date", "==", date)
  );
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    const planData = querySnapshot.docs[0].data();
    return {
      ...planData,
      id: querySnapshot.docs[0].id,
      sports: Array.isArray(planData.sports) ? planData.sports : [],
      createdAt: planData.createdAt?.toDate() || new Date(),
      updatedAt: planData.updatedAt?.toDate() || new Date(),
    } as MealPlan;
  }

  return null;
};

export const createMealPlan = async (
  mealPlan: Omit<MealPlan, "id" | "createdBy">
): Promise<MealPlan> => {
  if (!auth.currentUser) throw new Error("Not authenticated");

  const docRef = await addDoc(collection(db, "mealPlans"), {
    ...mealPlan,
    createdBy: auth.currentUser.uid,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return {
    id: docRef.id,
    ...mealPlan,
    createdBy: auth.currentUser.uid,
  };
};

export const updateMealPlan = async ({
  id,
  ...data
}: Partial<MealPlan> & { id: string }): Promise<void> => {
  if (!auth.currentUser) throw new Error("Not authenticated");

  await updateDoc(doc(db, "mealPlans", id), {
    ...data,
    updatedAt: new Date(),
  });
};

export const deleteMealPlan = async (id: string): Promise<void> => {
  if (!auth.currentUser) throw new Error("Not authenticated");

  await deleteDoc(doc(db, "mealPlans", id));
};
