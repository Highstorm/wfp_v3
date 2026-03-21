import type { Dish, MealPlan } from "../../types";
import { DishItem } from "./DishItem";

type MealType = keyof Pick<
  MealPlan,
  "breakfast" | "lunch" | "dinner" | "snacks"
>;

interface MealSectionProps {
  title: string;
  dishes: Dish[];
  searchTerm: string;
  selectedMeal: MealType;
  sectionKey: MealType;
  showDishList: boolean;
  availableDishes: Dish[];
  expandedRecipes: Set<string>;
  onInputFocus: (sectionKey: MealType) => void;
  onInputBlur: (e: React.FocusEvent) => void;
  onSearchTermChange: (value: string) => void;
  onAddDish: (dish: Dish) => void;
  onRemoveDish: (dishId: string) => void;
  onToggleRecipe: (dishId: string) => void;
  onUpdateDishQuantity: (dishId: string, newQuantity: number) => void;
}

export const MealSection = ({
  title,
  dishes,
  searchTerm,
  selectedMeal,
  sectionKey,
  showDishList,
  availableDishes,
  expandedRecipes,
  onInputFocus,
  onInputBlur,
  onSearchTermChange,
  onAddDish,
  onRemoveDish,
  onToggleRecipe,
  onUpdateDishQuantity,
}: MealSectionProps) => {
  const filteredDishes = availableDishes.filter((dish) =>
    dish.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Berechne Gesamt-kcal der Sektion
  const totalCalories = dishes.reduce((sum, dish) => {
    const qty = (dish as { quantity?: number }).quantity ?? 1;
    return sum + Math.round((dish.calories || 0) * qty);
  }, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="font-display font-extrabold text-base">{title}</h3>
        {totalCalories > 0 && (
          <span className="text-sm text-muted-foreground tabular-nums">
            {totalCalories} kcal
          </span>
        )}
      </div>

      {/* Dishes */}
      <div className="space-y-2">
        {dishes.map((dish, index) => {
          const dishWithQuantity = dish as { quantity?: number };
          const quantity = dishWithQuantity.quantity ?? 1;
          return (
            <DishItem
              key={`${dish.id}-${index}`}
              dish={dish}
              quantity={quantity}
              isRecipeExpanded={expandedRecipes.has(dish.id)}
              onUpdateQuantity={(newVal) =>
                onUpdateDishQuantity(dish.id, newVal)
              }
              onRemove={() => onRemoveDish(dish.id)}
              onToggleRecipe={() => onToggleRecipe(dish.id)}
            />
          );
        })}
      </div>

      {/* Add dish - dashed button / search */}
      <div className="relative mt-2">
        <input
          type="text"
          placeholder={`+ ${title} hinzufügen`}
          className={`w-full border-2 rounded-2xl px-4 py-3 bg-transparent text-base placeholder:text-muted-foreground focus:outline-none focus:ring-0 transition-colors ${
            showDishList && selectedMeal === sectionKey
              ? "border-primary border-solid rounded-b-none"
              : "border-dashed border-zinc-300 dark:border-zinc-600"
          }`}
          value={selectedMeal === sectionKey ? searchTerm : ""}
          onChange={(e) => {
            onSearchTermChange(e.target.value);
          }}
          onFocus={() => onInputFocus(sectionKey)}
          onBlur={onInputBlur}
        />

        {showDishList && selectedMeal === sectionKey && (
          <div className="absolute z-40 w-full max-h-60 overflow-y-auto rounded-b-2xl border border-t-0 border-border bg-background shadow-lg">
            {filteredDishes.length > 0 ? (
              filteredDishes.map((dish, i) => (
                <button
                  key={dish.id}
                  className={`w-full text-left px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dish-list-item transition-colors ${i === 0 ? "bg-zinc-100/50 dark:bg-zinc-800/50" : ""}`}
                  onClick={() => {
                    onAddDish(dish);
                  }}
                >
                  <div className="font-display font-semibold text-[15px]">{dish.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {dish.calories} kcal · {dish.protein}g P · {dish.carbs}g KH · {dish.fat}g F
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-muted-foreground">
                Keine Gerichte gefunden
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
