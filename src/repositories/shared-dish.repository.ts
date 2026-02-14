import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import type { Dish, SharedDish } from "../types";

const SHARE_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const SHARE_CODE_LENGTH = 8;
const SHARE_EXPIRY_DAYS = 7;

export const generateShareCode = (): string => {
  let result = "";
  for (let i = 0; i < SHARE_CODE_LENGTH; i++) {
    result += SHARE_CODE_CHARS.charAt(
      Math.floor(Math.random() * SHARE_CODE_CHARS.length)
    );
  }
  return result;
};

export const shareDish = async (dishId: string): Promise<SharedDish> => {
  if (!auth.currentUser) throw new Error("Not authenticated");

  const dishDoc = await getDoc(doc(db, "dishes", dishId));
  if (!dishDoc.exists()) {
    throw new Error("Dish not found");
  }

  const dish = { id: dishDoc.id, ...dishDoc.data() } as Dish;
  const shareCode = generateShareCode();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SHARE_EXPIRY_DAYS);

  let sharedByName = auth.currentUser.displayName || "A user";
  if (!auth.currentUser.displayName && auth.currentUser.email) {
    sharedByName = auth.currentUser.email.split("@")[0];
  }

  const sharedDishData = {
    dishId,
    dish,
    sharedBy: auth.currentUser.uid,
    sharedByName,
    createdAt: new Date(),
    expiresAt,
    shareCode,
  };

  const docRef = await addDoc(collection(db, "sharedDishes"), sharedDishData);

  return {
    id: docRef.id,
    ...sharedDishData,
  };
};

export const getSharedDishByCode = async (
  shareCode: string
): Promise<SharedDish | null> => {
  // Requires a Firestore composite index on: shareCode (ASC) + expiresAt (ASC)
  const q = query(
    collection(db, "sharedDishes"),
    where("shareCode", "==", shareCode),
    where("expiresAt", ">", new Date())
  );

  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    return null;
  }

  const docData = querySnapshot.docs[0];

  return {
    id: docData.id,
    ...docData.data(),
    createdAt: docData.data().createdAt?.toDate() || new Date(),
    expiresAt: docData.data().expiresAt?.toDate() || new Date(),
  } as SharedDish;
};

export const importSharedDish = async (
  shareCode: string
): Promise<Dish | null> => {
  if (!auth.currentUser) throw new Error("Not authenticated");

  const sharedDish = await getSharedDishByCode(shareCode);
  if (!sharedDish) throw new Error("Shared dish not found or expired");

  const dish = sharedDish.dish;

  const newDishData = {
    name: dish.name || "",
    calories: dish.calories || 0,
    protein: dish.protein || 0,
    carbs: dish.carbs || 0,
    fat: dish.fat || 0,
    recipe: dish.recipe || "",
    recipeUrl: dish.recipeUrl || "",
    quantity: dish.quantity || 1,
    category: dish.category,
    rating: dish.rating === undefined ? null : dish.rating,
    originalId: dish.id,
    createdBy: auth.currentUser.uid,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const docRef = await addDoc(collection(db, "dishes"), newDishData);

  return {
    id: docRef.id,
    ...newDishData,
  } as Dish;
};
