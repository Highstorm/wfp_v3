import { initializeApp } from "firebase/app";
import {
  getFirestore,
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
import { getAuth } from "firebase/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Re-export types for backward compatibility
export type {
  DishIngredient,
  Dish,
  SportActivity,
  TemporaryMeal,
  MealPlan,
  NutritionGoals,
  UserProfile,
  WeeklyNutritionGoals,
  SharedDish,
} from "../types";

import type {
  Dish,
  MealPlan,
  NutritionGoals,
  WeeklyNutritionGoals,
  SharedDish,
} from "../types";

// Firebase-Konfiguration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Firebase initialisieren
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Dishes API
const getDishes = async (): Promise<Dish[]> => {
  if (!auth.currentUser) throw new Error("Not authenticated");

  console.log("getDishes: Starte Abfrage für User:", auth.currentUser.uid);

  const q = query(
    collection(db, "dishes"),
    where("createdBy", "==", auth.currentUser.uid)
  );
  const querySnapshot = await getDocs(q);
  const dishes = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Dish[];
  
  console.log("getDishes: Gefundene Gerichte:", dishes);
  return dishes;
};

const getDish = async (id: string): Promise<Dish> => {
  if (!auth.currentUser) throw new Error("Not authenticated");

  const dishDoc = await getDoc(doc(db, "dishes", id));
  if (!dishDoc.exists()) throw new Error("Dish not found");

  return {
    id: dishDoc.id,
    ...dishDoc.data(),
  } as Dish;
};

const createDish = async (
  dish: Omit<Dish, "id" | "createdBy">
): Promise<Dish> => {
  if (!auth.currentUser) throw new Error("Not authenticated");

  // Stelle sicher, dass die Pflichtfelder vorhanden sind
  if (!dish.name || typeof dish.calories !== 'number') {
    throw new Error("Name und Kalorien sind Pflichtfelder");
  }

  // Entferne undefined-Werte aus den Daten
  const cleanDish = Object.entries(dish).reduce<Partial<Omit<Dish, "id" | "createdBy">>>((acc, [key, value]) => {
    if (value !== undefined) {
      (acc as any)[key] = value;
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

const updateDish = async ({
  id,
  ...data
}: Partial<Dish> & { id: string }): Promise<void> => {
  if (!auth.currentUser) throw new Error("Not authenticated");

  console.log("Updating dish in Firestore with ID:", id, "and data:", data);
  
  // Entferne undefinierte oder null-Werte, um Firestore nicht zu verwirren
  const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null) {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, any>);
  
  await updateDoc(doc(db, "dishes", id), {
    ...cleanData,
    updatedAt: new Date(),
  });
};

const deleteDish = async (id: string): Promise<void> => {
  if (!auth.currentUser) throw new Error("Not authenticated");

  await deleteDoc(doc(db, "dishes", id));
};

// MealPlans API
const getMealPlans = async (): Promise<MealPlan[]> => {
  if (!auth.currentUser) throw new Error("Not authenticated");

  const q = query(
    collection(db, "mealPlans"),
    where("createdBy", "==", auth.currentUser.uid)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as MealPlan[];
};

const getMealPlan = async (id: string): Promise<MealPlan> => {
  if (!auth.currentUser) throw new Error("Not authenticated");

  const mealPlanDoc = await getDoc(doc(db, "mealPlans", id));
  if (!mealPlanDoc.exists()) throw new Error("MealPlan not found");

  return {
    id: mealPlanDoc.id,
    ...mealPlanDoc.data(),
  } as MealPlan;
};

const createMealPlan = async (
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

const updateMealPlan = async ({
  id,
  ...data
}: Partial<MealPlan> & { id: string }): Promise<void> => {
  if (!auth.currentUser) throw new Error("Not authenticated");

  await updateDoc(doc(db, "mealPlans", id), {
    ...data,
    updatedAt: new Date(),
  });
};

const deleteMealPlan = async (id: string): Promise<void> => {
  if (!auth.currentUser) throw new Error("Not authenticated");

  await deleteDoc(doc(db, "mealPlans", id));
};

// NutritionGoals API
const getNutritionGoals = async (): Promise<NutritionGoals> => {
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

// WeeklyNutritionGoals API
const getWeeklyNutritionGoals = async (weekStartDate: string): Promise<WeeklyNutritionGoals | null> => {
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

  const doc = querySnapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate(),
    updatedAt: doc.data().updatedAt.toDate(),
  } as WeeklyNutritionGoals;
};

const createWeeklyNutritionGoals = async (goals: Omit<WeeklyNutritionGoals, "id">): Promise<WeeklyNutritionGoals> => {
  if (!auth.currentUser?.uid) throw new Error("Not authenticated");

  const docRef = await addDoc(collection(db, "weeklyNutritionGoals"), goals);
  return {
    id: docRef.id,
    ...goals,
  };
};

const updateWeeklyNutritionGoals = async (goals: WeeklyNutritionGoals): Promise<void> => {
  if (!auth.currentUser?.uid || !goals.id) throw new Error("Not authenticated or invalid goals");

  const { id, ...updateData } = goals;
  await updateDoc(doc(db, "weeklyNutritionGoals", id), updateData);
};

const deleteWeeklyNutritionGoals = async (id: string): Promise<void> => {
  if (!auth.currentUser?.uid) throw new Error("Not authenticated");

  await deleteDoc(doc(db, "weeklyNutritionGoals", id));
};

// React Query Hooks
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
      console.log("Update successful, invalidating queries for:", variables.id);
      
      // Erst die spezifische Abfrage für das Gericht invalidieren
      queryClient.invalidateQueries({ queryKey: ["dishes", variables.id] });
      
      // Dann die allgemeine Abfrage für alle Gerichte invalidieren
      queryClient.invalidateQueries({ queryKey: ["dishes"] });
      
      // Zusätzlich die Daten im Cache direkt aktualisieren für sofortige UI-Aktualisierungen
      queryClient.setQueryData<Dish>(["dishes", variables.id], (oldData) => {
        if (!oldData) return undefined;
        return { ...oldData, ...variables };
      });
      
      // Die Liste der Gerichte im Cache aktualisieren
      queryClient.setQueryData<Dish[]>(["dishes"], (oldDishes = []) => {
        return oldDishes.map(dish => 
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

export const useMealPlans = () => {
  return useQuery<MealPlan[], Error>({
    queryKey: ["mealPlans"],
    queryFn: getMealPlans,
  });
};

export const useMealPlan = (id: string) => {
  return useQuery<MealPlan, Error>({
    queryKey: ["mealPlans", id],
    queryFn: () => getMealPlan(id),
  });
};

export const useCreateMealPlan = () => {
  const queryClient = useQueryClient();

  return useMutation<MealPlan, Error, Omit<MealPlan, "id" | "createdBy">>({
    mutationFn: createMealPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mealPlans"] });
    },
  });
};

export const useUpdateMealPlan = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, Partial<MealPlan> & { id: string }>({
    mutationFn: updateMealPlan,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["mealPlans"] });
      queryClient.invalidateQueries({ queryKey: ["mealPlans", variables.id] });
    },
  });
};

export const useDeleteMealPlan = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deleteMealPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mealPlans"] });
    },
  });
};

