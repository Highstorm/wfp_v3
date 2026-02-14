import { useState, useEffect, useMemo, type FocusEvent, type FormEvent } from "react";
import { type Dish, type TemporaryMeal } from "../../lib/firestore";
import { QuantitySelector } from "../QuantitySelector";
import {
  searchNutritionWithAI,
  isGeminiAvailable,
  analyzeNutritionLabelWithAI,
} from "../../services/gemini.service";
import { SearchableProduct, debounce } from "../../services/openfoodfacts.service";
import { auth } from "../../lib/firebase";

interface SnacksAndExtrasSectionProps {
  dishes: Dish[];
  temporaryMeals: TemporaryMeal[];
  searchTerm: string;
  showDishList: boolean;
  availableDishes: Dish[];
  expandedRecipes: Set<string>;
  onInputFocus: () => void;
  onInputBlur: (e: FocusEvent) => void;
  onSearchTermChange: (value: string) => void;
  onAddDish: (dish: Dish) => void;
  onRemoveDish: (dishId: string) => void;
  onToggleRecipe: (dishId: string) => void;
  onAddTemporaryMeal: (meal: TemporaryMeal) => void;
  onRemoveTemporaryMeal: (index: number) => void;
  onUpdateDishQuantity: (dishId: string, newQuantity: number) => void;
}

