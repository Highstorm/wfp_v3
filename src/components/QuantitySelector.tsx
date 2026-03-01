import React, { useState } from "react";

interface QuantitySelectorProps {
  value: number;
  onChange: (newValue: number) => void;
  step?: number;
  min?: number;
}

export function QuantitySelector({
  value,
  onChange,
  step = 1,
  min = 0.1,
}: QuantitySelectorProps) {
  const [inputValue, setInputValue] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const handleIncrease = () => {
    const newValue = Math.round((value + step) * 10) / 10;
    onChange(newValue);
  };

  const handleDecrease = () => {
    const newValue = Math.round((value - step) * 10) / 10;
    if (newValue >= min) {
      onChange(newValue);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newInputValue = e.target.value;

    // Erlaube Kommazahlen: Ersetze Komma durch Punkt und erlaube mehrere Dezimalstellen
    newInputValue = newInputValue.replace(",", ".");

    // Erlaube Zahlen mit beliebig vielen Dezimalstellen, aber keine Buchstaben
    if (/^\d*\.?\d*$/.test(newInputValue)) {
      setInputValue(newInputValue);

      // Nur bei gültigen Zahlen sofort speichern
      if (
        newInputValue !== "" &&
        newInputValue !== "." &&
        newInputValue !== "0."
      ) {
        const newValue = parseFloat(newInputValue);
        if (!isNaN(newValue) && newValue >= min) {
          onChange(newValue);
        }
      }
    }
  };

  const handleInputFocus = () => {
    setIsEditing(true);
    setInputValue(formatDisplayValue(value));
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    setInputValue("");

    // Wenn das Feld leer ist oder ungültige Werte enthält, setze auf 1
    if (inputValue === "" || inputValue === "." || inputValue === "0.") {
      onChange(1);
      return;
    }

    const newValue = parseFloat(inputValue);

    // Wenn ungültige Zahl oder unter Mindestwert, setze auf 1
    if (isNaN(newValue) || newValue < min) {
      onChange(1);
    } else {
      // Gültige Zahl bleibt unverändert
      onChange(newValue);
    }
  };

  const formatDisplayValue = (val: number): string => {
    // Zeige Kommazahlen mit Komma an, aber entferne unnötige Nullen
    const formatted = val.toString();
    if (formatted.includes(".")) {
      return formatted.replace(".", ",").replace(/0+$/, "").replace(/,$/, "");
    }
    return formatted;
  };

  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        onClick={handleDecrease}
        className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-sm font-medium transition-colors hover:bg-zinc-300 dark:hover:bg-zinc-600 touch-manipulation"
      >
        −
      </button>
      <input
        type="text"
        value={isEditing ? inputValue : formatDisplayValue(value)}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        className="w-9 h-7 text-center text-xs font-bold rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        placeholder="1"
      />
      <button
        type="button"
        onClick={handleIncrease}
        className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-sm font-medium transition-colors hover:bg-zinc-300 dark:hover:bg-zinc-600 touch-manipulation"
      >
        +
      </button>
    </div>
  );
}
