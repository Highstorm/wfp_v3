import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useImportSharedDish } from "../../hooks/useSharedDishes";
import { DishCard } from "./DishCard";
import type { Dish } from "../../types";

export const ImportDishPage: React.FC = () => {
  const navigate = useNavigate();
  const { shareCode } = useParams<{ shareCode: string }>();
  const [importCode, setImportCode] = useState(shareCode || "");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [importedDish, setImportedDish] = useState<Dish | null>(null);
  const [isRecipeExpanded, setIsRecipeExpanded] = useState(false);
  const { mutate: importDish, isPending: isImporting } = useImportSharedDish();

  useEffect(() => {
    // Wenn ein Code in der URL ist, versuche automatisch zu importieren
    if (shareCode && shareCode.length > 0) {
      handleImport();
    }
  }, [shareCode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleImport = () => {
    setErrorMessage("");
    setSuccessMessage("");
    setImportedDish(null);

    // Wenn die Eingabe eine URL ist, extrahiere den Code
    let code = importCode.trim();
    if (code.includes("/shared-dish/")) {
      const parts = code.split("/shared-dish/");
      code = parts[parts.length - 1];
    }

    // Wenn der Code noch nicht bereinigt ist, entferne alles nach einem möglichen Abfragezeichen
    if (code.includes("?")) {
      code = code.split("?")[0];
    }

    // Importiere das Gericht
    importDish(code, {
      onSuccess: (dish) => {
        if (dish) {
          setSuccessMessage("Gericht erfolgreich importiert!");
          setImportedDish(dish);
        }
      },
      onError: (error) => {
        console.error("Import failed:", error);

        // Prüfe, ob es sich um einen Firestore Index-Fehler handelt
        const errorMsg = error instanceof Error ? error.message : String(error);

        if (errorMsg.includes("The query requires an index")) {
          setErrorMessage(
            "Der Server benötigt einen Moment, um die Daten zu indexieren. Bitte versuche es in einigen Minuten erneut."
          );
        } else if (
          errorMsg.includes("invalid data") ||
          errorMsg.includes("Unsupported field value")
        ) {
          setErrorMessage(
            "Das Gericht enthält ungültige Datenformate und konnte nicht importiert werden. Bitte kontaktiere den Ersteller des Gerichts."
          );
        } else {
          setErrorMessage(
            "Das Gericht konnte nicht importiert werden. Überprüfe den Code und versuche es erneut."
          );
        }
      },
    });
  };

  return (
    <div className="container mx-auto px-4 py-6 pb-20 md:pb-6">
      <div className="max-w-3xl mx-auto">
        <div className="card p-6">
          <h1 className="text-2xl font-bold mb-6">Gericht importieren</h1>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium">
              Teilen-Code oder URL
              <input
                type="text"
                value={importCode}
                onChange={(e) => setImportCode(e.target.value)}
                placeholder="z.B. ABCD1234 oder vollständige URL"
                className="input mt-1"
              />
            </label>
            <p className="mt-2 text-sm text-muted-foreground">
              Gib den Code ein, den du vom Teilen eines Gerichts erhalten hast,
              oder füge die vollständige URL ein.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 rounded-md border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-600">
              {successMessage}
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={() => navigate("/dishes")}
              className="btn-secondary"
            >
              Zurück zur Übersicht
            </button>
            <button
              onClick={handleImport}
              disabled={isImporting || !importCode.trim()}
              className={`btn-primary ${
                isImporting || !importCode.trim()
                  ? "cursor-not-allowed opacity-50"
                  : ""
              }`}
            >
              {isImporting ? "Importiere..." : "Importieren"}
            </button>
          </div>

          {importedDish && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">
                Importiertes Gericht:
              </h2>
              <DishCard
                dish={importedDish}
                onToggleRecipe={() => setIsRecipeExpanded(!isRecipeExpanded)}
                onEdit={() => navigate(`/dishes/${importedDish.id}/edit`)}
                onDelete={() => {}} // Leer, da wir das Löschen hier nicht anbieten wollen
                isExpanded={isRecipeExpanded}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
