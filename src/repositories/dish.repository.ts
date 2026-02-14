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
import type { Dish } from "../types";

export const getDishes = async (): Promise<Dish[]> => {
  if (!auth.currentUser) throw new Error("Not authenticated");

  const q = query(
    collection(db, "dishes"),
    where("createdBy", "==", auth.currentUser.uid)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Dish[];
};

export const getDish = async (id: string): Promise<Dish> => {
  if (!auth.currentUser) throw new Error("Not authenticated");

  const dishDoc = await getDoc(doc(db, "dishes", id));
  if (!dishDoc.exists()) throw new Error("Dish not found");

  return {
    id: dishDoc.id,
    ...dishDoc.data(),
  } as Dish;
};

export const createDish = async (
  dish: Omit<Dish, "id" | "createdBy">
): Promise<Dish> => {
  if (!auth.currentUser) throw new Error("Not authenticated");

  if (!dish.name || typeof dish.calories !== "number") {
    throw new Error("Name and calories are required");
  }

  // Remove undefined values from data
  const cleanDish = Object.entries(dish).reduce<
    Partial<Omit<Dish, "id" | "createdBy">>
  >((acc, [key, value]) => {
    if (value !== undefined) {
      (acc as Record<string, unknown>)[key] = value;
    }
    return acc;
  }, {});

  const dishData = {
    ...cleanDish,
    createdBy: auth.currentUser.uid,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const docRef = await addDoc(collection(db, "dishes"), dishData);

  return {
    id: docRef.id,
    ...dishData,
  } as Dish;
};

export const updateDish = async ({
  id,
  ...data
}: Partial<Dish> & { id: string }): Promise<void> => {
  if (!auth.currentUser) throw new Error("Not authenticated");

  // Remove undefined/null values to avoid Firestore issues
  const cleanData = Object.entries(data).reduce<Record<string, unknown>>(
    (acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = value;
      }
      return acc;
    },
    {}
  );

  await updateDoc(doc(db, "dishes", id), {
    ...cleanData,
    updatedAt: new Date(),
  });
};

export const deleteDish = async (id: string): Promise<void> => {
  if (!auth.currentUser) throw new Error("Not authenticated");

  await deleteDoc(doc(db, "dishes", id));
};

export const updateDishRating = async (
  id: string,
  rating: number
): Promise<void> => {
  if (!auth.currentUser) throw new Error("Not authenticated");

  await updateDoc(doc(db, "dishes", id), {
    rating,
    updatedAt: new Date(),
  });
};
