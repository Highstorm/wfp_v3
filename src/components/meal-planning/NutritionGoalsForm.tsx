import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";

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
      console.error(error);
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
    <div className="card p-3 sm:p-4 lg:p-8">
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <h1 className="text-center text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight break-words px-2">
          Meine Ernährungsziele
        </h1>
        <p className="mt-1.5 sm:mt-2 text-center text-sm sm:text-base text-muted-foreground">
          Lege deine täglichen Ernährungsziele fest
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 lg:space-y-5">
          <div>
            <label htmlFor="baseCalories" className="block text-sm sm:text-sm font-medium mb-1.5">
              Grundbedarf (kcal)
            </label>
            <input
              id="baseCalories"
              type="number"
              value={goals.baseCalories ?? ""}
              onChange={handleChange("baseCalories")}
              className="input text-base sm:text-sm"
              min="0"
              placeholder="z.B. 1800"
            />
          </div>

          <div>
            <label
              htmlFor="targetCalories"
              className="block text-sm sm:text-sm font-medium mb-1.5"
            >
              Zielkalorien (kcal)
            </label>
            <input
              id="targetCalories"
              type="number"
              value={goals.targetCalories ?? ""}
              onChange={handleChange("targetCalories")}
              className="input text-base sm:text-sm"
              min="0"
              placeholder="z.B. 2000"
            />
          </div>

          <div>
            <label htmlFor="protein" className="block text-sm sm:text-sm font-medium mb-1.5">
              Protein (g)
            </label>
            <input
              id="protein"
              type="number"
              value={goals.protein ?? ""}
              onChange={handleChange("protein")}
              className="input text-base sm:text-sm"
              min="0"
              placeholder="z.B. 150"
            />
          </div>

          <div>
            <label htmlFor="fat" className="block text-sm sm:text-sm font-medium mb-1.5">
              Fette (g)
            </label>
            <input
              id="fat"
              type="number"
              value={goals.fat ?? ""}
              onChange={handleChange("fat")}
              className="input text-base sm:text-sm"
              min="0"
              placeholder="z.B. 70"
            />
          </div>

          <div>
            <label htmlFor="carbs" className="block text-sm sm:text-sm font-medium mb-1.5">
              Kohlenhydrate (g)
            </label>
            <input
              id="carbs"
              type="number"
              value={goals.carbs ?? ""}
              onChange={handleChange("carbs")}
              className="input text-base sm:text-sm"
              min="0"
              placeholder="z.B. 250"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary w-full text-base sm:text-sm py-2.5 sm:py-2 min-h-[44px] sm:min-h-0"
          >
            {isSaving ? "Wird gespeichert..." : "Ernährungsziele speichern"}
          </button>

          {message && (
            <p
              className={`mt-2 sm:mt-2 text-sm sm:text-sm text-center leading-relaxed ${
                message.includes("Fehler") ? "text-destructive" : "text-green-600"
              }`}
            >
              {message}
            </p>
          )}
      </form>
    </div>
  );
};
