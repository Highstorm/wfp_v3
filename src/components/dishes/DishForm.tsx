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
      <div className="p-8">
        <p className="text-center text-muted-foreground">Lade Gericht...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 pb-20 md:pb-6 max-w-lg">
      {/* Back + Title */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/dishes"
          className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors touch-manipulation"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="font-display font-extrabold text-xl">
          {id ? "Gericht bearbeiten" : "Neues Gericht"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* AI Scan - Inverted dark area */}
        {hasGeminiAPIKey && (
          <label className="block bg-zinc-900 dark:bg-white rounded-2xl p-5 text-center cursor-pointer hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors">
            {isAnalyzing ? (
              <div className="flex flex-col items-center gap-2">
                <svg className="animate-spin h-8 w-8 text-white dark:text-zinc-900" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-white dark:text-zinc-900 text-sm font-medium">Analysiere...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <svg className="w-8 h-8 text-white dark:text-zinc-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
                <span className="text-white dark:text-zinc-900 text-sm font-bold">Nährwerte scannen</span>
                <span className="text-white/60 dark:text-zinc-500 text-xs">Foto von Nährwerttabelle aufnehmen</span>
              </div>
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
        )}

        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1.5">
            Name
          </label>
          <input
            required
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            className="input"
            placeholder="z.B. Spaghetti Bolognese"
          />
        </div>

        {/* 2x2 Nutrition Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="calories" className="block text-xs font-medium text-muted-foreground mb-1">
              Kalorien (kcal)
            </label>
            <input
              id="calories"
              name="calories"
              type="number"
              value={formData.calories ?? ""}
              onChange={handleChange}
              className="input text-center font-display font-bold text-lg"
              min="0"
              placeholder="0"
            />
          </div>
          <div>
            <label htmlFor="protein" className="block text-xs font-medium text-muted-foreground mb-1">
              Protein (g)
            </label>
            <input
              id="protein"
              name="protein"
              type="number"
              value={formData.protein ?? ""}
              onChange={handleChange}
              className="input text-center font-display font-bold text-lg"
              min="0"
              placeholder="0"
            />
          </div>
          <div>
            <label htmlFor="carbs" className="block text-xs font-medium text-muted-foreground mb-1">
              Kohlenhydrate (g)
            </label>
            <input
              id="carbs"
              name="carbs"
              type="number"
              value={formData.carbs ?? ""}
              onChange={handleChange}
              className="input text-center font-display font-bold text-lg"
              min="0"
              placeholder="0"
            />
          </div>
          <div>
            <label htmlFor="fat" className="block text-xs font-medium text-muted-foreground mb-1">
              Fett (g)
            </label>
            <input
              id="fat"
              name="fat"
              type="number"
              value={formData.fat ?? ""}
              onChange={handleChange}
              className="input text-center font-display font-bold text-lg"
              min="0"
              placeholder="0"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium mb-1.5">
            Kategorie
          </label>
          <select
            id="category"
            name="category"
            value={formData.category || ""}
            onChange={handleChange}
            className="input"
          >
            <option value="">Bitte wählen</option>
            <option value="breakfast">Frühstück</option>
            <option value="mainDish">Hauptgericht</option>
            <option value="snack">Snack</option>
          </select>
        </div>

        {/* Recipe */}
        <div>
          <label htmlFor="recipe" className="block text-sm font-medium mb-1.5">
            Rezept
          </label>
          <textarea
            id="recipe"
            name="recipe"
            value={formData.recipe}
            onChange={handleChange}
            rows={4}
            className="input"
            placeholder="Zubereitung beschreiben..."
          />
        </div>

        {/* Recipe URL */}
        <div>
          <label htmlFor="recipeUrl" className="block text-sm font-medium mb-1.5">
            Rezept-Link
          </label>
          <input
            id="recipeUrl"
            name="recipeUrl"
            type="url"
            value={formData.recipeUrl}
            onChange={handleChange}
            className="input"
            placeholder="https://..."
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Link to="/dishes" className="btn-secondary flex-1 text-center">
            Abbrechen
          </Link>
          <button type="submit" className="btn-primary flex-1">
            Speichern
          </button>
        </div>

        {message && (
          <p
            className={`text-sm text-center ${message.includes("Fehler")
              ? "text-destructive"
              : "text-green-600"
            }`}
          >
            {message}
          </p>
        )}
      </form>
    </div>
  );
};
