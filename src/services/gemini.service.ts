import { app } from "../firebase";
import { SearchableProduct } from "./openfoodfacts.service";

/**
 * Gemini Modell-Konfiguration
 * Verwendetes Modell: gemini-2.5-flash
 * Dieses Modell bietet eine gute Balance zwischen Geschwindigkeit und Qualität für Nährwert-Suchen.
 * 
 * Thinking ist deaktiviert (thinkingBudget: 0) für schnellere Response-Zeiten.
 * Siehe: https://ai.google.dev/gemini-api/docs/text-generation?hl=de#thinking_with_gemini_25
 */
const GEMINI_MODEL = "gemini-2.5-flash";
const THINKING_BUDGET = 0; // Deaktiviert logisches Denken für schnellere Antworten

/**
 * Strukturierte Response von Gemini für Nährwerte
 */
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

/**
 * Dynamischer Import des Firebase AI SDK
 * Falls das Modul nicht verfügbar ist, wird null zurückgegeben
 * 
 * HINWEIS: Das firebase/ai Modul ist nur in neueren Firebase-Versionen verfügbar.
 * Bitte aktualisieren Sie Firebase mit: npm install firebase@latest
 */
async function getFirebaseAIModule() {
  try {
    console.debug("[Gemini] Lade Firebase AI SDK...");
    // Verwende dynamischen Import mit try-catch zur Laufzeit
    // @ts-ignore - Modul existiert möglicherweise nicht in älteren Firebase-Versionen
    const aiModule = await import("firebase/ai");
    console.debug("[Gemini] Firebase AI SDK erfolgreich geladen");
    return aiModule;
  } catch (error) {
    console.warn("[Gemini] Firebase AI SDK nicht verfügbar. Bitte Firebase auf die neueste Version aktualisieren: npm install firebase@latest", error);
    return null;
  }
}

/**
 * Initialisiert das Gemini-Modell über Firebase AI SDK
 * Verwendet das Modell: gemini-2.5-flash
 * 
 * Hinweis: Thinking ist deaktiviert (thinkingBudget: 0) für schnellere Response-Zeiten.
 * Dies verbessert die Performance bei einfachen Nährwert-Suchen erheblich.
 */
let modelInstance: any = null;

async function getModel() {
  if (!modelInstance) {
    try {
      console.debug(`[Gemini] Initialisiere Modell: ${GEMINI_MODEL}`);
      const aiModule = await getFirebaseAIModule();
      if (!aiModule) {
        console.warn("[Gemini] Firebase AI Modul nicht verfügbar");
        return null;
      }
      
      const { getAI, getGenerativeModel, GoogleAIBackend } = aiModule;
      const ai = getAI(app, { backend: new GoogleAIBackend() });
      modelInstance = getGenerativeModel(ai, { model: GEMINI_MODEL });
      console.debug(`[Gemini] Modell ${GEMINI_MODEL} erfolgreich initialisiert`);
      return modelInstance;
    } catch (error) {
      console.error(`[Gemini] Fehler beim Initialisieren des Modells ${GEMINI_MODEL}:`, error);
      return null;
    }
  }
  return modelInstance;
}

/**
 * Prüft, ob Gemini AI verfügbar ist
 * @returns true wenn Gemini AI verfügbar ist
 */
export async function isGeminiAvailable(): Promise<boolean> {
  try {
    console.debug(`[Gemini] Prüfe Verfügbarkeit für Modell: ${GEMINI_MODEL}`);
    const model = await getModel();
    const isAvailable = model !== null;
    console.debug(`[Gemini] Verfügbarkeit: ${isAvailable ? "verfügbar" : "nicht verfügbar"}`);
    return isAvailable;
  } catch (error) {
    console.error(`[Gemini] Fehler bei Verfügbarkeitsprüfung:`, error);
    return false;
  }
}

/**
 * Sucht nach Nährwerten für ein Lebensmittel mit Gemini AI
 * @param query - Das Lebensmittel (z.B. "Banane", "Milch", "1 Apfel")
 * @returns SearchableProduct oder null bei Fehler
 */
