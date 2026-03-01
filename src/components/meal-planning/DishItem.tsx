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
  const totalCalories = Math.round((dish.calories || 0) * quantity);

  return (
    <div className="dish-item bg-zinc-100 dark:bg-zinc-800/50 rounded-xl px-3 py-2.5">
      {/* Main row */}
      <div className="flex items-center gap-3">
        {/* Qty Badge */}
        <QuantitySelector value={quantity} onChange={onUpdateQuantity} />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{dish.name}</div>
          <div className="text-xs text-muted-foreground tabular-nums">
            {totalCalories} kcal
            {dish.protein ? ` · ${Math.round((dish.protein || 0) * quantity * 10) / 10}g P` : ""}
          </div>
        </div>

        {/* Remove */}
        <button
          onClick={onRemove}
          className="p-1.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors touch-manipulation"
          aria-label="Gericht entfernen"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Recipe Section */}
      {(dish.recipe || dish.recipeUrl) && (
        <>
          <button
            onClick={onToggleRecipe}
            className="dish-item-recipe-toggle mt-2 w-full text-left text-primary text-xs hover:underline transition-colors touch-manipulation"
          >
            {isRecipeExpanded ? "Rezept ausblenden ↑" : "Rezept anzeigen ↓"}
          </button>
          {isRecipeExpanded && (
            <div className="mt-2 text-xs">
              {dish.recipe && (
                <div className="mb-2 whitespace-pre-wrap text-foreground leading-relaxed">
                  {dish.recipe}
                </div>
              )}
              {dish.recipeUrl && (
                <a
                  href={dish.recipeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dish-item-recipe-link text-primary hover:underline"
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
