import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDishes, useCreateDish, useUpdateDish } from "../../hooks/useDishes";
import {
  analyzeNutritionLabelWithAI,
  isGeminiAvailable,
} from "../../services/gemini.service";
import { logger } from "../../utils/logger";

interface DishFormData {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  recipe: string;
  recipeUrl: string;
  quantity: number;
  originalId: string | undefined;
  category: "breakfast" | "mainDish" | "snack" | undefined;
}

export const DishForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<DishFormData>({
    name: "",
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    recipe: "",
    recipeUrl: "",
    quantity: 1,
    originalId: undefined,
    category: undefined,
  });
  const [message, setMessage] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasGeminiAPIKey, setHasGeminiAPIKey] = useState(false);

  useEffect(() => {
    isGeminiAvailable().then(setHasGeminiAPIKey);
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value to allow selecting same file again
    e.target.value = "";

    setIsAnalyzing(true);
    setMessage("");

    try {
      // Convert to Base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64String = event.target?.result as string;
        // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64Content = base64String.split(",")[1];
        const mimeType = file.type;

        const result = await analyzeNutritionLabelWithAI(
          base64Content,
          mimeType
        );

        if (result) {
          setFormData((prev) => ({
            ...prev,
            name:
              prev.name ||
              (result.name !== "Unbekanntes Produkt" ? result.name : ""),
            calories: result.caloriesPerUnit,
            protein: result.proteinPerUnit,
            carbs: result.carbsPerUnit,
            fat: result.fatPerUnit,
            // If the unit is 1 piece, we might want to assume quantity 1
            // If unit is 100g, we stick to default logic (usually 1 quantity = 100g effectively in many apps, but here quantity is just a number)
          }));
          setMessage("Nährwerte erfolgreich gescannt!");
        } else {
          setMessage(
            "Konnte keine Nährwerte erkennen. Bitte versuche ein schärferes Foto."
          );
        }
        setIsAnalyzing(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      logger.error("Image upload error:", error);
      setMessage("Fehler beim Verarbeiten des Bildes.");
      setIsAnalyzing(false);
    }
  };

  const { data: dishes = [], isLoading } = useDishes();
  const { mutateAsync: createDish } = useCreateDish();
  const { mutateAsync: updateDish } = useUpdateDish();

  // Lade Gerichtsdaten wenn eine ID vorhanden ist
  useEffect(() => {
    if (id && dishes.length > 0) {
      const dish = dishes.find((d) => d.id === id);
      if (dish) {
        // Prüfe ob Gericht ingredient-basiert ist und leite um
        if (dish.isIngredientBased) {
          navigate(`/dishes/${id}/edit-ingredients`, { replace: true });
          return;
        }

        setFormData({
          name: dish.name,
          calories: dish.calories || 0,
          protein: dish.protein || 0,
          carbs: dish.carbs || 0,
          fat: dish.fat || 0,
          recipe: dish.recipe || "",
          recipeUrl: dish.recipeUrl || "",
          quantity: dish.quantity || 1,
          originalId: dish.originalId,
          category: dish.category,
        });
      }
    }
  }, [id, dishes, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const dishData = {
        name: formData.name,
        calories: formData.calories || 0,
        protein: formData.protein || 0,
        carbs: formData.carbs || 0,
        fat: formData.fat || 0,
        recipe: formData.recipe || "",
        recipeUrl: formData.recipeUrl || "",
        quantity: formData.quantity || 1,
        originalId: formData.originalId,
        category: formData.category,
      };

      if (id) {
        await updateDish({
          id,
          ...dishData,
        });
        setMessage("Gericht erfolgreich aktualisiert!");
      } else {
        await createDish(dishData);
        setMessage("Gericht erfolgreich erstellt!");
        // Setze die Filter zurück
        localStorage.removeItem("dishFilters");
      }

      // Kleine Verzögerung, um sicherzustellen, dass der Server Zeit hat zu antworten
      setTimeout(() => {
        navigate("/dishes");
      }, 500);
    } catch (error) {
      logger.error("Error saving dish:", error);
      setMessage("Fehler beim Speichern des Gerichts.");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "number" && value !== "" ? parseFloat(value) || null : value,
    }));
  };

  // Nur Loading anzeigen wenn wir tatsächlich ein Gericht laden
  if (id && isLoading) {
    return (
      <div className="card p-3 sm:p-4 lg:p-8">
        <p className="text-center text-muted-foreground">Lade Gericht...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 lg:py-6 pb-20 md:pb-6">
      <div className="card p-3 sm:p-4 lg:p-8">
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-center text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight break-words px-2">
            {id ? "Gericht bearbeiten" : "Neues Gericht anlegen"}
          </h1>
          <p className="text-center text-sm sm:text-base text-muted-foreground mt-1.5 sm:mt-2">
            {id
              ? "Bearbeite die Details des Gerichts"
              : "Füge ein neues Gericht mit Nährwerten und Rezept hinzu"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 lg:space-y-5">
          {hasGeminiAPIKey && (
            <div className="bg-muted/30 border border-border rounded-lg p-4 mb-6">
              <label className="block text-sm font-medium mb-2">
                Nährwerte aus Foto scannen
              </label>
              <div className="flex flex-col items-start gap-2 sm:gap-4">
                <label className="btn-secondary cursor-pointer flex items-center gap-2 text-sm w-full sm:w-auto justify-center">
                  {isAnalyzing ? (
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
                      Foto hochladen / aufnehmen
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageUpload}
                    disabled={isAnalyzing}
                    className="hidden"
                  />
                </label>
                <div className="text-xs text-muted-foreground break-words w-full">
                  Erkennt automatisch Kalorien, Protein, Fett & Kohlenhydrate
                </div>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm sm:text-sm font-medium mb-1.5">
              Name des Gerichts
            </label>
            <input
              required
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className="input text-base sm:text-sm"
              placeholder="z.B. Spaghetti Bolognese"
            />
          </div>

          <div>
            <label htmlFor="calories" className="block text-sm sm:text-sm font-medium mb-1.5">
              Kalorien (kcal)
            </label>
            <input
              id="calories"
              name="calories"
              type="number"
              value={formData.calories ?? ""}
              onChange={handleChange}
              className="input text-base sm:text-sm"
              min="0"
              placeholder="z.B. 500"
            />
          </div>

          <div>
            <label htmlFor="protein" className="block text-sm sm:text-sm font-medium mb-1.5">
              Protein (g)
            </label>
            <input
              id="protein"
              name="protein"
              type="number"
              value={formData.protein ?? ""}
              onChange={handleChange}
              className="input text-base sm:text-sm"
              min="0"
              placeholder="z.B. 25"
            />
          </div>

          <div>
            <label htmlFor="fat" className="block text-sm sm:text-sm font-medium mb-1.5">
              Fette (g)
            </label>
            <input
              id="fat"
              name="fat"
              type="number"
              value={formData.fat ?? ""}
              onChange={handleChange}
              className="input text-base sm:text-sm"
              min="0"
              placeholder="z.B. 15"
            />
          </div>

          <div>
            <label htmlFor="carbs" className="block text-sm sm:text-sm font-medium mb-1.5">
              Kohlenhydrate (g)
            </label>
            <input
              id="carbs"
              name="carbs"
              type="number"
              value={formData.carbs ?? ""}
              onChange={handleChange}
              className="input text-base sm:text-sm"
              min="0"
              placeholder="z.B. 65"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm sm:text-sm font-medium mb-1.5">
              Kategorie
            </label>
            <select
              id="category"
              name="category"
              value={formData.category || ""}
              onChange={handleChange}
              className="input text-base sm:text-sm"
            >
              <option value="">Bitte wählen</option>
              <option value="breakfast">Frühstück</option>
              <option value="mainDish">Mittag/Abendessen</option>
              <option value="snack">Snack/Sonstiges</option>
            </select>
          </div>

          <div>
            <label htmlFor="recipe" className="block text-sm sm:text-sm font-medium mb-1.5">
              Rezept (Text)
            </label>
            <textarea
              id="recipe"
              name="recipe"
              value={formData.recipe}
              onChange={handleChange}
              rows={4}
              className="input text-base sm:text-sm"
              placeholder="Beschreibe hier die Zubereitung..."
            />
          </div>

          <div>
            <label htmlFor="recipeUrl" className="block text-sm sm:text-sm font-medium mb-1.5">
              Rezept-Link (optional)
            </label>
            <input
              id="recipeUrl"
              name="recipeUrl"
              type="url"
              value={formData.recipeUrl}
              onChange={handleChange}
              className="input text-base sm:text-sm"
              placeholder="https://..."
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 pt-3 sm:pt-4">
            <Link to="/dishes" className="btn-secondary text-sm sm:text-base py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 text-center">
              Abbrechen
            </Link>
            <button type="submit" className="btn-primary text-sm sm:text-base py-2.5 sm:py-2 min-h-[44px] sm:min-h-0">
              Speichern
            </button>
          </div>

          {message && (
            <p
              className={`mt-2 sm:mt-2 text-sm sm:text-sm text-center leading-relaxed ${message.includes("Fehler")
                ? "text-destructive"
                : "text-green-600"
                }`}
            >
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};
