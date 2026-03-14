import { useState } from "react";
import type { Dish } from "../../types";
import { logger } from "../../utils/logger";
import { StarRating } from "../shared/StarRating";
import { useShareDish } from "../../hooks/useSharedDishes";
import { ShareDialog } from "../shared/ShareDialog";

interface DishCardProps {
  dish: Dish;
  onToggleRecipe: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRatingChange?: (id: string, rating: number) => void;
  isExpanded: boolean;
}

export const DishCard = ({
  dish,
  onToggleRecipe,
  onEdit,
  onDelete,
  onRatingChange,
  isExpanded,
}: DishCardProps) => {
  // Prüfe, ob das Gericht bewertbar ist (nur mainDish)
  const isRatable = dish.category === "mainDish";
  const {
    mutate: shareDish,
    data: shareData,
    isPending: isSharing,
  } = useShareDish();
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareErrorMessage, setShareErrorMessage] = useState<string | null>(
    null
  );

  const handleShare = () => {
    setShareErrorMessage(null);
    shareDish(dish.id, {
      onSuccess: (data) => {
        logger.debug("Dish shared successfully:", data);
      },
      onError: (error) => {
        logger.error("Error sharing dish:", error);
        setShareErrorMessage(
          "Fehler beim Erstellen des Teilen-Links. Bitte versuche es später erneut."
        );
      },
    });
  };

  const categoryLabel =
    dish.category === "breakfast"
      ? "Frühstück"
      : dish.category === "mainDish"
      ? "Hauptgericht"
      : dish.category === "snack"
      ? "Snack"
      : null;

  return (
    <>
      <ShareDialog
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        shareCode={shareData?.shareCode || ""}
        isSharing={true}
        onShare={handleShare}
        isLoading={isSharing}
        errorMessage={shareErrorMessage || undefined}
      />
      <div
        className={`bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl p-4 transition-all duration-200 hover:bg-zinc-200/70 dark:hover:bg-zinc-800/70 ${
          isExpanded ? "row-span-2" : ""
        }`}
        style={{ alignSelf: "start" }}
      >
        {/* Header: Name + Actions */}
        <div className="flex justify-between items-start gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-base leading-tight break-words" title={dish.name}>
              {dish.name}
            </h3>
            {categoryLabel && (
              <span className="text-xs text-muted-foreground">{categoryLabel}</span>
            )}
          </div>

          <div className="flex gap-1 shrink-0">
            <button
              onClick={() => setShowShareDialog(true)}
              className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors touch-manipulation"
              title="Teilen"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M13 4.5a2.5 2.5 0 11.702 1.737L6.97 9.604a2.518 2.518 0 010 .792l6.733 3.367a2.5 2.5 0 11-.671 1.341l-6.733-3.367a2.5 2.5 0 110-3.474l6.733-3.367A2.52 2.52 0 0113 4.5z" />
              </svg>
            </button>
            <button
              onClick={onEdit}
              className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors touch-manipulation"
              title="Bearbeiten"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
              </svg>
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors touch-manipulation"
              title="Löschen"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Star Rating */}
        {isRatable && (
          <div className="mb-3">
            <StarRating
              rating={dish.rating || 0}
              onChange={(newRating) => {
                if (onRatingChange) {
                  onRatingChange(dish.id, newRating);
                }
              }}
              readOnly={!onRatingChange}
              size="sm"
            />
          </div>
        )}

        {/* Nutrition row */}
        <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
          <span><span className="font-semibold text-foreground">{dish.calories || 0}</span> kcal</span>
          <span><span className="font-semibold text-protein">{dish.protein || 0}</span>g P</span>
          <span><span className="font-semibold text-carbs">{dish.carbs || 0}</span>g KH</span>
          <span><span className="font-semibold text-fat">{dish.fat || 0}</span>g F</span>
        </div>

        {/* Recipe */}
        {(dish.recipe || dish.recipeUrl) && (
          <>
            <button
              onClick={onToggleRecipe}
              className="mt-3 w-full text-left text-primary text-xs font-medium hover:underline transition-colors touch-manipulation"
            >
              {isExpanded ? "Rezept ausblenden ↑" : "Rezept anzeigen ↓"}
            </button>

            {isExpanded && (
              <div className="mt-2 text-sm">
                {dish.recipe && (
                  <div className="whitespace-pre-wrap mb-2 text-foreground leading-relaxed">{dish.recipe}</div>
                )}
                {dish.recipeUrl && (
                  <a
                    href={dish.recipeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-xs"
                  >
                    Zum Online-Rezept →
                  </a>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};
