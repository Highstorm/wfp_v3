import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCreateDish } from "../../hooks/useDishes";
import type { DishIngredient } from "../../types";
import { calculateIngredientNutrition } from "../../utils/nutrition.utils";
import {
  productToIngredient,
  debounce,
  SearchableProduct,
} from "../../services/openfoodfacts.service";
import { searchNutritionWithAI, isGeminiAvailable } from "../../services/gemini.service";
import { useToast } from "../../lib/toast";
import { logger } from "../../utils/logger";

export const CreateDishWithIngredients = () => {
  const navigate = useNavigate();
  const { mutateAsync: createDish } = useCreateDish();
  const { showToast } = useToast();

  const [dishName, setDishName] = useState("");
  const [category, setCategory] = useState<
    "breakfast" | "mainDish" | "snack" | undefined
  >(undefined);
  const [recipe, setRecipe] = useState("");
  const [ingredients, setIngredients] = useState<DishIngredient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [aiSearchResult, setAiSearchResult] =
    useState<SearchableProduct | null>(null);
  const [isAISearching, setIsAISearching] = useState(false);
  const [hasGeminiAPIKey, setHasGeminiAPIKey] = useState(false);

  // Prüfe ob KI-Suche getriggert werden kann
  const canTriggerAI = useMemo(() => {
    return (
      searchQuery.length >= 3 &&
      (searchQuery.includes(" ") || searchQuery.length >= 5)
    );
  }, [searchQuery]);

  // Prüfe Gemini-Verfügbarkeit beim Mount
  useEffect(() => {
    isGeminiAvailable().then(setHasGeminiAPIKey);
  }, []);

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
            setShowDropdown(true);
          } else {
            setAiSearchResult(null);
          }
        } catch (error) {
          logger.error("AI search error:", error);
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
      debouncedAISearch(searchQuery);
    } else {
      setAiSearchResult(null);
      setShowDropdown(false);
    }
  }, [searchQuery, debouncedAISearch, canTriggerAI, hasGeminiAPIKey]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement;
      // Prüfe ob das Klick/Touch-Event außerhalb des search-container ist
      // Auf iOS: Warte kurz, damit Touch-Events vollständig verarbeitet werden können
      const searchContainer = target.closest(".search-container");
      if (!searchContainer) {
        // Verzögere das Schließen auf iOS etwas, um Touch-Events zu ermöglichen
        setTimeout(() => {
          setShowDropdown(false);
        }, 100);
      }
    };

    // Unterstütze sowohl Mouse- als auch Touch-Events
    // Verwende eine passive Option für bessere Performance auf iOS
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, {
      passive: true,
    });

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleAddIngredient = (product: SearchableProduct) => {
    const defaultQuantity = product.nutritionUnit === "1 Stück" ? 1 : 100;
    const newIngredient = productToIngredient(product, defaultQuantity);
    setIngredients([...ingredients, newIngredient]);
    setSearchQuery("");
    setShowDropdown(false);
    setAiSearchResult(null);
  };

  const handleAISearch = async () => {
    if (!canTriggerAI || !hasGeminiAPIKey || isAISearching) {
      return;
    }

    setIsAISearching(true);
    setShowDropdown(true);

    try {
      const result = await searchNutritionWithAI(searchQuery);
      if (result) {
        setAiSearchResult(result);
      }
    } catch (error) {
      console.error("Fehler bei der KI-Suche:", error);
    } finally {
      setIsAISearching(false);
    }
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const updatedIngredients = [...ingredients];
    updatedIngredients[index] = {
      ...updatedIngredients[index],
      quantity: Math.max(0, quantity),
    };
    setIngredients(updatedIngredients);
  };

  // Berechne Gesamtnährwerte
  const totalNutrition = useMemo(
    () => calculateIngredientNutrition(ingredients),
    [ingredients]
  );

  const canSave =
    dishName.trim() !== "" && ingredients.length > 0 && category !== undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSave) {
      return;
    }

    try {
      await createDish({
        name: dishName.trim(),
        category,
        calories: Math.round(totalNutrition.calories * 10) / 10,
        protein: Math.round(totalNutrition.protein * 10) / 10,
        carbs: Math.round(totalNutrition.carbs * 10) / 10,
        fat: Math.round(totalNutrition.fat * 10) / 10,
        recipe: recipe.trim() || undefined,
        ingredients,
        isIngredientBased: true,
        quantity: 1,
      });

      showToast({
        message: "Gericht erfolgreich erstellt!",
        type: "success",
      });

      setTimeout(() => {
        navigate("/dishes");
      }, 500);
    } catch (error) {
      logger.error("Error saving dish:", error);
      showToast({
        message: "Fehler beim Speichern des Gerichts.",
        type: "error",
      });
    }
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-20 md:pb-6">
      <div className="card p-4 sm:p-6 md:p-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-center text-2xl sm:text-3xl font-semibold tracking-tight">
            Gericht aus Zutaten erstellen
          </h1>
          <p className="text-center text-muted-foreground mt-2 text-sm sm:text-base">
            Suche nach Nahrungsmitteln und erstelle ein Gericht mit automatisch
            berechneten Nährwerten
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Suchfeld */}
          <div className="search-container relative">
            <label htmlFor="search" className="block text-sm font-medium mb-2">
              Nahrungsmittel suchen
            </label>
            <div className="relative">
              {hasGeminiAPIKey && (
                <button
                  type="button"
                  onClick={handleAISearch}
                  disabled={!canTriggerAI || isAISearching}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2.5 sm:p-2 text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation flex items-center justify-center"
                  aria-label="KI-Suche"
                  title="Mit KI nach Nährwerten suchen"
                >
                  {isAISearching ? (
                    <svg
                      className="animate-spin h-5 w-5"
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
                      className="w-5 h-5 flex-shrink-0"
                    >
                      <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.66L18.75 10l-.491 1.34a2.25 2.25 0 01-1.545 1.545L15.25 13.5l-1.34-.491a2.25 2.25 0 01-1.545-1.545L12 11.25l.491-1.34a2.25 2.25 0 011.545-1.545L15.25 8.5l1.34.491a2.25 2.25 0 011.545 1.545zM16.894 20.405L17.25 21.5l-.356-1.095a2.25 2.25 0 00-1.545-1.545L14.25 18.5l-1.095-.356a2.25 2.25 0 00-1.545-1.545L11.25 16.5l.356-1.095a2.25 2.25 0 001.545-1.545L14.25 13.5l1.095.356a2.25 2.25 0 001.545 1.545L18.25 15.5l-.356 1.095a2.25 2.25 0 00-1.545 1.545L16.25 18.5l-1.095.356a2.25 2.25 0 00-1.545 1.545z" />
                    </svg>
                  )}
                </button>
              )}
              <input
                id="search"
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  // Öffne Dropdown wenn der Nutzer tippt
                  if (e.target.value.length > 0) {
                    setShowDropdown(true);
                  }
                }}
                onFocus={() => {
                  // Öffne Dropdown wenn es Ergebnisse gibt oder während der Suche
                  if (
                    aiSearchResult ||
                    isAISearching ||
                    searchQuery.length > 0
                  ) {
                    setShowDropdown(true);
                  }
                }}
                onBlur={() => {
                  // Verhindere das Schließen wenn der Nutzer auf das Dropdown klickt/tippt
                  // Warte länger auf iOS, damit Touch-Events ausgeführt werden können
                  setTimeout(() => {
                    const activeElement = document.activeElement;
                    if (
                      !activeElement ||
                      !activeElement.closest(".search-container")
                    ) {
                      setShowDropdown(false);
                    }
                  }, 300);
                }}
                className={`input w-full ${
                  hasGeminiAPIKey ? "pl-11 sm:pl-10" : ""
                } text-base`}
                placeholder="z.B. Banane, Milch, Brot..."
              />
            </div>

            {/* Dropdown mit Suchergebnissen */}
            {showDropdown &&
              (aiSearchResult ||
                isAISearching) && (
                <div
                  className="absolute z-[100] w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-60 sm:max-h-60 overflow-y-auto"
                  style={{
                    WebkitOverflowScrolling: "touch", // Smooth scrolling auf iOS
                    position: "absolute", // Explizit für iOS
                    top: "100%", // Direkt unter dem Input
                    left: 0,
                    right: 0,
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
                  {isAISearching ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      Suche...
                    </div>
                  ) : !aiSearchResult ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      Keine Nahrungsmittel gefunden
                    </div>
                  ) : (
                    <>
                      {/* KI-Ergebnis anzeigen */}
                      {aiSearchResult && (
                        <button
                          key={aiSearchResult.barcode}
                          type="button"
                          onClick={() => handleAddIngredient(aiSearchResult)}
                          className="w-full text-left p-3 sm:p-3 hover:bg-muted active:bg-muted transition-colors border-b border-border bg-primary/5 border-primary/20 touch-manipulation min-h-[60px] sm:min-h-0"
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="w-4 h-4 text-primary flex-shrink-0"
                            >
                              <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.66L18.75 10l-.491 1.34a2.25 2.25 0 01-1.545 1.545L15.25 13.5l-1.34-.491a2.25 2.25 0 01-1.545-1.545L12 11.25l.491-1.34a2.25 2.25 0 011.545-1.545L15.25 8.5l1.34.491a2.25 2.25 0 011.545 1.545zM16.894 20.405L17.25 21.5l-.356-1.095a2.25 2.25 0 00-1.545-1.545L14.25 18.5l-1.095-.356a2.25 2.25 0 00-1.545-1.545L11.25 16.5l.356-1.095a2.25 2.25 0 001.545-1.545L14.25 13.5l1.095.356a2.25 2.25 0 001.545 1.545L18.25 15.5l-.356 1.095a2.25 2.25 0 00-1.545 1.545L16.25 18.5l-1.095.356a2.25 2.25 0 00-1.545 1.545z" />
                            </svg>
                            <span className="font-medium text-sm sm:text-base break-words">
                              {aiSearchResult.name}
                            </span>
                            <span className="px-2 py-0.5 text-xs bg-primary/20 text-primary rounded font-medium flex-shrink-0">
                              KI
                            </span>
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">
                            {aiSearchResult.nutritionUnit}:{" "}
                            {Math.round(aiSearchResult.caloriesPerUnit)} kcal,{" "}
                            {Math.round(aiSearchResult.proteinPerUnit)}g
                            Protein, {Math.round(aiSearchResult.carbsPerUnit)}g
                            Carbs, {Math.round(aiSearchResult.fatPerUnit)}g Fett
                          </div>
                          {aiSearchResult.sourceName && (
                            <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                              <span>Quelle:</span>
                              {aiSearchResult.sourceUrl ? (
                                <a
                                  href={aiSearchResult.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-primary hover:underline flex items-center gap-1"
                                >
                                  {aiSearchResult.sourceName}
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    className="w-3 h-3"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z"
                                      clipRule="evenodd"
                                    />
                                    <path
                                      fillRule="evenodd"
                                      d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </a>
                              ) : (
                                <span>{aiSearchResult.sourceName}</span>
                              )}
                            </div>
                          )}
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
          </div>

          {/* Zutatenliste */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Zutaten ({ingredients.length})
            </label>
            {ingredients.length === 0 ? (
              <div className="text-muted-foreground text-center py-8 border border-dashed border-border rounded-lg">
                Noch keine Zutaten hinzugefügt
              </div>
            ) : (
              <div className="space-y-2">
                {ingredients.map((ingredient, index) => {
                  const nutritionUnitValue =
                    parseFloat(
                      ingredient.nutritionUnit.replace(/[^0-9.]/g, "")
                    ) || 100;
                  const factor = ingredient.quantity / nutritionUnitValue;
                  const calculatedCalories =
                    ingredient.caloriesPerUnit * factor;
                  const calculatedProtein = ingredient.proteinPerUnit * factor;
                  const calculatedCarbs = ingredient.carbsPerUnit * factor;
                  const calculatedFat = ingredient.fatPerUnit * factor;

                  return (
                    <div
                      key={`${ingredient.barcode || ingredient.name}-${index}`}
                      className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 p-3 sm:p-4 border border-border rounded-lg bg-muted/30"
                    >
                      <div className="flex-1 w-full sm:w-auto">
                        <div className="font-medium mb-1 text-sm sm:text-base break-words">
                          {ingredient.name}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground break-words">
                          {Math.round(calculatedCalories)} kcal,{" "}
                          {Math.round(calculatedProtein)}g Protein,{" "}
                          {Math.round(calculatedCarbs)}g Carbs,{" "}
                          {Math.round(calculatedFat)}g Fett
                          <span className="ml-1 sm:ml-2 text-xs">
                            ({ingredient.nutritionUnit}:{" "}
                            {Math.round(ingredient.caloriesPerUnit)} kcal)
                          </span>
                        </div>
                        {ingredient.sourceName && (
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1 flex-wrap">
                            <span>Quelle:</span>
                            {ingredient.sourceUrl ? (
                              <a
                                href={ingredient.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline flex items-center gap-1 touch-manipulation"
                              >
                                {ingredient.sourceName}
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                  className="w-3 h-3 flex-shrink-0"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z"
                                    clipRule="evenodd"
                                  />
                                  <path
                                    fillRule="evenodd"
                                    d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </a>
                            ) : (
                              <span>{ingredient.sourceName}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={ingredient.quantity}
                          onChange={(e) =>
                            handleQuantityChange(
                              index,
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="input w-20 sm:w-24 text-right text-base"
                        />
                        <span className="text-sm text-muted-foreground w-8 sm:w-8 flex-shrink-0">
                          {ingredient.unit}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredient(index)}
                          className="text-destructive hover:text-destructive/80 active:text-destructive/60 p-2.5 sm:p-2 touch-manipulation min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                          aria-label="Zutat entfernen"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-5 h-5"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Nährwert-Summe */}
          {ingredients.length > 0 && (
            <div className="p-3 sm:p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <h3 className="font-semibold mb-3 text-base sm:text-lg">
                Gesamtnährwerte
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    Kalorien
                  </div>
                  <div className="text-xl sm:text-2xl font-bold">
                    {Math.round(totalNutrition.calories)}
                  </div>
                  <div className="text-xs text-muted-foreground">kcal</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    Protein
                  </div>
                  <div className="text-xl sm:text-2xl font-bold">
                    {Math.round(totalNutrition.protein * 10) / 10}
                  </div>
                  <div className="text-xs text-muted-foreground">g</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    Carbs
                  </div>
                  <div className="text-xl sm:text-2xl font-bold">
                    {Math.round(totalNutrition.carbs * 10) / 10}
                  </div>
                  <div className="text-xs text-muted-foreground">g</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    Fett
                  </div>
                  <div className="text-xl sm:text-2xl font-bold">
                    {Math.round(totalNutrition.fat * 10) / 10}
                  </div>
                  <div className="text-xs text-muted-foreground">g</div>
                </div>
              </div>
            </div>
          )}

          {/* Gericht-Informationen */}
          <div>
            <label
              htmlFor="dishName"
              className="block text-sm font-medium mb-2"
            >
              Name des Gerichts <span className="text-destructive">*</span>
            </label>
            <input
              id="dishName"
              type="text"
              value={dishName}
              onChange={(e) => setDishName(e.target.value)}
              className="input w-full"
              placeholder="z.B. Spaghetti Bolognese"
              required
            />
          </div>

          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium mb-2"
            >
              Kategorie <span className="text-destructive">*</span>
            </label>
            <select
              id="category"
              value={category || ""}
              onChange={(e) =>
                setCategory(
                  e.target.value as
                    | "breakfast"
                    | "mainDish"
                    | "snack"
                    | undefined
                )
              }
              className="input w-full"
              required
            >
              <option value="">Bitte wählen</option>
              <option value="breakfast">Frühstück</option>
              <option value="mainDish">Mittag/Abendessen</option>
              <option value="snack">Snack/Sonstiges</option>
            </select>
          </div>

          <div>
            <label htmlFor="recipe" className="block text-sm font-medium mb-2">
              Rezept / Notizen (optional)
            </label>
            <textarea
              id="recipe"
              value={recipe}
              onChange={(e) => setRecipe(e.target.value)}
              rows={4}
              className="input w-full"
              placeholder="Beschreibe hier die Zubereitung..."
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4">
            <Link
              to="/dishes"
              className="btn-secondary w-full sm:w-auto text-center touch-manipulation min-h-[44px] flex items-center justify-center"
            >
              Abbrechen
            </Link>
            <button
              type="submit"
              className="btn-primary w-full sm:w-auto touch-manipulation min-h-[44px]"
              disabled={!canSave}
            >
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
