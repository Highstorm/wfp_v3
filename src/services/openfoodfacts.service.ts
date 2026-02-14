import type { DishIngredient } from "../types";

/**
 * OpenFoodFacts Product Types (kompatibel mit beiden APIs)
 */
export interface OpenFoodFactsProduct {
  code: string;
  product_name?: string;
  product_name_de?: string;
  product_name_en?: string;
  nutriments?: {
    "energy-kcal_100g"?: number;
    "energy-kcal_100ml"?: number;
    "energy-kcal_serving"?: number;
    "proteins_100g"?: number;
    "proteins_100ml"?: number;
    "proteins_serving"?: number;
    "carbohydrates_100g"?: number;
    "carbohydrates_100ml"?: number;
    "carbohydrates_serving"?: number;
    "fat_100g"?: number;
    "fat_100ml"?: number;
    "fat_serving"?: number;
  };
}

/**
 * Search-a-licious API Response Types
 */
export interface SearchALiciousHit {
  code: string;
  product_name?: string;
  product_name_de?: string;
  product_name_en?: string;
  nutriments?: {
    "energy-kcal_100g"?: number;
    "energy-kcal_100ml"?: number;
    "energy-kcal_serving"?: number;
    "proteins_100g"?: number;
    "proteins_100ml"?: number;
    "proteins_serving"?: number;
    "carbohydrates_100g"?: number;
    "carbohydrates_100ml"?: number;
    "carbohydrates_serving"?: number;
    "fat_100g"?: number;
    "fat_100ml"?: number;
    "fat_serving"?: number;
  } | null;
}

export interface SearchResponseError {
  title: string;
  description?: string | null;
}

export interface SearchResponseDebug {
  query: object;
}

export interface ErrorSearchResponse {
  errors: SearchResponseError[];
  debug: SearchResponseDebug;
}

export interface SuccessSearchResponse {
  hits: SearchALiciousHit[];
  count: number;
  page: number;
  page_size: number;
  page_count: number;
  took: number;
  timed_out: boolean;
  is_count_exact: boolean;
  warnings?: SearchResponseError[] | null;
  debug: SearchResponseDebug;
}

export type SearchALiciousResponse = ErrorSearchResponse | SuccessSearchResponse;

/**
 * Type Guard um zu prüfen ob es eine SuccessSearchResponse ist
 */
function isSuccessSearchResponse(
  response: SearchALiciousResponse
): response is SuccessSearchResponse {
  return "hits" in response && Array.isArray(response.hits);
}

/**
 * Internes Format für durchsuchbare Produkte
 */
export interface SearchableProduct {
  barcode: string;
  name: string;
  nutritionUnit: string;
  caloriesPerUnit: number;
  proteinPerUnit: number;
  carbsPerUnit: number;
  fatPerUnit: number;
  isAIResult?: boolean; // Flag für KI-Ergebnisse
  aiConfidence?: number; // Optional: Konfidenz-Score
  sourceName?: string; // Name der Quelle (z.B. "Gemini AI", "OpenFoodFacts")
  sourceUrl?: string; // URL zur Quelle für weitere Informationen
}

/**
 * Ermittelt die beste verfügbare Einheit basierend auf den verfügbaren Nährwertdaten
 */
function extractNutritionUnit(product: OpenFoodFactsProduct | SearchALiciousHit): string {
  const nutriments = product.nutriments || {};
  
  // Prüfe ob nutriments null ist
  if (!nutriments || typeof nutriments !== 'object') {
    return "100g";
  }
  
  // Priorität 1: _100g Werte verfügbar
  if (nutriments["energy-kcal_100g"] !== undefined) {
    return "100g";
  }
  
  // Priorität 2: _100ml Werte verfügbar
  if (nutriments["energy-kcal_100ml"] !== undefined) {
    return "100ml";
  }
  
  // Priorität 3: _serving Werte verfügbar
  if (nutriments["energy-kcal_serving"] !== undefined) {
    return "1 Stück";
  }
  
  // Fallback: Standard 100g
  return "100g";
}

/**
 * Extrahiert Nährwertdaten aus einem OpenFoodFacts Produkt
 */
