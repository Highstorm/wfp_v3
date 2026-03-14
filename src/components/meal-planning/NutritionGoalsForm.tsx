import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { logger } from "../../utils/logger";

interface NutritionGoals {
  baseCalories: number | null;
  targetCalories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

type FirestoreNutritionGoals = {
  [K in keyof NutritionGoals]?: number;
};

export const NutritionGoalsForm = () => {
  const [goals, setGoals] = useState<NutritionGoals>({
    baseCalories: null,
    targetCalories: null,
    protein: null,
    carbs: null,
    fat: null,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      if (!auth.currentUser?.email) return;

      const profileRef = doc(db, "profiles", auth.currentUser.email);
      const profileSnap = await getDoc(profileRef);

      if (profileSnap.exists()) {
        const data = profileSnap.data();
        setGoals({
          baseCalories: data.baseCalories ?? data.calories ?? null,
          targetCalories: data.targetCalories ?? data.calories ?? null,
          protein: data.protein ?? null,
          carbs: data.carbs ?? null,
          fat: data.fat ?? null,
        });
      }
    };

    loadProfile();
  }, [auth.currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser?.email) return;

    setIsSaving(true);
    setMessage("");

    try {
      const firestoreGoals: FirestoreNutritionGoals = {};

      if (goals.baseCalories !== null)
        firestoreGoals.baseCalories = goals.baseCalories;
      if (goals.targetCalories !== null)
        firestoreGoals.targetCalories = goals.targetCalories;
      if (goals.protein !== null) firestoreGoals.protein = goals.protein;
      if (goals.carbs !== null) firestoreGoals.carbs = goals.carbs;
      if (goals.fat !== null) firestoreGoals.fat = goals.fat;

      await setDoc(doc(db, "profiles", auth.currentUser.email), firestoreGoals);
      setMessage("Profil erfolgreich gespeichert!");
    } catch (error) {
      setMessage("Fehler beim Speichern des Profils.");
      logger.error("Error saving nutrition goals:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange =
    (field: keyof NutritionGoals) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setGoals((prev) => ({
        ...prev,
        [field]: value === "" ? null : parseInt(value) || 0,
      }));
    };

  return (
    <div>
      <h2 className="font-display font-extrabold text-lg mb-4">Nährwertziele</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 2x2 Goals Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-xl p-3">
            <label htmlFor="targetCalories" className="block text-xs text-muted-foreground mb-1">
              Zielkalorien
            </label>
            <input
              id="targetCalories"
              type="number"
              value={goals.targetCalories ?? ""}
              onChange={handleChange("targetCalories")}
              className="w-full bg-transparent font-display font-bold text-lg outline-none placeholder:text-muted-foreground/50"
              min="0"
              placeholder="2000"
            />
            <span className="text-xs text-muted-foreground">kcal</span>
          </div>
          <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-xl p-3">
            <label htmlFor="protein" className="block text-xs text-muted-foreground mb-1">
              Protein
            </label>
            <input
              id="protein"
              type="number"
              value={goals.protein ?? ""}
              onChange={handleChange("protein")}
              className="w-full bg-transparent font-display font-bold text-lg outline-none placeholder:text-muted-foreground/50"
              min="0"
              placeholder="150"
            />
            <span className="text-xs text-muted-foreground">g</span>
          </div>
          <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-xl p-3">
            <label htmlFor="carbs" className="block text-xs text-muted-foreground mb-1">
              Kohlenhydrate
            </label>
            <input
              id="carbs"
              type="number"
              value={goals.carbs ?? ""}
              onChange={handleChange("carbs")}
              className="w-full bg-transparent font-display font-bold text-lg outline-none placeholder:text-muted-foreground/50"
              min="0"
              placeholder="250"
            />
            <span className="text-xs text-muted-foreground">g</span>
          </div>
          <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-xl p-3">
            <label htmlFor="fat" className="block text-xs text-muted-foreground mb-1">
              Fett
            </label>
            <input
              id="fat"
              type="number"
              value={goals.fat ?? ""}
              onChange={handleChange("fat")}
              className="w-full bg-transparent font-display font-bold text-lg outline-none placeholder:text-muted-foreground/50"
              min="0"
              placeholder="70"
            />
            <span className="text-xs text-muted-foreground">g</span>
          </div>
        </div>

        {/* Base calories below */}
        <div className="bg-zinc-50 dark:bg-zinc-800/30 rounded-xl p-3">
          <label htmlFor="baseCalories" className="block text-xs text-muted-foreground mb-1">
            Grundumsatz (kcal)
          </label>
          <input
            id="baseCalories"
            type="number"
            value={goals.baseCalories ?? ""}
            onChange={handleChange("baseCalories")}
            className="w-full bg-transparent font-medium outline-none placeholder:text-muted-foreground/50"
            min="0"
            placeholder="1800"
          />
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="btn-primary w-full"
        >
          {isSaving ? "Wird gespeichert..." : "Ziele speichern"}
        </button>

        {message && (
          <p className={`text-sm text-center ${message.includes("Fehler") ? "text-destructive" : "text-green-600"}`}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
};
