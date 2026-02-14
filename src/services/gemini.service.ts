import { app } from "../lib/firebase";
import { SearchableProduct } from "./openfoodfacts.service";

const GEMINI_MODEL = "gemini-2.5-flash";
const THINKING_BUDGET = 0;

/**
 * Interface for the Firebase AI GenerativeModel instance.
 * Defined locally to avoid dependency on the dynamically imported firebase/ai module.
 */
interface GenerativeModelInstance {
  generateContent(
    request: string | { contents: Array<{ role: string; parts: unknown[] }> },
    config?: Record<string, unknown>
  ): Promise<{ response: { text(): string | null } }>;
}

interface GeminiNutritionResponse {
  name: string;
  nutritionUnit: "100g" | "100ml" | "1 Stück";
  caloriesPerUnit: number;
  proteinPerUnit: number;
  carbsPerUnit: number;
  fatPerUnit: number;
  sourceName: string;
  sourceUrl: string;
}

async function getFirebaseAIModule() {
  try {
    // TODO: logger.debug("[Gemini] Loading Firebase AI SDK...")
    // @ts-ignore - Module may not exist in older Firebase versions
    const aiModule = await import("firebase/ai");
    return aiModule;
  } catch {
    // TODO: logger.warn("[Gemini] Firebase AI SDK not available")
    return null;
  }
}

let modelInstance: GenerativeModelInstance | null = null;

async function getModel(): Promise<GenerativeModelInstance | null> {
  if (!modelInstance) {
    try {
      // TODO: logger.debug(`[Gemini] Initializing model: ${GEMINI_MODEL}`)
      const aiModule = await getFirebaseAIModule();
      if (!aiModule) {
        // TODO: logger.warn("[Gemini] Firebase AI module not available")
        return null;
      }

      const { getAI, getGenerativeModel, GoogleAIBackend } = aiModule;
      const ai = getAI(app, { backend: new GoogleAIBackend() });
      modelInstance = getGenerativeModel(ai, { model: GEMINI_MODEL }) as GenerativeModelInstance;
      return modelInstance;
    } catch {
      // TODO: logger.error(`[Gemini] Error initializing model ${GEMINI_MODEL}`)
      return null;
    }
  }
  return modelInstance;
}

export async function isGeminiAvailable(): Promise<boolean> {
  try {
    const model = await getModel();
    return model !== null;
  } catch {
    // TODO: logger.error("[Gemini] Error checking availability")
    return false;
  }
}

