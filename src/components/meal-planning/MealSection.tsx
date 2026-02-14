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

  return (
    <div className="card p-3 sm:p-4">
      <h3 className="mb-2 sm:mb-3 text-base sm:text-lg font-medium">{title}</h3>

      <div className="relative mb-2 sm:mb-3">
        <input
          type="text"
          placeholder={`${title} hinzufügen...`}
          className="input"
          value={selectedMeal === sectionKey ? searchTerm : ""}
          onChange={(e) => {
            onSearchTermChange(e.target.value);
          }}
          onFocus={() => onInputFocus(sectionKey)}
          onBlur={onInputBlur}
        />

        {showDishList && selectedMeal === sectionKey && (
          <div className="absolute z-[9999] mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-border bg-background shadow-glass">
            {filteredDishes.length > 0 ? (
              filteredDishes.map((dish) => (
                <button
                  key={dish.id}
                  className="w-full text-left px-4 py-2 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dish-list-item"
                  onClick={() => {
                    onAddDish(dish);
                  }}
                >
                  <div className="font-medium">{dish.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {dish.calories} kcal | {dish.protein}g Protein |{" "}
                    {dish.carbs}g Kohlenhydrate | {dish.fat}g Fett
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-2 text-sm text-muted-foreground">
                Keine Gerichte gefunden
              </div>
            )}
          </div>
        )}
      </div>

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
    </div>
  );
};
