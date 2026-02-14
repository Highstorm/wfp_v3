import { useState } from "react";
import { type Dish } from "../../lib/firestore";
import { StarRating } from "../shared/StarRating";
import { useShareDish } from "../../lib/firestore";
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
        console.log("Gericht erfolgreich geteilt:", data);
      },
      onError: (error) => {
        console.error("Fehler beim Teilen des Gerichts:", error);
        setShareErrorMessage(
          "Fehler beim Erstellen des Teilen-Links. Bitte versuche es später erneut."
        );
      },
    });
  };

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
        className={`card p-3 sm:p-4 transition-all duration-200 hover:shadow-glass ${
          isExpanded ? "row-span-2" : ""
        }`}
        style={{ height: isExpanded ? "auto" : "100%", alignSelf: "start" }}
      >
        <div className="flex justify-between items-start mb-3 sm:mb-4 gap-2">
          <h3
            className="text-base sm:text-lg font-medium flex-1 min-w-0 break-words leading-tight"
            title={dish.name}
          >
            {dish.name}
          </h3>

          <div className="flex space-x-1 sm:space-x-2 flex-shrink-0">
            <button
              onClick={() => setShowShareDialog(true)}
              className="rounded-full p-2 sm:p-2.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors touch-manipulation min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
              title="Gericht teilen"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 sm:w-6 sm:h-6"
              >
                <path
                  fillRule="evenodd"
                  d="M15.75 4.5a3 3 0 11.825 2.066l-8.421 4.679a3.002 3.002 0 010 1.51l8.421 4.679a3 3 0 11-.729 1.31l-8.421-4.678a3 3 0 110-4.132l8.421-4.679a3 3 0 01-.096-.755z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <button
              onClick={onEdit}
              className="rounded-full p-2 sm:p-2.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors touch-manipulation min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
              title="Bearbeiten"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 sm:w-6 sm:h-6"
              >
                <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32l8.4-8.4z" />
                <path d="M5.25 5.25a3 3 0 00-3 3v10.5a3 3 0 003 3h10.5a3 3 0 003-3V13.5a.75.75 0 00-1.5 0v5.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V8.25a1.5 1.5 0 011.5-1.5h5.25a.75.75 0 000-1.5H5.25z" />
              </svg>
            </button>
            <button
              onClick={onDelete}
              className="rounded-full p-2 sm:p-2.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors touch-manipulation min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
              title="Löschen"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 sm:w-6 sm:h-6"
              >
                <path
                  fillRule="evenodd"
                  d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 sm:gap-y-2 text-sm sm:text-sm mb-3 sm:mb-4">
          <div className="text-muted-foreground text-sm sm:text-sm">Kalorien:</div>
          <div className="font-medium text-sm sm:text-sm whitespace-nowrap">{dish.calories || "-"} kcal</div>
          <div className="text-muted-foreground text-sm sm:text-sm">Protein:</div>
          <div className="font-medium text-sm sm:text-sm whitespace-nowrap">{dish.protein || "-"} g</div>
          <div className="text-muted-foreground text-sm sm:text-sm">Kohlenhydrate:</div>
          <div className="font-medium text-sm sm:text-sm whitespace-nowrap">{dish.carbs || "-"} g</div>
          <div className="text-muted-foreground text-sm sm:text-sm">Fett:</div>
          <div className="font-medium text-sm sm:text-sm whitespace-nowrap">{dish.fat || "-"} g</div>
          <div className="text-muted-foreground text-sm sm:text-sm">Kategorie:</div>
          <div className="font-medium text-sm sm:text-sm whitespace-nowrap">
            {dish.category === "breakfast"
              ? "Frühstück"
              : dish.category === "mainDish"
              ? "Mittag/Abendessen"
              : dish.category === "snack"
              ? "Snack/Sonstiges"
              : "-"}
          </div>

          {/* Bewertung anzeigen, falls es sich um ein Mittag/Abendessen handelt */}
          {isRatable && (
            <>
              <div className="text-muted-foreground text-sm sm:text-sm">Bewertung:</div>
              <div className="min-w-0 overflow-hidden flex items-center">
                <div className="flex-shrink-0">
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
              </div>
            </>
          )}
        </div>

        {(dish.recipe || dish.recipeUrl) && (
          <>
            <button
              onClick={onToggleRecipe}
              className="w-full text-left text-primary p-2.5 sm:p-3 rounded-lg hover:bg-accent transition-colors touch-manipulation min-h-[44px] sm:min-h-0 text-sm sm:text-base font-medium"
            >
              {isExpanded ? "Rezept ausblenden ↑" : "Rezept anzeigen ↓"}
            </button>

            {isExpanded && (
              <div className="mt-4 text-sm sm:text-base">
                {dish.recipe && (
                  <div className="whitespace-pre-wrap mb-2">{dish.recipe}</div>
                )}
                {dish.recipeUrl && (
                  <a
                    href={dish.recipeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block p-2 -m-2 rounded-lg text-primary hover:bg-accent transition-colors"
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
