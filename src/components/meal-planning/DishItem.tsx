import type { Dish } from "../../types";
import { QuantitySelector } from "../QuantitySelector";

interface DishItemProps {
  dish: Dish;
  quantity: number;
  isRecipeExpanded: boolean;
  onUpdateQuantity: (newQuantity: number) => void;
  onRemove: () => void;
  onToggleRecipe: () => void;
}

export const DishItem = ({
  dish,
  quantity,
  isRecipeExpanded,
  onUpdateQuantity,
  onRemove,
  onToggleRecipe,
}: DishItemProps) => {
  return (
    <div className="dish-item bg-muted rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 relative">
      {/* Name and Nutrition - Full Width */}
      <div className="dish-item-content mb-2 sm:mb-0 pr-0 sm:pr-24">
        <div className="dish-item-name font-medium text-base sm:text-base text-foreground mb-1">
          {dish.name}
        </div>
        <div className="dish-item-nutrition text-sm sm:text-sm text-muted-foreground leading-relaxed">
          {Math.round((dish.calories || 0) * quantity)} kcal |{" "}
          {Math.round((dish.protein || 0) * quantity * 10) / 10}g Protein |{" "}
          {Math.round((dish.carbs || 0) * quantity * 10) / 10}g Kohlenhydrate |{" "}
          {Math.round((dish.fat || 0) * quantity * 10) / 10}g Fett
        </div>
      </div>

      {/* Actions Row - Below on mobile, inline on desktop */}
      <div className="dish-item-actions flex items-center justify-between sm:justify-end gap-2 sm:absolute sm:top-2 sm:right-3">
        <div className="flex items-center gap-2">
          <QuantitySelector value={quantity} onChange={onUpdateQuantity} />
          <button
            onClick={onRemove}
            className="dish-item-remove-btn rounded-lg p-2 sm:p-1 text-muted-foreground hover:text-destructive active:text-destructive transition-colors hover:bg-accent active:bg-accent touch-manipulation min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
            aria-label="Gericht entfernen"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Recipe Section - Full Width */}
      {(dish.recipe || dish.recipeUrl) && (
        <>
          <button
            onClick={onToggleRecipe}
            className="dish-item-recipe-toggle -mx-1 sm:-mx-2 mt-2 sm:mt-2 w-full rounded-lg px-2 py-1.5 sm:px-2 sm:py-2 text-left text-primary hover:bg-primary/10 active:bg-primary/10 text-sm sm:text-sm transition-colors touch-manipulation"
          >
            {isRecipeExpanded ? "Rezept ausblenden ↑" : "Rezept anzeigen ↓"}
          </button>
          {isRecipeExpanded && (
            <div className="dish-item-recipe-content mt-2 text-sm sm:text-sm">
              {dish.recipe && (
                <div className="dish-item-recipe-text mb-2 whitespace-pre-wrap text-foreground leading-relaxed">
                  {dish.recipe}
                </div>
              )}
              {dish.recipeUrl && (
                <a
                  href={dish.recipeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dish-item-recipe-link inline-block -mx-1 sm:-m-2 rounded-lg px-2 py-1.5 sm:px-2 sm:py-2 text-primary hover:bg-primary/10 active:bg-primary/10 transition-colors"
                >
                  Zum Online-Rezept →
                </a>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
