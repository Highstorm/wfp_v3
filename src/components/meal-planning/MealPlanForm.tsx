import { useState, useEffect, useMemo } from "react";
import { WeekCalendar } from "./WeekCalendar";
import { DeleteConfirmDialog } from "../shared/DeleteConfirmDialog";
import { ResetConfirmDialog } from "../shared/ResetConfirmDialog";
import { NutritionSummary } from "./NutritionSummary";
import { MealSection } from "./MealSection";
import { SportSection } from "./SportSection";
import { SnacksAndExtrasSection } from "./SnacksAndExtrasSection";
import { MealPlanActions } from "./MealPlanActions";
import { WeeklyNutritionGoalsForm } from "./WeeklyNutritionGoalsForm";
import { useDishes } from "../../hooks/useDishes";
import {
  useMealPlanByDate,
  useCreateMealPlan,
  useUpdateMealPlan,
  useDeleteMealPlan,
} from "../../hooks/useMealPlans";
import { useNutritionGoals } from "../../hooks/useProfile";
import { useWeeklyNutritionGoals } from "../../hooks/useWeeklyGoals";
import type { Dish, MealPlan, SportActivity, TemporaryMeal, NutritionGoals } from "../../types";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { IntervalsService, type IntervalsCredentials } from "../../services/intervals.service";

interface DeleteConfirmDialog {
  isOpen: boolean;
  planDate: string;
}

interface ResetConfirmDialog {
  isOpen: boolean;
  planDate: string;
}

type MealSectionType = {
  title: string;
  key: keyof Pick<MealPlan, "breakfast" | "lunch" | "dinner" | "snacks">;
  dishes: Dish[];
};

const calculateTotalBurnedCalories = (
  activities: SportActivity[] = []
): number => {
  return activities.reduce((total, activity) => total + activity.calories, 0);
};