export const SnacksAndExtrasSection = ({
  dishes,
  temporaryMeals,
  searchTerm,
  showDishList,
  availableDishes,
  expandedRecipes,
  onInputFocus,
  onInputBlur,
  onSearchTermChange,
  onAddDish,
  onRemoveDish,
  onToggleRecipe,
  onAddTemporaryMeal,
  onRemoveTemporaryMeal,
  onUpdateDishQuantity,
}: SnacksAndExtrasSectionProps) => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [description, setDescription] = useState<string>("");
  const [calories, setCalories] = useState<string>("");
  const [protein, setProtein] = useState<string>("");
  const [carbs, setCarbs] = useState<string>("");
  const [fat, setFat] = useState<string>("");
  const [aiSearchResult, setAiSearchResult] =
    useState<SearchableProduct | null>(null);
  const [isAISearching, setIsAISearching] = useState(false);
  const [hasGeminiAPIKey, setHasGeminiAPIKey] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value
    e.target.value = "";

    setIsAnalyzingImage(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64String = event.target?.result as string;
        const base64Content = base64String.split(",")[1];
        const mimeType = file.type;

        const result = await analyzeNutritionLabelWithAI(
          base64Content,
          mimeType
        );

        if (result) {
          if (result.name && result.name !== "Unbekanntes Produkt") {
            setDescription(result.name);
          }
          setCalories(Math.round(result.caloriesPerUnit).toString());
          setProtein(Math.round(result.proteinPerUnit).toString());
          setCarbs(Math.round(result.carbsPerUnit).toString());
          setFat(Math.round(result.fatPerUnit).toString());
        } else {
          // Optional: Error Toast handling here if we had access to toast
          console.warn("Keine Nährwerte erkannt");
        }
        setIsAnalyzingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Fehler beim Bild-Upload:", error);
      setIsAnalyzingImage(false);
    }
  };

  // Prüfe Gemini-Verfügbarkeit beim Mount
  useEffect(() => {
    isGeminiAvailable().then(setHasGeminiAPIKey);
  }, []);

  // Prüfe ob KI-Suche getriggert werden kann
  const canTriggerAI = useMemo(() => {
    return (
      searchTerm.length >= 3 &&
      (searchTerm.includes(" ") || searchTerm.length >= 5)
    );
  }, [searchTerm]);

  // Debounced AI search function
  const debouncedAISearch = useMemo(
    () =>
      debounce(async (query: string) => {
        if (!canTriggerAI || !hasGeminiAPIKey) {
          setAiSearchResult(null);
          return;
        }

        setIsAISearching(true);

        try {
          const result = await searchNutritionWithAI(query);
          if (result) {
            setAiSearchResult(result);
          } else {
            setAiSearchResult(null);
          }
        } catch (error) {
          console.error("Fehler bei der KI-Suche:", error);
          setAiSearchResult(null);
        } finally {
          setIsAISearching(false);
        }
      }, 500),
    [canTriggerAI, hasGeminiAPIKey]
  );

  // Trigger AI search when query changes
  useEffect(() => {
    if (canTriggerAI && hasGeminiAPIKey) {
      debouncedAISearch(searchTerm);
    } else {
      setAiSearchResult(null);
    }
  }, [searchTerm, debouncedAISearch, canTriggerAI, hasGeminiAPIKey]);

  // Close dropdown and reset AI result when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement;
      // Prüfe ob das Klick/Touch-Event außerhalb des Suchfelds/Dropdowns ist
      const searchContainer = target.closest(".snacks-search-container");
      if (!searchContainer) {
        // Verzögere das Schließen auf iOS etwas, um Touch-Events zu ermöglichen
        setTimeout(() => {
          setAiSearchResult(null);
          setIsAISearching(false);
        }, 100);
      }
    };

    // Unterstütze sowohl Mouse- als auch Touch-Events
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  // Reset AI result when showDishList becomes false
  useEffect(() => {
    if (!showDishList) {
      setAiSearchResult(null);
      setIsAISearching(false);
    }
  }, [showDishList]);

  // Konvertiert ein SearchableProduct zu einem Dish
  const convertProductToDish = (product: SearchableProduct): Dish => {
    // Berechne die Nährwerte basierend auf der nutritionUnit
    // Standard: 100g/100ml/1 Stück
    const multiplier = 1; // Da die Nährwerte bereits für die angegebene Einheit sind

    return {
      id: product.barcode,
      name: product.name,
      calories: Math.round(product.caloriesPerUnit * multiplier),
      protein: Math.round(product.proteinPerUnit * multiplier),
      carbs: Math.round(product.carbsPerUnit * multiplier),
      fat: Math.round(product.fatPerUnit * multiplier),
      createdBy: auth.currentUser?.uid || "",
      category: "snack",
    };
  };

  const handleAddAIDish = (product: SearchableProduct) => {
    const dish = convertProductToDish(product);
    onAddDish(dish);
    setAiSearchResult(null);
  };

  const handleAISearch = async () => {
    if (!canTriggerAI || !hasGeminiAPIKey || isAISearching) {
      return;
    }

    setIsAISearching(true);

    try {
      const result = await searchNutritionWithAI(searchTerm);
      if (result) {
        setAiSearchResult(result);
      }
    } catch (error) {
      console.error("Fehler bei der KI-Suche:", error);
    } finally {
      setIsAISearching(false);
    }
  };

  const filteredDishes = availableDishes.filter((dish) =>
    dish.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!description || !calories || parseInt(calories) <= 0) return;

    onAddTemporaryMeal({
      description: description.trim(),
      calories: parseInt(calories),
      protein: parseInt(protein) || 0,
      carbs: parseInt(carbs) || 0,
      fat: parseInt(fat) || 0,
    });

    setDescription("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
  };

  return (
    <div className="card p-3 sm:p-4">
      <div className="flex justify-between items-center mb-2 sm:mb-3 gap-2">
        <h3 className="text-base sm:text-lg font-medium">Snacks & Zusätzliches</h3>
        <button
          onClick={() => setIsFormVisible(!isFormVisible)}
          className="rounded-lg px-2 py-1.5 sm:px-2 sm:py-2 text-xs sm:text-sm text-primary hover:bg-accent active:bg-accent touch-manipulation flex-shrink-0"
        >
          {isFormVisible
            ? "Ausblenden ↑"
            : "Eigene Mahlzeit ↓"}
        </button>
      </div>

      <div className="space-y-2 sm:space-y-3">
        {/* Snacks Suchfeld */}
        <div className="relative snacks-search-container">
          <div className="relative">
            {hasGeminiAPIKey && (
              <button
                type="button"
                onClick={handleAISearch}
                disabled={!canTriggerAI || isAISearching}
                className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 p-2.5 sm:p-2 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center text-primary hover:text-primary/80 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all touch-manipulation"
                aria-label="KI-Suche"
                title="Mit KI nach Nährwerten suchen"
              >
                {isAISearching ? (
                  <svg
                    className="animate-spin h-5 w-5 sm:h-5 sm:w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-5 h-5 sm:w-5 sm:h-5 flex-shrink-0"
                  >
                    <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.66L18.75 10l-.491 1.34a2.25 2.25 0 01-1.545 1.545L15.25 13.5l-1.34-.491a2.25 2.25 0 01-1.545-1.545L12 11.25l.491-1.34a2.25 2.25 0 011.545-1.545L15.25 8.5l1.34.491a2.25 2.25 0 011.545 1.545zM16.894 20.405L17.25 21.5l-.356-1.095a2.25 2.25 0 00-1.545-1.545L14.25 18.5l-1.095-.356a2.25 2.25 0 00-1.545-1.545L11.25 16.5l.356-1.095a2.25 2.25 0 001.545-1.545L14.25 13.5l1.095.356a2.25 2.25 0 001.545 1.545L18.25 15.5l-.356 1.095a2.25 2.25 0 00-1.545 1.545L16.25 18.5l-1.095.356a2.25 2.25 0 00-1.545 1.545z" />
                  </svg>
                )}
              </button>
            )}
            <input
              type="text"
              placeholder="Snack aus der Datenbank hinzufügen..."
              className={`input w-full text-base sm:text-sm py-2.5 sm:py-2 ${hasGeminiAPIKey ? "pl-12 sm:pl-11" : ""}`}
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              onFocus={onInputFocus}
              onBlur={onInputBlur}
            />
          </div>

          {(showDishList || aiSearchResult || isAISearching) && (
            <div
              className="absolute z-[9998] mt-1 w-full max-h-[60vh] sm:max-h-60 overflow-y-auto rounded-lg border border-border bg-background shadow-glass"
              style={{
                WebkitOverflowScrolling: "touch",
              }}
              onMouseDown={(e) => {
                // Verhindere blur auf dem Input nur bei Mouse-Events
                e.preventDefault();
              }}
              onTouchStart={(e) => {
                // Auf iOS: Stoppe Propagation, aber verhindere nicht das Standard-Verhalten
                e.stopPropagation();
              }}
            >
              {/* KI-Ergebnis als erstes Element */}
              {isAISearching && !aiSearchResult && (
                <div className="px-3 sm:px-4 py-2.5 sm:py-3 text-center text-muted-foreground text-sm">
                  Suche...
                </div>
              )}
              {aiSearchResult && (
                <button
                  key={aiSearchResult.barcode}
                  className="dish-list-item w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left active:bg-accent hover:bg-accent bg-primary/5 border-b border-primary/20 touch-manipulation"
                  onClick={() => handleAddAIDish(aiSearchResult)}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-4 h-4 text-primary flex-shrink-0"
                    >
                      <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.66L18.75 10l-.491 1.34a2.25 2.25 0 01-1.545 1.545L15.25 13.5l-1.34-.491a2.25 2.25 0 01-1.545-1.545L12 11.25l.491-1.34a2.25 2.25 0 011.545-1.545L15.25 8.5l1.34.491a2.25 2.25 0 011.545 1.545zM16.894 20.405L17.25 21.5l-.356-1.095a2.25 2.25 0 00-1.545-1.545L14.25 18.5l-1.095-.356a2.25 2.25 0 00-1.545-1.545L11.25 16.5l.356-1.095a2.25 2.25 0 001.545-1.545L14.25 13.5l1.095.356a2.25 2.25 0 001.545 1.545L18.25 15.5l-.356 1.095a2.25 2.25 0 00-1.545 1.545L16.25 18.5l-1.095.356a2.25 2.25 0 00-1.545 1.545z" />
                    </svg>
                    <span className="font-medium text-sm sm:text-sm break-words">
                      {aiSearchResult.name}
                    </span>
                    <span className="px-1.5 sm:px-2 py-0.5 text-xs bg-primary/20 text-primary rounded font-medium flex-shrink-0">
                      KI
                    </span>
                  </div>
                  <div className="text-xs sm:text-xs text-muted-foreground mt-1 break-words">
                    {aiSearchResult.nutritionUnit}:{" "}
                    {Math.round(aiSearchResult.caloriesPerUnit)} kcal,{" "}
                    {Math.round(aiSearchResult.proteinPerUnit)}g Protein,{" "}
                    {Math.round(aiSearchResult.carbsPerUnit)}g Carbs,{" "}
                    {Math.round(aiSearchResult.fatPerUnit)}g Fett
                  </div>
                </button>
              )}
              {/* Normale Gerichte */}
              {filteredDishes.length > 0 ? (
                filteredDishes.map((dish) => (
                  <button
                    key={dish.id}
                    className="dish-list-item w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left active:bg-accent hover:bg-accent touch-manipulation"
                    onClick={() => onAddDish(dish)}
                  >
                    <div className="font-medium text-sm sm:text-sm">{dish.name}</div>
                    <div className="text-xs sm:text-xs text-muted-foreground mt-0.5">
                      {dish.calories} kcal | {dish.protein}g Protein |{" "}
                      {dish.carbs}g Kohlenhydrate | {dish.fat}g Fett
                    </div>
                  </button>
                ))
              ) : (
                !aiSearchResult && (
                  <div className="px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-muted-foreground">
                    Keine Gerichte gefunden
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Formular für eigene Mahlzeiten */}
        {isFormVisible && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {hasGeminiAPIKey && (
              <div className="mb-4">
                <label className="btn-secondary w-full sm:w-auto cursor-pointer flex items-center justify-center gap-2 text-sm py-2">
                  {isAnalyzingImage ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Analysiere...
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
                        />
                      </svg>
                      Foto scannen
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageUpload}
                    disabled={isAnalyzingImage}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Beschreibung
                </label>
                <input
                  type="text"
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input"
                  placeholder="z.B. Protein Shake nach dem Training"
                />
              </div>
              <div>
                <label
                  htmlFor="calories"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Kalorien
                </label>
                <input
                  type="number"
                  id="calories"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  min="0"
                  className="input"
                  placeholder="z.B. 300"
                />
              </div>
              <div>
                <label
                  htmlFor="protein"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Protein (g)
                </label>
                <input
                  type="number"
                  id="protein"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  min="0"
                  className="input"
                  placeholder="z.B. 25"
                />
              </div>
              <div>
                <label
                  htmlFor="carbs"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Kohlenhydrate (g)
                </label>
                <input
                  type="number"
                  id="carbs"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  min="0"
                  className="input"
                  placeholder="z.B. 30"
                />
              </div>
              <div>
                <label
                  htmlFor="fat"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Fett (g)
                </label>
                <input
                  type="number"
                  id="fat"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  min="0"
                  className="input"
                  placeholder="z.B. 5"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={!description || !calories || parseInt(calories) <= 0}
              className="btn-primary mt-4 w-full sm:w-auto"
            >
              Hinzufügen
            </button>
          </form>
        )}

        {/* Liste der hinzugefügten Snacks und Mahlzeiten */}
        <div className="space-y-2 sm:space-y-2">
          {/* Gespeicherte Snacks */}
          {dishes.map((dish, index) => {
            const dishWithQuantity = dish as { quantity?: number };
            const quantity = dishWithQuantity.quantity ?? 1;
            return (
              <div
                key={`${dish.id}-${index}`}
                className="bg-gray-50 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 relative"
              >
                {/* Name and Nutrition - Full Width */}
                <div className="mb-2 sm:mb-0 pr-0 sm:pr-24">
                  <div className="font-medium text-base sm:text-base text-gray-900 mb-1">
                    {dish.name}
                  </div>
                  <div className="text-sm sm:text-sm text-gray-600 leading-relaxed">
                    {(dish.calories ?? 0) * quantity} kcal |{" "}
                    {(dish.protein ?? 0) * quantity}g Protein |{" "}
                    {(dish.carbs ?? 0) * quantity}g Kohlenhydrate |{" "}
                    {(dish.fat ?? 0) * quantity}g Fett
                  </div>
                </div>

                {/* Actions Row - Below on mobile, inline on desktop */}
                <div className="flex items-center justify-between sm:absolute sm:top-2 sm:right-3 gap-2">
                  <div className="flex items-center gap-2">
                    <QuantitySelector
                      value={quantity}
                      onChange={(newVal) => onUpdateDishQuantity(dish.id, newVal)}
                    />
                    <button
                      onClick={() => onRemoveDish(dish.id)}
                      className="text-gray-400 hover:text-red-600 active:text-red-600 p-2 sm:p-1 rounded-lg hover:bg-gray-100 active:bg-gray-100 transition-colors touch-manipulation min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
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

                {/* Recipe Section */}
                {(dish.recipe || dish.recipeUrl) && (
                  <>
                    <button
                      onClick={() => onToggleRecipe(dish.id)}
                      className="w-full text-left text-primary hover:text-primary/80 focus:outline-none -mx-1 sm:-mx-2 mt-2 sm:mt-2 rounded-lg px-2 py-1.5 sm:px-2 sm:py-2 hover:bg-primary/10 active:bg-primary/10 transition-colors text-sm sm:text-sm touch-manipulation"
                    >
                      {expandedRecipes.has(dish.id)
                        ? "Rezept ausblenden ↑"
                        : "Rezept anzeigen ↓"}
                    </button>
                    {expandedRecipes.has(dish.id) && (
                      <div className="mt-2 text-sm sm:text-sm">
                        {dish.recipe && (
                          <div className="whitespace-pre-wrap text-gray-700 mb-2 leading-relaxed">
                            {dish.recipe}
                          </div>
                        )}
                        {dish.recipeUrl && (
                          <a
                            href={dish.recipeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80 inline-block -mx-1 sm:-m-2 rounded-lg px-2 py-1.5 sm:px-2 sm:py-2 hover:bg-primary/10 active:bg-primary/10 transition-colors"
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
          })}

          {/* Temporäre Mahlzeiten */}
          {temporaryMeals.map((meal, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 relative"
            >
              <div className="mb-2 sm:mb-0 pr-0 sm:pr-16">
                <div className="font-medium text-base sm:text-base text-gray-900 mb-1">
                  {meal.description}
                </div>
                <div className="text-sm sm:text-sm text-gray-600 leading-relaxed">
                  {meal.calories} kcal | {meal.protein}g Protein | {meal.carbs}g
                  Kohlenhydrate | {meal.fat}g Fett
                </div>
              </div>
              <div className="flex items-center justify-end sm:absolute sm:top-2 sm:right-3">
                <button
                  onClick={() => onRemoveTemporaryMeal(index)}
                  className="text-gray-400 hover:text-red-600 active:text-red-600 p-2 sm:p-1 rounded-lg hover:bg-gray-100 active:bg-gray-100 transition-colors touch-manipulation min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
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
          ))}
        </div>
      </div>
    </div>
  );
};
