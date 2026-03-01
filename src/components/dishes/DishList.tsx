import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  useDishes,
  useDeleteDish,
  useUpdateDishRating,
} from "../../hooks/useDishes";
import { DishFilter } from "./DishFilter";
import { DishCard } from "./DishCard";
import { DeleteDialog } from "../shared/DeleteDialog";
import { useFeatureAccess } from "../../hooks/useFeatureAccess";
import { logger } from "../../utils/logger";

interface FilterValues {
  name: string;
  minCalories: string;
  maxCalories: string;
  minProtein: string;
  maxProtein: string;
  minCarbs: string;
  maxCarbs: string;
  minFat: string;
  maxFat: string;
  category: string;
  minRating: string;
}

export const DishList = () => {
  const navigate = useNavigate();
  const { data: dishes = [], isLoading, error } = useDishes();
  const { mutate: deleteDish } = useDeleteDish();
  const { mutate: updateDishRating } = useUpdateDishRating();
  const featureAccess = useFeatureAccess();

  if (error) {
    logger.error("DishList: error loading dishes:", error);
  }

  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [expandedRecipes, setExpandedRecipes] = useState<Set<string>>(
    new Set()
  );
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    dishId: string;
    dishName: string;
  }>({
    isOpen: false,
    dishId: "",
    dishName: "",
  });

  // Lade gespeicherte Filter aus localStorage oder verwende Standardwerte
  const [filters, setFilters] = useState<FilterValues>(() => {
    const savedFilters = localStorage.getItem("dishFilters");
    return savedFilters
      ? JSON.parse(savedFilters)
      : {
          name: "",
          minCalories: "",
          maxCalories: "",
          minProtein: "",
          maxProtein: "",
          minCarbs: "",
          maxCarbs: "",
          minFat: "",
          maxFat: "",
          category: "",
          minRating: "",
        };
  });

  // Speichere Filter in localStorage wenn sie sich ändern
  useEffect(() => {
    localStorage.setItem("dishFilters", JSON.stringify(filters));
  }, [filters]);

  // Speichere Sortierrichtung in localStorage
  useEffect(() => {
    localStorage.setItem("dishSortDirection", sortDirection);
  }, [sortDirection]);

  // Lade Sortierrichtung aus localStorage beim ersten Laden
  useEffect(() => {
    const savedDirection = localStorage.getItem("dishSortDirection");
    if (savedDirection === "asc" || savedDirection === "desc") {
      setSortDirection(savedDirection);
    }
  }, []);

  // Berechne gefilterte und sortierte Gerichte
  const filteredDishes = useMemo(() => {
    const filtered = dishes.filter((dish) => {
      const nameMatch = dish.name
        .toLowerCase()
        .includes(filters.name.toLowerCase());
      const caloriesMatch =
        (!filters.minCalories ||
          (dish.calories && dish.calories >= parseInt(filters.minCalories))) &&
        (!filters.maxCalories ||
          (dish.calories && dish.calories <= parseInt(filters.maxCalories)));
      const proteinMatch =
        (!filters.minProtein ||
          (dish.protein && dish.protein >= parseInt(filters.minProtein))) &&
        (!filters.maxProtein ||
          (dish.protein && dish.protein <= parseInt(filters.maxProtein)));
      const carbsMatch =
        (!filters.minCarbs ||
          (dish.carbs && dish.carbs >= parseInt(filters.minCarbs))) &&
        (!filters.maxCarbs ||
          (dish.carbs && dish.carbs <= parseInt(filters.maxCarbs)));
      const fatMatch =
        (!filters.minFat ||
          (dish.fat && dish.fat >= parseInt(filters.minFat))) &&
        (!filters.maxFat || (dish.fat && dish.fat <= parseInt(filters.maxFat)));
      const categoryMatch =
        !filters.category ||
        (filters.category === "uncategorized"
          ? !dish.category
          : dish.category === filters.category);
      const ratingMatch =
        !filters.minRating ||
        (dish.rating && dish.rating >= parseInt(filters.minRating));

      return (
        nameMatch &&
        caloriesMatch &&
        proteinMatch &&
        carbsMatch &&
        fatMatch &&
        categoryMatch &&
        ratingMatch
      );
    });

    return filtered;
  }, [dishes, filters, sortDirection]);

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleDelete = async () => {
    if (!deleteDialog.dishId) return;

    try {
      await deleteDish(deleteDialog.dishId);
      setDeleteDialog({ isOpen: false, dishId: "", dishName: "" });
    } catch (err: unknown) {
      if (err instanceof Error) {
        logger.error("Error deleting dish:", err.message);
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

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const handleRatingChange = (dishId: string, newRating: number) => {
    updateDishRating({ id: dishId, rating: newRating });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-destructive text-center py-4">
        Fehler beim Laden der Gerichte
      </div>
    );
  }

  return (
    <>
      <DeleteDialog
        isOpen={deleteDialog.isOpen}
        dishName={deleteDialog.dishName}
        onConfirm={handleDelete}
        onCancel={() =>
          setDeleteDialog({ isOpen: false, dishId: "", dishName: "" })
        }
      />

      <div className="container mx-auto px-4 pb-20 md:pb-4 max-w-lg md:max-w-none">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display font-extrabold text-2xl">Gerichte</h1>
          <div className="flex gap-2">
            <button
              onClick={toggleSortDirection}
              className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800/50 text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
              title={`Sortierung ${sortDirection === "asc" ? "aufsteigend" : "absteigend"}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {sortDirection === "asc" ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                )}
              </svg>
            </button>
            <button
              onClick={() => navigate("/dishes/import")}
              className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800/50 text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
              title="Importieren"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
            {featureAccess.dishIngredientBuilder && (
              <button
                onClick={() => navigate("/dishes/create-with-ingredients")}
                className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors touch-manipulation"
                title="Aus Zutaten erstellen"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </button>
            )}
            <button
              onClick={() => navigate("/dishes/new")}
              className="p-2 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors touch-manipulation"
              title="Neues Gericht"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        <DishFilter filters={filters} onFilterChange={handleFilterChange} />

        {filteredDishes.length === 0 ? (
          <div className="text-muted-foreground text-center py-12">
            Keine Gerichte gefunden.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 auto-rows-min">
            {filteredDishes.map((dish) => (
              <DishCard
                key={dish.id}
                dish={dish}
                onToggleRecipe={() => toggleRecipe(dish.id)}
                onEdit={() => navigate(`/dishes/${dish.id}/edit`)}
                onDelete={() =>
                  setDeleteDialog({
                    isOpen: true,
                    dishId: dish.id,
                    dishName: dish.name,
                  })
                }
                onRatingChange={handleRatingChange}
                isExpanded={expandedRecipes.has(dish.id)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
};