export async function searchNutritionWithAI(
  query: string
): Promise<SearchableProduct | null> {
  const startTime = Date.now();
  const trimmedQuery = query?.trim() || "";
  
  console.debug(`[Gemini] Starte AI-Suche für: "${trimmedQuery}" (Modell: ${GEMINI_MODEL})`);
  
  // Validiere Query
  if (!trimmedQuery || trimmedQuery.length < 3) {
    console.debug(`[Gemini] Query zu kurz oder leer: "${trimmedQuery}"`);
    return null;
  }

  const model = await getModel();
  if (!model) {
    console.warn(`[Gemini] Modell ${GEMINI_MODEL} konnte nicht initialisiert werden. KI-Suche deaktiviert.`);
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
    console.debug(`[Gemini] Sende Anfrage an Modell ${GEMINI_MODEL} (Thinking deaktiviert: ${THINKING_BUDGET === 0 ? "nein" : "ja"})...`);
    
    // Timeout-Handling: Verwende AbortController-ähnliches Pattern
    let timeoutId: NodeJS.Timeout | null = null;
    let isTimedOut = false;
    
    const timeoutPromise = new Promise<null>((resolve) => {
      timeoutId = setTimeout(() => {
        isTimedOut = true;
        const elapsed = Date.now() - startTime;
        console.warn(`[Gemini] Timeout nach ${elapsed}ms für Query: "${trimmedQuery}"`);
        resolve(null);
      }, 15000); // 15s Timeout (erhöht von 10s)
    });

    // Thinking-Config: Deaktiviere logisches Denken für schnellere Antworten
    const generateContentConfig = {
      thinkingConfig: {
        thinkingBudget: THINKING_BUDGET,
      },
    };


    console.debug(`[Gemini] prompt:`, prompt);
    const generatePromise = model.generateContent(prompt, generateContentConfig).then((result: { response: { text(): string | null } }) => {
      
      // Prüfe ob bereits Timeout aufgetreten ist
      if (isTimedOut) {
        console.debug(`[Gemini] Antwort kam nach Timeout für Query: "${trimmedQuery}"`);
        return null;
      }
      
      // Timeout löschen, da Antwort rechtzeitig kam
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      const elapsed = Date.now() - startTime;
      console.debug(`[Gemini] Antwort erhalten nach ${elapsed}ms`);
      
      const response = result.response;
      const text = response.text()?.trim() || "";

      if (!text) {
        console.warn(`[Gemini] Keine Antwort-Text erhalten für Query: "${trimmedQuery}"`);
        return null;
      }

      console.debug(`[Gemini] Antwort-Text erhalten (${text.length} Zeichen):`, text.substring(0, 200));

      // Parse JSON aus Text
      const nutritionData = parseGeminiResponse(text);

      if (!nutritionData) {
        console.warn(`[Gemini] Konnte Antwort nicht parsen für Query: "${trimmedQuery}"`);
        return null;
      }

      console.debug(`[Gemini] Nährwerte erfolgreich geparst:`, nutritionData);

      // Generiere eindeutigen Barcode für KI-Ergebnis
      const barcode = `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const searchResult = {
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
        // sourceName: "Gemini AI",
        // sourceUrl: `https://www.google.com/search?q=${encodeURIComponent(nutritionData.name + " nährwerte")}`,
      };
      
      const totalElapsed = Date.now() - startTime;
      console.debug(`[Gemini] AI-Suche erfolgreich abgeschlossen nach ${totalElapsed}ms für: "${trimmedQuery}"`);
      
      return searchResult;
    }).catch((error: unknown) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      const elapsed = Date.now() - startTime;
      console.error(`[Gemini] Fehler bei generateContent nach ${elapsed}ms:`, error);
      throw error;
    });

    const result = await Promise.race([generatePromise, timeoutPromise]);
    
    // Cleanup: Stelle sicher, dass Timeout gelöscht wird
    if (timeoutId && !isTimedOut) {
      clearTimeout(timeoutId);
    }
    
    if (result) {
      const totalElapsed = Date.now() - startTime;
      console.debug(`[Gemini] AI-Suche erfolgreich abgeschlossen nach ${totalElapsed}ms`);
    }
    
    return result;
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`[Gemini] Fehler bei AI-Suche nach ${elapsed}ms für Query: "${trimmedQuery}"`, error);
    return null;
  }
}

/**
 * Analysiert ein Foto einer Nährwerttabelle mit Gemini AI
 * @param imageBase64 - Das Bild als Base64-String (ohne Prefix "data:image/...")
 * @param mimeType - Der Mime-Type des Bildes (z.B. "image/jpeg")
 * @returns GeminiNutritionResponse oder null bei Fehler
 */
