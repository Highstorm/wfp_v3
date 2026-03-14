import { useState, useEffect, FormEvent } from "react";
import { auth } from "../../lib/firebase";
import {
  useWeeklyNutritionGoals,
  useCreateWeeklyNutritionGoals,
  useUpdateWeeklyNutritionGoals,
  useDeleteWeeklyNutritionGoals,
} from "../../hooks/useWeeklyGoals";
import type { WeeklyNutritionGoals } from "../../types";

interface WeeklyNutritionGoalsFormProps {
  weekStartDate: string;
}

export const WeeklyNutritionGoalsForm = ({
  weekStartDate,
}: WeeklyNutritionGoalsFormProps) => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [targetCalories, setTargetCalories] = useState<string>("");
  const [protein, setProtein] = useState<string>("");
  const [carbs, setCarbs] = useState<string>("");
  const [fat, setFat] = useState<string>("");
  const [message, setMessage] = useState({ text: "", type: "" });

  const { data: weeklyGoals, isLoading } =
    useWeeklyNutritionGoals(weekStartDate);
  const { mutate: createWeeklyGoals, isPending: isCreating } =
    useCreateWeeklyNutritionGoals();
  const { mutate: updateWeeklyGoals, isPending: isUpdating } =
    useUpdateWeeklyNutritionGoals();
  const { mutate: deleteWeeklyGoals, isPending: isDeleting } =
    useDeleteWeeklyNutritionGoals();

  // Lade die Werte aus den wochenspezifischen Zielen, wenn vorhanden
  useEffect(() => {
    if (weeklyGoals) {
      setTargetCalories(weeklyGoals.targetCalories?.toString() || "");
      setProtein(weeklyGoals.protein?.toString() || "");
      setCarbs(weeklyGoals.carbs?.toString() || "");
      setFat(weeklyGoals.fat?.toString() || "");
    } else {
      // Zurücksetzen, wenn keine wochenspezifischen Ziele vorhanden sind
      setTargetCalories("");
      setProtein("");
      setCarbs("");
      setFat("");
    }
  }, [weeklyGoals]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!auth.currentUser?.uid) return;

    const goalsData: Omit<WeeklyNutritionGoals, "id"> = {
      weekStartDate,
      targetCalories: targetCalories ? parseInt(targetCalories) : null,
      protein: protein ? parseInt(protein) : null,
      carbs: carbs ? parseInt(carbs) : null,
      fat: fat ? parseInt(fat) : null,
      createdBy: auth.currentUser.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (weeklyGoals?.id) {
      updateWeeklyGoals(
        {
          id: weeklyGoals.id,
          ...goalsData,
        },
        {
          onSuccess: () => {
            setMessage({
              text: "Wochenspezifische Ziele erfolgreich aktualisiert!",
              type: "success",
            });
            setIsFormVisible(false);
          },
          onError: () => {
            setMessage({
              text: "Fehler beim Speichern der wochenspezifischen Ziele.",
              type: "error",
            });
          },
        }
      );
    } else {
      createWeeklyGoals(goalsData, {
        onSuccess: () => {
          setMessage({
            text: "Wochenspezifische Ziele erfolgreich gespeichert!",
            type: "success",
          });
          setIsFormVisible(false);
        },
        onError: () => {
          setMessage({
            text: "Fehler beim Speichern der wochenspezifischen Ziele.",
            type: "error",
          });
        },
      });
    }
  };

  const handleDelete = () => {
    if (!weeklyGoals?.id) return;

    deleteWeeklyGoals(weeklyGoals.id, {
      onSuccess: () => {
        setMessage({
          text: "Wochenspezifische Ziele erfolgreich gelöscht!",
          type: "success",
        });
        setIsFormVisible(false);
        setTargetCalories("");
        setProtein("");
        setCarbs("");
        setFat("");
      },
      onError: () => {
        setMessage({
          text: "Fehler beim Löschen der wochenspezifischen Ziele.",
          type: "error",
        });
      },
    });
  };

  if (isLoading) {
    return <div>Lade Wochenziele...</div>;
  }

  return (
    <div className="card p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-foreground">
          Wochenspezifische Ernährungsziele
        </h3>
        <button
          onClick={() => setIsFormVisible(!isFormVisible)}
          className="-m-2 rounded-lg p-2 text-sm text-primary hover:bg-accent"
        >
          {isFormVisible
            ? "Formular ausblenden ↑"
            : weeklyGoals
            ? "Wochenspezifische Ziele bearbeiten ↓"
            : "Wochenspezifische Ziele hinzufügen ↓"}
        </button>
      </div>

      {weeklyGoals && !isFormVisible && (
        <div className="mb-4 rounded-lg bg-accent p-4">
          <h4 className="mb-2 text-sm font-medium">
            Aktuelle wochenspezifische Ziele:
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {weeklyGoals.targetCalories && (
              <div>
                <span className="font-medium">Zielkalorien:</span>{" "}
                {weeklyGoals.targetCalories} kcal
              </div>
            )}
            {weeklyGoals.protein && (
              <div>
                <span className="font-medium">Protein:</span>{" "}
                {weeklyGoals.protein}g
              </div>
            )}
            {weeklyGoals.carbs && (
              <div>
                <span className="font-medium">Kohlenhydrate:</span>{" "}
                {weeklyGoals.carbs}g
              </div>
            )}
            {weeklyGoals.fat && (
              <div>
                <span className="font-medium">Fette:</span> {weeklyGoals.fat}g
              </div>
            )}
          </div>
        </div>
      )}

      {message.text && (
        <div
          className={`mb-4 rounded-lg p-2 text-sm ${
            message.type === "success"
              ? "bg-success/10 text-success-foreground"
              : "bg-destructive/10 text-destructive-foreground"
          }`}
        >
          {message.text}
        </div>
      )}

      {isFormVisible && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="targetCalories"
                className="mb-1 block text-sm font-medium"
              >
                Zielkalorien (kcal)
              </label>
              <input
                type="number"
                id="targetCalories"
                value={targetCalories}
                onChange={(e) => setTargetCalories(e.target.value)}
                min="0"
                className="input"
                placeholder="z.B. 2200"
              />
            </div>
            <div>
              <label
                htmlFor="protein"
                className="mb-1 block text-sm font-medium"
              >
                Protein (g)
              </label>
              <input
                type="number"
                id="protein"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                min="0"
                className="input"
                placeholder="z.B. 150"
              />
            </div>
            <div>
              <label htmlFor="carbs" className="mb-1 block text-sm font-medium">
                Kohlenhydrate (g)
              </label>
              <input
                type="number"
                id="carbs"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                min="0"
                className="input"
                placeholder="z.B. 250"
              />
            </div>
            <div>
              <label htmlFor="fat" className="mb-1 block text-sm font-medium">
                Fette (g)
              </label>
              <input
                type="number"
                id="fat"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                min="0"
                className="input"
                placeholder="z.B. 70"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
            {weeklyGoals?.id && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className={`btn-primary mt-4 w-full sm:w-auto`}
              >
                Löschen
              </button>
            )}
            <button
              type="submit"
              disabled={isCreating || isUpdating}
              className={`btn-primary mt-4 w-full sm:w-auto`}
            >
              {isCreating || isUpdating
                ? "Wird gespeichert..."
                : weeklyGoals?.id
                ? "Aktualisieren"
                : "Hinzufügen"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
