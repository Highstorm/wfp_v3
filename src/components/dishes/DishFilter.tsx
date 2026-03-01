import { useState } from "react";

interface FilterValues {
  name: string;
  minCalories: string;
  maxCalories: string;
  minProtein: string;
  maxProtein: string;
  minCarbs: string;
  maxCarbs: string;
  minFat: string;
  maxFat: string;
  category: string;
  minRating: string;
}

interface DishFilterProps {
  filters: FilterValues;
  onFilterChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
}

const categories = [
  { value: "", label: "Alle" },
  { value: "breakfast", label: "Frühstück" },
  { value: "mainDish", label: "Hauptgericht" },
  { value: "snack", label: "Snack" },
  { value: "uncategorized", label: "Ohne Kat." },
];

export const DishFilter = ({ filters, onFilterChange }: DishFilterProps) => {
  const [isNutrientsVisible, setIsNutrientsVisible] = useState(false);

  const handleCategoryClick = (value: string) => {
    const syntheticEvent = {
      target: { name: "category", value },
    } as React.ChangeEvent<HTMLSelectElement>;
    onFilterChange(syntheticEvent);
  };

  return (
    <div className="space-y-3 mb-4">
      {/* Round search bar */}
      <div className="relative">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          name="name"
          value={filters.name}
          onChange={onFilterChange}
          className="w-full pl-11 pr-4 py-3 bg-zinc-100 dark:bg-zinc-800/50 rounded-full text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Gerichte durchsuchen..."
        />
      </div>

      {/* Category pill chips */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => handleCategoryClick(cat.value)}
            className={`
              px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors touch-manipulation
              ${filters.category === cat.value
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "bg-zinc-100 dark:bg-zinc-800/50 text-foreground hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }
            `}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Advanced filters toggle */}
      <div>
        <button
          onClick={() => setIsNutrientsVisible(!isNutrientsVisible)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {isNutrientsVisible ? "Erweiterte Filter ausblenden ↑" : "Erweiterte Filter ↓"}
        </button>

        {isNutrientsVisible && (
          <div className="mt-3 p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Bewertung</label>
                <select
                  name="minRating"
                  value={filters.minRating}
                  onChange={onFilterChange}
                  className="input text-sm"
                >
                  <option value="">Alle</option>
                  <option value="1">Min. 1 Stern</option>
                  <option value="2">Min. 2 Sterne</option>
                  <option value="3">Min. 3 Sterne</option>
                  <option value="4">Min. 4 Sterne</option>
                  <option value="5">5 Sterne</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Kalorien", min: "minCalories", max: "maxCalories" },
                { label: "Protein", min: "minProtein", max: "maxProtein" },
                { label: "KH", min: "minCarbs", max: "maxCarbs" },
                { label: "Fett", min: "minFat", max: "maxFat" },
              ].map((nutrient) => (
                <div key={nutrient.label}>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">{nutrient.label}</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      name={nutrient.min}
                      value={filters[nutrient.min as keyof FilterValues]}
                      onChange={onFilterChange}
                      className="input text-xs py-1.5"
                      placeholder="Min"
                    />
                    <input
                      type="number"
                      name={nutrient.max}
                      value={filters[nutrient.max as keyof FilterValues]}
                      onChange={onFilterChange}
                      className="input text-xs py-1.5"
                      placeholder="Max"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