export async function analyzeNutritionLabelWithAI(
  imageBase64: string,
  mimeType: string = "image/jpeg"
): Promise<GeminiNutritionResponse | null> {
  const startTime = Date.now();
  console.debug(`[Gemini] Starte Bild-Analyse (${mimeType}, Länge: ${imageBase64.length})`);

  try {
    const model = await getModel();
    if (!model) {
      console.warn(`[Gemini] Modell nicht verfügbar für Bild-Analyse.`);
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

    // Multimodaler Input
    const parts = [
      { text: prompt },
      {
        inlineData: {
          mimeType: mimeType,
          data: imageBase64
        }
      }
    ];

    console.debug(`[Gemini] Sende Bild-Anfrage an Modell...`);
    
    const result = await model.generateContent({
      contents: [{ role: "user", parts: parts }]
    });

    const response = result.response;
    const text = response.text()?.trim() || "";
    
    console.debug(`[Gemini] Antwort erhalten (${Date.now() - startTime}ms):`, text.substring(0, 100) + "...");

    const nutritionData = parseGeminiResponse(text);
    
    if (nutritionData) {
      // Setze Source explizit auf Scan
      nutritionData.sourceName = "Scan aus Nährwerttabelle";
      return nutritionData;
    }

    return null;

  } catch (error) {
    console.error(`[Gemini] Fehler bei Bild-Analyse:`, error);
    return null;
  }
}

/**
 * Parst die Gemini Response und extrahiert JSON
 */
function parseGeminiResponse(text: string): GeminiNutritionResponse | null {
  try {
    console.debug(`[Gemini] Parse Response (${text.length} Zeichen)`);
    
    // Versuche direktes JSON Parsing
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      console.debug(`[Gemini] JSON-Match gefunden:`, jsonMatch[0].substring(0, 200));
      const parsed = JSON.parse(jsonMatch[0]);
      return validateNutritionData(parsed);
    }

    // Fallback: Versuche gesamten Text zu parsen
    console.debug(`[Gemini] Versuche gesamten Text zu parsen`);
    const parsed = JSON.parse(text);
    return validateNutritionData(parsed);
  } catch (error) {
    console.warn(`[Gemini] Fehler beim Parsen der Response:`, error);
    console.debug(`[Gemini] Response-Text:`, text.substring(0, 500));
    return null;
  }
}

/**
 * Validiert und normalisiert die Nährwertdaten
 */
function validateNutritionData(
  data: any
): GeminiNutritionResponse | null {
  console.debug(`[Gemini] Validiere Nährwertdaten:`, data);
  
  if (!data || typeof data !== "object") {
    console.warn(`[Gemini] Ungültige Datenstruktur:`, data);
    return null;
  }

  // Validiere nutritionUnit
  const validUnits = ["100g", "100ml", "1 Stück"];
  const nutritionUnit = validUnits.includes(data.nutritionUnit)
    ? data.nutritionUnit
    : "100g"; // Fallback

  if (!validUnits.includes(data.nutritionUnit)) {
    console.debug(`[Gemini] Ungültige nutritionUnit "${data.nutritionUnit}", verwende Fallback "100g"`);
  }

  // Validiere Zahlen
  const caloriesPerUnit = Number(data.caloriesPerUnit) || 0;
  const proteinPerUnit = Number(data.proteinPerUnit) || 0;
  const carbsPerUnit = Number(data.carbsPerUnit) || 0;
  const fatPerUnit = Number(data.fatPerUnit) || 0;

  // Validiere Quelle
  const sourceName = String(data.sourceName || "").trim();
  // sourceUrl kann leer sein bei Scans
  // sourceUrl kann leer sein bei Scans
  
  if (!sourceName) {
    console.warn(`[Gemini] Quelle fehlt oder ist leer`);
    return null;
  }

  // Validiere Name
  const name = String(data.name || "").trim();
  if (!name) {
    console.warn(`[Gemini] Name fehlt oder ist leer`);
    return null;
  }

  const validated = {
    name,
    nutritionUnit: nutritionUnit as "100g" | "100ml" | "1 Stück",
    caloriesPerUnit: Math.max(0, caloriesPerUnit),
    proteinPerUnit: Math.max(0, proteinPerUnit),
    carbsPerUnit: Math.max(0, carbsPerUnit),
    fatPerUnit: Math.max(0, fatPerUnit),
    sourceName: data.sourceName || "",
    sourceUrl: data.sourceUrl || "",
  };
  
  console.debug(`[Gemini] Validierte Daten:`, validated);
  
  return validated;
}