const getMealPlanByDate = async (date: string): Promise<MealPlan | null> => {
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

export const useMealPlanByDate = (date: string) => {
  return useQuery<MealPlan | null, Error>({
    queryKey: ["mealPlans", "byDate", date],
    queryFn: () => getMealPlanByDate(date),
    enabled: !!date,
  });
};

export const useNutritionGoals = () => {
  return useQuery({
    queryKey: ["nutritionGoals"],
    queryFn: getNutritionGoals,
    staleTime: 1000 * 60 * 5, // 5 Minuten
  });
};

export const useWeeklyNutritionGoals = (weekStartDate: string) => {
  return useQuery({
    queryKey: ["weeklyNutritionGoals", weekStartDate],
    queryFn: () => getWeeklyNutritionGoals(weekStartDate),
    staleTime: 1000 * 60 * 5, // 5 Minuten
    enabled: !!weekStartDate,
  });
};

export const useCreateWeeklyNutritionGoals = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createWeeklyNutritionGoals,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["weeklyNutritionGoals", data.weekStartDate] });
    },
  });
};

export const useUpdateWeeklyNutritionGoals = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateWeeklyNutritionGoals,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["weeklyNutritionGoals", variables.weekStartDate] });
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

const updateDishRating = async (
  id: string,
  rating: number
): Promise<void> => {
  if (!auth.currentUser) throw new Error("Not authenticated");

  console.log(`Updating dish rating for ID: ${id}, new rating: ${rating}`);
  
  await updateDoc(doc(db, "dishes", id), {
    rating,
    updatedAt: new Date(),
  });
};

export const useUpdateDishRating = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { id: string; rating: number }>({
    mutationFn: ({ id, rating }) => updateDishRating(id, rating),
    onSuccess: (_, variables) => {
      console.log(`Rating update successful for dish: ${variables.id}`);
      
      // Invalidate specific dish query
      queryClient.invalidateQueries({ queryKey: ["dishes", variables.id] });
      
      // Update dishes list in cache
      queryClient.setQueryData<Dish[]>(["dishes"], (oldDishes = []) => {
        return oldDishes.map(dish => 
          dish.id === variables.id 
            ? { ...dish, rating: variables.rating } 
            : dish
        );
      });
    },
  });
};