export const MealPlanForm = () => {
  const [date, setDate] = useState<string>(() => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localDate = new Date(today.getTime() - offset * 60 * 1000);
    return localDate.toISOString().split("T")[0];
  });

  // Berechne den Montag der aktuellen Woche
  const getWeekStartDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(date);
    weekStart.setDate(diff);
    return weekStart.toISOString().split("T")[0];
  };

  const [weekStartDate, setWeekStartDate] = useState<string>(
    getWeekStartDate(date)
  );

  const [message, setMessage] = useState({ text: "", type: "" });
  const [selectedMeal, setSelectedMeal] =
    useState<keyof Pick<MealPlan, "breakfast" | "lunch" | "dinner" | "snacks">>(
      "breakfast"
    );
  const [searchTerm, setSearchTerm] = useState("");
  const [showDishList, setShowDishList] = useState(false);
  const [showSnacksDishList, setShowSnacksDishList] = useState(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] =
    useState<DeleteConfirmDialog>({
      isOpen: false,
      planDate: "",
    });
  const [resetConfirmDialog, setResetConfirmDialog] =
    useState<ResetConfirmDialog>({
      isOpen: false,
      planDate: "",
    });
  const [expandedRecipes, setExpandedRecipes] = useState<Set<string>>(
    new Set()
  );
  const [stomachPainTrackingEnabled, setStomachPainTrackingEnabled] =
    useState<boolean>(false);
  const [weeklyNutritionGoalsEnabled, setWeeklyNutritionGoalsEnabled] =
    useState<boolean>(true);
  const [dailyNoteEnabled, setDailyNoteEnabled] = useState<boolean>(true);
  const [sportEnabled, setSportEnabled] = useState<boolean>(true);

  // React Query Hooks mit optimierten Optionen
  const { data: dishes = [], isLoading: isDishesLoading } = useDishes();
  const {
    data: nutritionGoals = {
      baseCalories: null,
      targetCalories: null,
      protein: null,
      carbs: null,
      fat: null,
    },
  } = useNutritionGoals();
  const { data: weeklyNutritionGoals } = useWeeklyNutritionGoals(weekStartDate);
  const { data: existingMealPlan, isLoading: isMealPlanLoading } =
    useMealPlanByDate(date);
  const { mutate: createMealPlan, isPending: isCreating } = useCreateMealPlan();
  const { mutate: updateMealPlan, isPending: isUpdating } = useUpdateMealPlan();
  const { mutate: deleteMealPlan, isPending: isDeleting } = useDeleteMealPlan();

  // Kombiniere die allgemeinen und wochenspezifischen Ernährungsziele
  const combinedNutritionGoals: NutritionGoals = useMemo(() => {
    if (!weeklyNutritionGoals) {
      return nutritionGoals;
    }

    return {
      baseCalories: nutritionGoals.baseCalories,
      targetCalories:
        weeklyNutritionGoals.targetCalories ?? nutritionGoals.targetCalories,
      protein: weeklyNutritionGoals.protein ?? nutritionGoals.protein,
      carbs: weeklyNutritionGoals.carbs ?? nutritionGoals.carbs,
      fat: weeklyNutritionGoals.fat ?? nutritionGoals.fat,
    };
  }, [nutritionGoals, weeklyNutritionGoals]);

  const [mealPlan, setMealPlan] = useState<MealPlan>({
    id: "",
    date: date,
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: [],
    sports: [],
    temporaryMeals: [],
    createdBy: auth.currentUser?.uid || "",
    createdAt: new Date(),
    updatedAt: new Date(),
    dailyNote: "",
  });

  // Lade User-Einstellungen für Feature-Toggles
  useEffect(() => {
    const loadUserSettings = async () => {
      if (auth.currentUser?.email) {
        try {
          const profileRef = doc(db, "profiles", auth.currentUser.email);
          const profileSnap = await getDoc(profileRef);

          if (profileSnap.exists()) {
            const data = profileSnap.data();
            setStomachPainTrackingEnabled(
              data.stomachPainTrackingEnabled || false
            );
            setWeeklyNutritionGoalsEnabled(
              data.weeklyNutritionGoalsEnabled !== undefined
                ? data.weeklyNutritionGoalsEnabled
                : true
            );
            setDailyNoteEnabled(
              data.dailyNoteEnabled !== undefined ? data.dailyNoteEnabled : true
            );
            setSportEnabled(
              data.sportEnabled !== undefined ? data.sportEnabled : true
            );
          }
        } catch (error) {
          console.error("Fehler beim Laden der User-Einstellungen:", error);
        }
      }
    };

    loadUserSettings();
  }, [auth.currentUser]);

  // Optimiertes Laden des existierenden Tagesplans
  useEffect(() => {
    if (!isMealPlanLoading) {
      if (existingMealPlan) {
        setMealPlan({
          ...existingMealPlan,
          sports: existingMealPlan.sports || [],
          temporaryMeals: existingMealPlan.temporaryMeals || [],
          breakfast: existingMealPlan.breakfast || [],
          lunch: existingMealPlan.lunch || [],
          dinner: existingMealPlan.dinner || [],
          snacks: existingMealPlan.snacks || [],
        });
      } else {
        resetForm();
      }
    }
  }, [existingMealPlan, isMealPlanLoading]);

  const getIntervalsCredentials = async (): Promise<IntervalsCredentials | null> => {
    if (!auth.currentUser?.email) return null;
    const profileRef = doc(db, "profiles", auth.currentUser.email);
    const profileSnap = await getDoc(profileRef);
    if (!profileSnap.exists()) return null;
    const data = profileSnap.data();
    const athleteId = data["intervals.icu-AthleteID"];
    const apiKey = data["intervals.icu-API-KEY"];
    if (!athleteId || !apiKey) return null;
    return { athleteId, apiKey };
  };

  const handleLoadIntervalsActivities = async () => {
    try {
      const credentials = await getIntervalsCredentials();
      if (!credentials) {
        setMessage({ text: "Keine Intervals.icu Credentials gefunden.", type: "error" });
        return;
      }
      const activities = await IntervalsService.getActivitiesForDate(date, credentials);
      let newActivitiesAdded = false;

      // Für jede Aktivität prüfen, ob sie bereits im Plan existiert
      for (const activity of activities) {
        const existingActivity = mealPlan?.sports?.some((sport) => {
          // Vergleiche sowohl intervalsId als auch Beschreibung + Kalorien als Fallback
          const sameById =
            sport.intervalsId && sport.intervalsId === String(activity.id);
          const sameByData =
            !sport.intervalsId &&
            sport.description === activity.name &&
            sport.calories === activity.calories;
          return Boolean(sameById || sameByData);
        });

        console.log(
          `Intervals.icu: Prüfe Aktivität → { id: ${activity.id}, name: ${activity.name}, calories: ${activity.calories} } | existiert: ${existingActivity}`
        );

        if (!existingActivity) {
          // Logge vor dem Hinzufügen die Länge
          const beforeLen = mealPlan?.sports?.length || 0;
          handleAddSportActivity({
            description: activity.name,
            calories: activity.calories,
            intervalsId: String(activity.id),
          });
          newActivitiesAdded = true;
          console.log(
            `Intervals.icu: Aktivität hinzugefügt. Länge vorher: ${beforeLen}, nachher (erwartet): ${
              beforeLen + 1
            }`
          );
        }
      }

      // Zeige Popup nur wenn neue Aktivitäten hinzugefügt wurden
      if (newActivitiesAdded) {
        setMessage({
          text: "Ein Sporteintrag wurde automatisch erzeugt.",
          type: "success",
        });
      } else {
        setMessage({
          text: "Keine neuen Aktivitäten gefunden.",
          type: "info",
        });
      }
    } catch (error) {
      console.error("Fehler beim Laden der Intervals.icu Aktivitäten:", error);
      setMessage({
        text: "Fehler beim Laden der Aktivitäten.",
        type: "error",
      });
    }
  };

  const handleInputFocus = (
    sectionKey: keyof Pick<
      MealPlan,
      "breakfast" | "lunch" | "dinner" | "snacks"
    >
  ) => {
    setSelectedMeal(sectionKey);
    if (sectionKey === "snacks") {
      setShowSnacksDishList(true);
    } else {
      setShowDishList(true);
    }
  };

  const handleInputBlur = (e: React.FocusEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    const isInputOrListItem =
      relatedTarget?.tagName === "INPUT" ||
      relatedTarget?.closest(".dish-list-item");

    if (!isInputOrListItem) {
      setTimeout(() => {
        setShowDishList(false);
        setShowSnacksDishList(false);
      }, 200);
    }
  };

  const mealSections: MealSectionType[] = [
    { title: "Frühstück", key: "breakfast", dishes: mealPlan.breakfast },
    { title: "Mittagessen", key: "lunch", dishes: mealPlan.lunch },
    { title: "Abendessen", key: "dinner", dishes: mealPlan.dinner },
  ];

  const handleDateChange = (newDate: string) => {
    if (newDate !== date) {
      setDate(newDate);
      setWeekStartDate(getWeekStartDate(newDate));
      resetForm();
    }
  };

  const resetForm = () => {
    setMealPlan({
      id: "",
      date: date,
      breakfast: [],
      lunch: [],
      dinner: [],
      snacks: [],
      sports: [],
      temporaryMeals: [],
      createdBy: auth.currentUser?.uid || "",
      createdAt: new Date(),
      updatedAt: new Date(),
      dailyNote: "",
    });
    setMessage({ text: "", type: "" });
  };

  const calculateTotalNutrition = () => {
    const allDishes = [
      ...mealPlan.breakfast,
      ...mealPlan.lunch,
      ...mealPlan.dinner,
      ...mealPlan.snacks,
    ];

    const dishNutrition = allDishes.reduce(
      (total, dish) => {
        const quantity = (dish as { quantity?: number }).quantity ?? 1;
        return {
          calories: total.calories + (dish.calories || 0) * quantity,
          protein: total.protein + (dish.protein || 0) * quantity,
          carbs: total.carbs + (dish.carbs || 0) * quantity,
          fat: total.fat + (dish.fat || 0) * quantity,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    const tempMealNutrition = (mealPlan.temporaryMeals || []).reduce(
      (total, meal) => ({
        calories: total.calories + meal.calories,
        protein: total.protein + meal.protein,
        carbs: total.carbs + meal.carbs,
        fat: total.fat + meal.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    return {
      calories: dishNutrition.calories + tempMealNutrition.calories,
      protein: dishNutrition.protein + tempMealNutrition.protein,
      carbs: dishNutrition.carbs + tempMealNutrition.carbs,
      fat: dishNutrition.fat + tempMealNutrition.fat,
    };
  };

  const handleAddTemporaryMeal = (meal: TemporaryMeal) => {
    setMealPlan((prev) => ({
      ...prev,
      temporaryMeals: [...prev.temporaryMeals, meal],
    }));
  };

  const handleRemoveTemporaryMeal = (index: number) => {
    setMealPlan((prev) => ({
      ...prev,
      temporaryMeals: prev.temporaryMeals.filter((_, i) => i !== index),
    }));
  };

  const handleAddDish = (dish: Dish) => {
    const uniqueId = `${dish.id}-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    setMealPlan((prev) => ({
      ...prev,
      [selectedMeal]: [
        ...prev[selectedMeal],
        {
          ...dish,
          id: uniqueId,
          originalId: dish.id,
          createdBy: auth.currentUser?.uid || "",
          quantity: 1,
        },
      ],
    }));
    setSearchTerm("");
  };

  const handleRemoveDish = (
    mealType: keyof Pick<MealPlan, "breakfast" | "lunch" | "dinner" | "snacks">,
    dishId: string
  ) => {
    setMealPlan((prev) => ({
      ...prev,
      [mealType]: (prev[mealType] as Dish[]).filter(
        (dish) => dish.id !== dishId
      ),
    }));
  };

  const handleUpdateDishQuantity = (dishId: string, newQuantity: number) => {
    setMealPlan((prev) => {
      // Suche das Gericht in allen Mahlzeittypen
      const updateDishesInMeal = (dishes: Dish[]) =>
        dishes.map((dish) =>
          dish.id === dishId ? { ...dish, quantity: newQuantity } : dish
        );

      return {
        ...prev,
        breakfast: updateDishesInMeal(prev.breakfast || []),
        lunch: updateDishesInMeal(prev.lunch || []),
        dinner: updateDishesInMeal(prev.dinner || []),
        snacks: updateDishesInMeal(prev.snacks || []),
      };
    });
  };

  const handleSave = async () => {
    if (!auth.currentUser?.uid) return;

    try {
      const mealPlanData = {
        ...mealPlan,
        date: date,
        createdBy: auth.currentUser.uid,
        updatedAt: new Date(),
      };

      if (mealPlan.id) {
        const { id, ...updateData } = mealPlanData;
        await updateMealPlan({
          id,
          ...updateData,
        });
        setMessage({
          text: "Tagesplan erfolgreich aktualisiert!",
          type: "success",
        });
      } else {
        await createMealPlan(mealPlanData);
        setMessage({
          text: "Tagesplan erfolgreich gespeichert!",
          type: "success",
        });
      }

      // Aktualisiere den Kalender
      // @ts-ignore
      window.refreshCalendar?.();

      // Übertrage Wellness-Daten an intervals.icu
      try {
        const credentials = await getIntervalsCredentials();
        if (credentials) {
          const nutrition = calculateTotalNutrition();
          await IntervalsService.updateWellnessForDate(date, nutrition.calories, credentials);
        }
      } catch {
        // TODO: logger.error("Error syncing wellness data to Intervals.icu")
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Fehler beim Speichern:", err.message);
        setMessage({
          text: "Fehler beim Speichern des Tagesplans.",
          type: "error",
        });
      }
    }
  };

  const handleDelete = async () => {
    if (!auth.currentUser?.uid || !mealPlan.id) return;

    try {
      await deleteMealPlan(mealPlan.id);

      // Aktualisiere den Kalender
      // @ts-ignore
      window.refreshCalendar?.();

      setMessage({
        text: "Tagesplan erfolgreich gelöscht!",
        type: "success",
      });
      resetForm();
      setDeleteConfirmDialog({ isOpen: false, planDate: "" });
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Fehler beim Löschen:", err.message);
        setMessage({
          text: "Fehler beim Löschen des Tagesplans.",
          type: "error",
        });
      }
    }
  };

  const toggleRecipe = (dishId: string) => {
    setExpandedRecipes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dishId)) {
        newSet.delete(dishId);
      } else {
        newSet.add(dishId);
      }
      return newSet;
    });
  };

  const handleAddSportActivity = (activity: SportActivity) => {
    setMealPlan((prev) => {
      const currentSports = Array.isArray(prev.sports) ? prev.sports : [];
      const updated = {
        ...prev,
        sports: [...currentSports, activity],
      };
      console.log(
        "MealPlan: Sport hinzugefügt →",
        activity,
        "| Neue Anzahl:",
        updated.sports.length
      );
      return updated;
    });
  };

  const handleRemoveSportActivity = (index: number) => {
    setMealPlan((prev) => ({
      ...prev,
      sports: prev.sports.filter((_, i) => i !== index),
    }));
  };

  const handleStomachPainChange = (level: number) => {
    setMealPlan((prev) => ({
      ...prev,
      stomachPainLevel: level,
    }));
  };

  // Gerichtskategorien für die verschiedenen Mahlzeittypen
  const getCategoryFilteredDishes = (
    mealType: keyof Pick<MealPlan, "breakfast" | "lunch" | "dinner" | "snacks">
  ) => {
    // Prüfe, ob es überhaupt kategorisierte Gerichte für diesen Typ gibt
    const categoryMap = {
      breakfast: "breakfast",
      lunch: "mainDish",
      dinner: "mainDish",
      snacks: "snack",
    };

    const matchingCategory = categoryMap[mealType] as
      | "breakfast"
      | "mainDish"
      | "snack";
    const hasCategorizedDishes = dishes.some(
      (dish) => dish.category === matchingCategory
    );

    // Wenn es keine Gerichte mit der richtigen Kategorie gibt, zeige auch unkategorisierte an
    if (hasCategorizedDishes) {
      return dishes.filter((dish) => dish.category === matchingCategory);
    } else {
      return dishes.filter(
        (dish) => dish.category === matchingCategory || !dish.category
      );
    }
  };

  const handleReset = () => {
    resetForm();
    setResetConfirmDialog({ isOpen: false, planDate: "" });
  };

  // Optimierter Loading-State
  if (isDishesLoading || isMealPlanLoading) {
    return (
      <div className="container mx-auto p-2 sm:p-4">
        <div className="card p-8">
          <p className="text-center text-muted-foreground">Lade Daten...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-1 sm:py-2 pb-20 md:pb-2">
      <div className="py-1 sm:py-2">
        <WeekCalendar selectedDate={date} onDateSelect={handleDateChange} />
      </div>

      {weeklyNutritionGoalsEnabled && (
        <div className="py-1 sm:py-2">
          <WeeklyNutritionGoalsForm weekStartDate={weekStartDate} />
        </div>
      )}

      <div className="py-1 sm:py-2">
        <NutritionSummary
          currentNutrition={calculateTotalNutrition()}
          nutritionGoals={combinedNutritionGoals}
          burnedCalories={calculateTotalBurnedCalories(mealPlan.sports || [])}
        />
      </div>

      {/* Mahlzeiten */}
      <div className="py-1 sm:py-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
          {mealSections.map((section, index) => (
            <div
              key={section.key}
              className={
                index === 0
                  ? "relative z-[60]"
                  : index === 1
                  ? "relative z-[59]"
                  : "relative z-[58]"
              }
            >
              <MealSection
                title={section.title}
                dishes={section.dishes || []}
                searchTerm={searchTerm}
                selectedMeal={selectedMeal}
                sectionKey={section.key}
                showDishList={showDishList}
                availableDishes={getCategoryFilteredDishes(section.key)}
                expandedRecipes={expandedRecipes}
                onInputFocus={handleInputFocus}
                onInputBlur={handleInputBlur}
                onSearchTermChange={setSearchTerm}
                onAddDish={(dish) => {
                  handleAddDish(dish);
                  setSearchTerm("");
                  setShowDishList(false);
                }}
                onRemoveDish={(dishId) => handleRemoveDish(section.key, dishId)}
                onToggleRecipe={toggleRecipe}
                onUpdateDishQuantity={handleUpdateDishQuantity}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Snacks & Zusätzliches */}
      <div className="py-1 sm:py-2 relative z-40">
        <SnacksAndExtrasSection
          dishes={mealPlan.snacks || []}
          temporaryMeals={mealPlan.temporaryMeals || []}
          searchTerm={selectedMeal === "snacks" ? searchTerm : ""}
          showDishList={showSnacksDishList}
          availableDishes={getCategoryFilteredDishes("snacks")}
          expandedRecipes={expandedRecipes}
          onInputFocus={() => handleInputFocus("snacks")}
          onInputBlur={handleInputBlur}
          onSearchTermChange={setSearchTerm}
          onAddDish={(dish) => {
            handleAddDish(dish);
            setSearchTerm("");
            setShowSnacksDishList(false);
          }}
          onRemoveDish={(dishId) => handleRemoveDish("snacks", dishId)}
          onToggleRecipe={toggleRecipe}
          onAddTemporaryMeal={handleAddTemporaryMeal}
          onRemoveTemporaryMeal={handleRemoveTemporaryMeal}
          onUpdateDishQuantity={handleUpdateDishQuantity}
        />
      </div>

      {/* Sport */}
      {sportEnabled && (
        <div className="py-1 sm:py-2 relative z-30">
          <SportSection
            activities={mealPlan.sports || []}
            onAddActivity={handleAddSportActivity}
            onRemoveActivity={handleRemoveSportActivity}
            onLoadIntervalsActivities={handleLoadIntervalsActivities}
          />
        </div>
      )}

      {/* Aktionen */}
      <div className="py-1 sm:py-2">
        <MealPlanActions
          mealPlan={mealPlan}
          isCreating={isCreating}
          isUpdating={isUpdating}
          isDeleting={isDeleting}
          message={message}
          onSave={handleSave}
          onReset={() =>
            setResetConfirmDialog({ isOpen: true, planDate: date })
          }
          onDelete={() =>
            setDeleteConfirmDialog({ isOpen: true, planDate: date })
          }
          onDailyNoteChange={(value) =>
            setMealPlan((prev) => ({
              ...prev,
              dailyNote: value,
            }))
          }
          onStomachPainChange={handleStomachPainChange}
          stomachPainTrackingEnabled={stomachPainTrackingEnabled}
          dailyNoteEnabled={dailyNoteEnabled}
        />
      </div>

      {/* Löschen Bestätigungsdialog */}
      <DeleteConfirmDialog
        isOpen={deleteConfirmDialog.isOpen}
        planDate={deleteConfirmDialog.planDate}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmDialog({ isOpen: false, planDate: "" })}
        isDeleting={isDeleting}
      />

      {/* Zurücksetzen Bestätigungsdialog */}
      <ResetConfirmDialog
        isOpen={resetConfirmDialog.isOpen}
        planDate={resetConfirmDialog.planDate}
        onConfirm={handleReset}
        onCancel={() => setResetConfirmDialog({ isOpen: false, planDate: "" })}
      />
    </div>
  );
};