export async function searchNutritionWithAI(
  query: string
): Promise<SearchableProduct | null> {
  const trimmedQuery = query?.trim() || "";

  if (!trimmedQuery || trimmedQuery.length < 3) {
    return null;
  }

  const model = await getModel();
  if (!model) {
    // TODO: logger.warn("[Gemini] Model not available, AI search disabled")
    return null;
  }

  const prompt = `"${trimmedQuery}" nährwerte json
  Wenn du kein Plausibles Produkt findest, antworte mit "Kein passendes Produkt gefunden".
  Überprüfe deine Antworten, ob diese mit mindestens zwei Quelle abseits des AI Modes der Google Suche.

  Antworte NUR mit einem JSON-Objekt in folgendem Format:
  {
    "name": "Name des Lebensmittels",
    "nutritionUnit": "100g" | "100ml" | "1 Stück",
    "caloriesPerUnit": number,
    "proteinPerUnit": number,
    "carbsPerUnit": number,
    "fatPerUnit": number,
    "sourceName": "Name der Quelle",
    "sourceUrl": "URL der Quelle"
  }

  Bestimme die Einheit intelligent:
  - "100g" für feste Lebensmittel (Brot, Banane, etc.)
  - "100ml" für Flüssigkeiten (Milch, Öl, etc.)
  - "1 Stück" für Portionsgrößen (Apfel, Ei, etc.)

  Antworte nur mit dem JSON, keine zusätzlichen Erklärungen.`;

  try {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let isTimedOut = false;

    const timeoutPromise = new Promise<null>((resolve) => {
      timeoutId = setTimeout(() => {
        isTimedOut = true;
        // TODO: logger.warn(`[Gemini] Timeout for query: "${trimmedQuery}"`)
        resolve(null);
      }, 15000);
    });

    const generateContentConfig = {
      thinkingConfig: {
        thinkingBudget: THINKING_BUDGET,
      },
    };

    const generatePromise = model.generateContent(prompt, generateContentConfig).then((result) => {
      if (isTimedOut) return null;

      if (timeoutId) clearTimeout(timeoutId);

      const response = result.response;
      const text = response.text()?.trim() || "";

      if (!text) {
        // TODO: logger.warn("[Gemini] Empty response text")
        return null;
      }

      const nutritionData = parseGeminiResponse(text);
      if (!nutritionData) return null;

      const barcode = `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      return {
        barcode,
        name: nutritionData.name,
        nutritionUnit: nutritionData.nutritionUnit,
        caloriesPerUnit: nutritionData.caloriesPerUnit,
        proteinPerUnit: nutritionData.proteinPerUnit,
        carbsPerUnit: nutritionData.carbsPerUnit,
        fatPerUnit: nutritionData.fatPerUnit,
        isAIResult: true,
        sourceName: nutritionData.sourceName,
        sourceUrl: nutritionData.sourceUrl,
      };
    }).catch((error: unknown) => {
      if (timeoutId) clearTimeout(timeoutId);
      // TODO: logger.error("[Gemini] generateContent error", error)
      throw error;
    });

    const result = await Promise.race([generatePromise, timeoutPromise]);

    if (timeoutId && !isTimedOut) {
      clearTimeout(timeoutId);
    }

    // TODO: logger.debug("[Gemini] AI search completed")
    return result;
  } catch {
    // TODO: logger.error("[Gemini] AI search error")
    return null;
  }
}

export async function analyzeNutritionLabelWithAI(
  imageBase64: string,
  mimeType: string = "image/jpeg"
): Promise<GeminiNutritionResponse | null> {
  try {
    const model = await getModel();
    if (!model) {
      // TODO: logger.warn("[Gemini] Model not available for image analysis")
      return null;
    }

    const prompt = `
    Analysiere dieses Bild einer Nährwerttabelle.
    Extrahiere die Nährwerte pro 100g oder 100ml. Falls diese nicht verfügbar sind, nimm die Werte pro Portion und setze "nutritionUnit" auf "1 Stück".
    Wenn die Einheit "Pro Riegel" angegeben ist, setze "nutritionUnit" auf "1 Stück" und verwende dann IMMER die Nährwerte die pro Riegel angegeben sind.
    Versuche auch einen passenden Produktnamen zu finden, falls auf dem Bild sichtbar (z.B. Überschrift).

    Antworte NUR mit einem JSON-Objekt in folgendem Format:
    {
      "name": "Produktname oder 'Unbekanntes Produkt'",
      "nutritionUnit": "100g" | "100ml" | "1 Stück",
      "caloriesPerUnit": number,
      "proteinPerUnit": number,
      "carbsPerUnit": number,
      "fatPerUnit": number,
      "sourceName": "Scan",
      "sourceUrl": ""
    }

    Wichtig:
    - caloriesPerUnit müssen kcal sein (nicht kJ).
    - Gib nur reines JSON zurück.
    `;

    const parts = [
      { text: prompt },
      {
        inlineData: {
          mimeType: mimeType,
          data: imageBase64
        }
      }
    ];

    const result = await model.generateContent({
      contents: [{ role: "user", parts: parts }]
    });

    const response = result.response;
    const text = response.text()?.trim() || "";

    const nutritionData = parseGeminiResponse(text);

    if (nutritionData) {
      nutritionData.sourceName = "Scan aus Nährwerttabelle";
      return nutritionData;
    }

    return null;
  } catch {
    // TODO: logger.error("[Gemini] Error during image analysis")
    return null;
  }
}

function parseGeminiResponse(text: string): GeminiNutritionResponse | null {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
      return validateNutritionData(parsed);
    }

    const parsed = JSON.parse(text) as Record<string, unknown>;
    return validateNutritionData(parsed);
  } catch {
    // TODO: logger.warn("[Gemini] Error parsing response")
    return null;
  }
}

function validateNutritionData(
  data: Record<string, unknown>
): GeminiNutritionResponse | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const validUnits = ["100g", "100ml", "1 Stück"];
  const nutritionUnit = validUnits.includes(data.nutritionUnit as string)
    ? (data.nutritionUnit as string)
    : "100g";

  const caloriesPerUnit = Number(data.caloriesPerUnit) || 0;
  const proteinPerUnit = Number(data.proteinPerUnit) || 0;
  const carbsPerUnit = Number(data.carbsPerUnit) || 0;
  const fatPerUnit = Number(data.fatPerUnit) || 0;

  const sourceName = String(data.sourceName || "").trim();
  if (!sourceName) return null;

  const name = String(data.name || "").trim();
  if (!name) return null;

  return {
    name,
    nutritionUnit: nutritionUnit as "100g" | "100ml" | "1 Stück",
    caloriesPerUnit: Math.max(0, caloriesPerUnit),
    proteinPerUnit: Math.max(0, proteinPerUnit),
    carbsPerUnit: Math.max(0, carbsPerUnit),
    fatPerUnit: Math.max(0, fatPerUnit),
    sourceName: String(data.sourceName || ""),
    sourceUrl: String(data.sourceUrl || ""),
  };
}