// Generiere einen eindeutigen 8-stelligen Sharing-Code
const generateShareCode = (): string => {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Ohne verwirrende Buchstaben/Zahlen
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Teile ein Gericht und erstelle einen Sharing-Link
const shareDish = async (dishId: string): Promise<SharedDish> => {
  if (!auth.currentUser) throw new Error("Not authenticated");

  console.log("shareDish aufgerufen für:", dishId);
  // Hole das Gericht, um es in den Share-Datensatz zu kopieren
  const dishDoc = await getDoc(doc(db, "dishes", dishId));
  if (!dishDoc.exists()) {
    console.error("Gericht nicht gefunden:", dishId);
    throw new Error("Dish not found");
  }
  
  const dish = { id: dishDoc.id, ...dishDoc.data() } as Dish;
  console.log("Gericht gefunden:", dish);
  
  // Erstelle einen Share-Code
  const shareCode = generateShareCode();
  console.log("Generierter Code:", shareCode);

  // Erstelle ein Ablaufdatum (7 Tage ab jetzt)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Erhalte den Namen des Nutzers, der teilt
  let sharedByName = auth.currentUser.displayName || "Ein Nutzer";
  if (!auth.currentUser.displayName && auth.currentUser.email) {
    // Wenn kein Anzeigename, verwende den Teil vor @ der E-Mail
    sharedByName = auth.currentUser.email.split('@')[0];
  }

  // Erstelle einen SharedDish-Eintrag
  const sharedDishData = {
    dishId,
    dish,
    sharedBy: auth.currentUser.uid,
    sharedByName,
    createdAt: new Date(),
    expiresAt,
    shareCode
  };

  console.log("SharedDish Daten vor dem Speichern:", JSON.stringify(sharedDishData, (_, value) => {
    // Konvertiere Date-Objekte zu einem String für die Ausgabe
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  }, 2));

  try {
    const docRef = await addDoc(collection(db, "sharedDishes"), sharedDishData);
    console.log("SharedDish erstellt mit ID:", docRef.id);
    
    const result = {
      id: docRef.id,
      ...sharedDishData
    };
    
    console.log("SharedDish Rückgabewert:", result);
    return result;
  } catch (error) {
    console.error("Fehler beim Erstellen des SharedDish:", error);
    throw error;
  }
};

// Hole ein geteiltes Gericht mit Share-Code
const getSharedDishByCode = async (shareCode: string): Promise<SharedDish | null> => {
  console.log("Suche nach Gericht mit Code:", shareCode);
  
  try {
    // Diese Abfrage benötigt einen Firestore-Index für die Kombination aus:
    // - shareCode (ASCENDING)
    // - expiresAt (ASCENDING)
    // Der Index muss in der Firestore-Konsole oder mittels firestore.indexes.json erstellt werden
    const q = query(
      collection(db, "sharedDishes"),
      where("shareCode", "==", shareCode),
      where("expiresAt", ">", new Date())
    );
  
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      console.log("Kein Gericht mit diesem Code gefunden oder abgelaufen");
      return null;
    }
  
    const docData = querySnapshot.docs[0];
    console.log("Geteiltes Gericht gefunden:", docData.id);
    
    return { 
      id: docData.id, 
      ...docData.data(),
      // Konvertiere Firestore Timestamps in Date-Objekte
      createdAt: docData.data().createdAt?.toDate() || new Date(),
      expiresAt: docData.data().expiresAt?.toDate() || new Date(),
    } as SharedDish;
  } catch (error) {
    console.error("Fehler beim Abrufen des geteilten Gerichts:", error);
    // Wirf den Fehler weiter, damit der übergeordnete Code damit umgehen kann
    throw error;
  }
};

// Importiere ein geteiltes Gericht in deine eigene Sammlung
const importSharedDish = async (shareCode: string): Promise<Dish | null> => {
  if (!auth.currentUser) throw new Error("Not authenticated");

  const sharedDish = await getSharedDishByCode(shareCode);
  if (!sharedDish) throw new Error("Shared dish not found or expired");

  // Erstelle eine Kopie des Gerichts in der Dishes-Sammlung des Nutzers
  const dish = sharedDish.dish;
  
  // Stelle sicher, dass keine undefined-Werte existieren
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
    originalId: dish.id, // Speichere die Original-ID
    createdBy: auth.currentUser.uid,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  try {
    const docRef = await addDoc(collection(db, "dishes"), newDishData);
    
    console.log("Gericht erfolgreich importiert mit ID:", docRef.id);
    
    return {
      id: docRef.id,
      ...newDishData
    } as Dish;
  } catch (error) {
    console.error("Fehler beim Importieren des Gerichts:", error);
    throw error;
  }
};

// React Query Hooks für das Teilen
export const useShareDish = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (dishId: string) => {
      console.log("Starte Teilen-Prozess für Gericht:", dishId);
      try {
        const result = await shareDish(dishId);
        console.log("Sharing-Ergebnis:", result);
        return result;
      } catch (error) {
        console.error("Error in shareDish mutation:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("ShareDish Mutation erfolgreich:", data);
      // Invalidiere die Dishes-Query, falls nötig
      queryClient.invalidateQueries({ queryKey: ["dishes"] });
    },
    onError: (error) => {
      console.error("ShareDish Mutation fehlgeschlagen:", error);
    },
  });
};

export const useGetSharedDishByCode = (shareCode: string, options?: { enabled?: boolean }) => {
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
    onSuccess: (dish) => {
      // Invalidiere die Dishes-Query nach dem Import
      queryClient.invalidateQueries({ queryKey: ["dishes"] });
      return dish;
    },
  });
};
