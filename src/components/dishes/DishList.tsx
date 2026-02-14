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

      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6">
          <h1 className="hidden sm:block text-xl sm:text-2xl font-bold mb-3 sm:mb-0">
            Meine Gerichte
          </h1>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
            <button
              onClick={toggleSortDirection}
              className="btn-secondary flex items-center justify-center gap-2 text-sm sm:text-base py-2.5 sm:py-2 min-h-[44px] sm:min-h-0"
            >
              Sortierung {sortDirection === "asc" ? "↓" : "↑"}
            </button>
            <button
              onClick={() => navigate("/dishes/import")}
              className="btn-secondary inline-flex items-center justify-center text-sm sm:text-base py-2.5 sm:py-2 min-h-[44px] sm:min-h-0"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5 mr-2"
              >
                <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
              </svg>
              Gericht importieren
            </button>
            {featureAccess.dishIngredientBuilder && (
              <button
                onClick={() => navigate("/dishes/create-with-ingredients")}
                className="btn-primary inline-flex items-center justify-center gap-2 shadow-md text-sm sm:text-base py-2.5 sm:py-2 min-h-[44px] sm:min-h-0"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5 flex-shrink-0"
                >
                  <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.66L18.75 10l-.491 1.34a2.25 2.25 0 01-1.545 1.545L15.25 13.5l-1.34-.491a2.25 2.25 0 01-1.545-1.545L12 11.25l.491-1.34a2.25 2.25 0 011.545-1.545L15.25 8.5l1.34.491a2.25 2.25 0 011.545 1.545zM16.894 20.405L17.25 21.5l-.356-1.095a2.25 2.25 0 00-1.545-1.545L14.25 18.5l-1.095-.356a2.25 2.25 0 00-1.545-1.545L11.25 16.5l.356-1.095a2.25 2.25 0 001.545-1.545L14.25 13.5l1.095.356a2.25 2.25 0 001.545 1.545L18.25 15.5l-.356 1.095a2.25 2.25 0 00-1.545 1.545L16.25 18.5l-1.095.356a2.25 2.25 0 00-1.545 1.545z" />
                </svg>
                <span className="hidden sm:inline">Gericht aus Zutaten</span>
                <span className="sm:hidden">Aus Zutaten</span>
                <span className="px-2 py-0.5 text-xs bg-white/20 text-white rounded font-medium border border-white/30">
                  KI
                </span>
              </button>
            )}
            <button
              onClick={() => navigate("/dishes/new")}
              className="btn-primary inline-flex items-center justify-center text-sm sm:text-base py-2.5 sm:py-2 min-h-[44px] sm:min-h-0"
            >
              Neues Gericht
            </button>
          </div>
        </div>

        <DishFilter filters={filters} onFilterChange={handleFilterChange} />

        {filteredDishes.length === 0 ? (
          <div className="text-muted-foreground text-center py-8">
            Keine Gerichte gefunden.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 auto-rows-min py-3 sm:py-4">
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
