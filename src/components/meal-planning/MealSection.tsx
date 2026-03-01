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
          className="w-full border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-xl px-4 py-3 bg-transparent text-sm placeholder:text-muted-foreground focus:border-primary focus:border-solid focus:outline-none focus:ring-0 transition-colors"
          value={selectedMeal === sectionKey ? searchTerm : ""}
          onChange={(e) => {
            onSearchTermChange(e.target.value);
          }}
          onFocus={() => onInputFocus(sectionKey)}
          onBlur={onInputBlur}
        />

        {showDishList && selectedMeal === sectionKey && (
          <div className="absolute z-[9999] mt-1 w-full max-h-60 overflow-y-auto rounded-xl border border-border bg-background shadow-glass">
            {filteredDishes.length > 0 ? (
              filteredDishes.map((dish) => (
                <button
                  key={dish.id}
                  className="w-full text-left px-4 py-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dish-list-item transition-colors"
                  onClick={() => {
                    onAddDish(dish);
                  }}
                >
                  <div className="font-medium text-sm">{dish.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {dish.calories} kcal · {dish.protein}g P · {dish.carbs}g KH · {dish.fat}g F
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-2.5 text-sm text-muted-foreground">
                Keine Gerichte gefunden
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