function extractNutritionData(product: OpenFoodFactsProduct | SearchALiciousHit): {
  nutritionUnit: string;
  caloriesPerUnit: number;
  proteinPerUnit: number;
  carbsPerUnit: number;
  fatPerUnit: number;
} {
  const nutriments = product.nutriments || {};
  const nutritionUnit = extractNutritionUnit(product);
  
  // Prüfe ob nutriments null ist
  if (!nutriments || typeof nutriments !== 'object') {
    return {
      nutritionUnit,
      caloriesPerUnit: 0,
      proteinPerUnit: 0,
      carbsPerUnit: 0,
      fatPerUnit: 0,
    };
  }
  
  let caloriesPerUnit = 0;
  let proteinPerUnit = 0;
  let carbsPerUnit = 0;
  let fatPerUnit = 0;
  
  if (nutritionUnit === "100g") {
    caloriesPerUnit = nutriments["energy-kcal_100g"] || 0;
    proteinPerUnit = nutriments["proteins_100g"] || 0;
    carbsPerUnit = nutriments["carbohydrates_100g"] || 0;
    fatPerUnit = nutriments["fat_100g"] || 0;
  } else if (nutritionUnit === "100ml") {
    caloriesPerUnit = nutriments["energy-kcal_100ml"] || 0;
    proteinPerUnit = nutriments["proteins_100ml"] || 0;
    carbsPerUnit = nutriments["carbohydrates_100ml"] || 0;
    fatPerUnit = nutriments["fat_100ml"] || 0;
  } else if (nutritionUnit === "1 Stück") {
    caloriesPerUnit = nutriments["energy-kcal_serving"] || 0;
    proteinPerUnit = nutriments["proteins_serving"] || 0;
    carbsPerUnit = nutriments["carbohydrates_serving"] || 0;
    fatPerUnit = nutriments["fat_serving"] || 0;
  }
  
  return {
    nutritionUnit,
    caloriesPerUnit,
    proteinPerUnit,
    carbsPerUnit,
    fatPerUnit,
  };
}

/**
 * Sucht nach Produkten in der OpenFoodFacts Datenbank
 * Nutzt die moderne Search-a-licious API
 */
export async function searchProducts(query: string): Promise<SearchableProduct[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }
  
  try {
    const encodedQuery = encodeURIComponent(query.trim());
    // Nutze Proxy in Development, direkte URL in Production
    // HINWEIS: Im Production-Mode funktioniert dies nur im Browser aufgrund von CORS
    // Auf mobilen Geräten wird die Suche fehlschlagen, aber KI-Suche funktioniert weiterhin
    const apiUrl = import.meta.env.DEV
      ? `/api/openfoodfacts/search?q=${encodedQuery}&langs=de,en&page_size=10&fields=product_name,product_name_de,product_name_en,code,nutriments`
      : `https://search.openfoodfacts.org/search?q=${encodedQuery}&langs=de,en&page_size=10&fields=product_name,product_name_de,product_name_en,code,nutriments`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data: SearchALiciousResponse = await response.json();
    
    // Prüfe auf ErrorSearchResponse
    if (!isSuccessSearchResponse(data)) {
      const errorMessages = data.errors.map((e) => e.title).join(", ");
      console.error("Search-a-licious API Fehler:", errorMessages);
      throw new Error(`API Error: ${errorMessages}`);
    }
    
    // Logge Warnings falls vorhanden
    if (data.warnings && data.warnings.length > 0) {
      console.warn("Search-a-licious API Warnings:", data.warnings);
    }
    
    // Prüfe auf leere Ergebnisse
    if (!data.hits || data.hits.length === 0) {
      return [];
    }
    
    // Filtere Produkte ohne Namen heraus und mappe zu SearchableProduct
    return data.hits
      .filter((product) => {
        const name = product.product_name_de || product.product_name_en || product.product_name;
        return name && name.trim().length > 0;
      })
      .map((product) => {
        const name = product.product_name_de || product.product_name_en || product.product_name || "Unbekanntes Produkt";
        const nutritionData = extractNutritionData(product);
        
        return {
          barcode: product.code,
          name: name.trim(),
          nutritionUnit: nutritionData.nutritionUnit,
          caloriesPerUnit: nutritionData.caloriesPerUnit,
          proteinPerUnit: nutritionData.proteinPerUnit,
          carbsPerUnit: nutritionData.carbsPerUnit,
          fatPerUnit: nutritionData.fatPerUnit,
        };
      });
  } catch (error) {
    console.error("Fehler bei der OpenFoodFacts Suche:", error);
    // Wirf den Fehler nicht weiter, damit die KI-Suche weiterhin funktionieren kann
    // Stattdessen geben wir ein leeres Array zurück
    return [];
  }
}

/**
 * Konvertiert ein SearchableProduct zu einem DishIngredient
 */
export function productToIngredient(
  product: SearchableProduct,
  quantity: number = 100
): DishIngredient {
  const unit = product.nutritionUnit === "1 Stück" ? "Stück" : 
               product.nutritionUnit === "100ml" ? "ml" : "g";
  
  return {
    name: product.name,
    barcode: product.barcode,
    quantity,
    unit,
    nutritionUnit: product.nutritionUnit,
    caloriesPerUnit: product.caloriesPerUnit,
    proteinPerUnit: product.proteinPerUnit,
    carbsPerUnit: product.carbsPerUnit,
    fatPerUnit: product.fatPerUnit,
    sourceName: product.sourceName,
    sourceUrl: product.sourceUrl,
  };
}

/**
 * Debounce-Funktion für die Suche
 */
export function debounce<T extends (...args: never[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

