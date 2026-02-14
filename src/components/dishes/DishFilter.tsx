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

export const DishFilter = ({ filters, onFilterChange }: DishFilterProps) => {
  const [isNutrientsVisible, setIsNutrientsVisible] = useState(false);

  return (
    <div className="card p-3 sm:p-4">
      {/* Immer sichtbare Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-3 sm:mb-4">
        <div>
          <label className="block text-sm sm:text-sm font-medium mb-1.5">
            Name
            <input
              type="text"
              name="name"
              value={filters.name}
              onChange={onFilterChange}
              className="input mt-1 text-base sm:text-sm"
              placeholder="Suche nach Namen"
            />
          </label>
        </div>
        <div>
          <label className="block text-sm sm:text-sm font-medium mb-1.5">
            Kategorie
            <select
              name="category"
              value={filters.category}
              onChange={onFilterChange}
              className="input mt-1 text-base sm:text-sm"
            >
              <option value="">Alle Kategorien</option>
              <option value="breakfast">Frühstück</option>
              <option value="mainDish">Mittag/Abendessen</option>
              <option value="snack">Snack/Sonstiges</option>
              <option value="uncategorized">Ohne Kategorie</option>
            </select>
          </label>
        </div>
        <div>
          <label className="block text-sm sm:text-sm font-medium mb-1.5">
            Bewertung
            <select
              name="minRating"
              value={filters.minRating}
              onChange={onFilterChange}
              className="input mt-1 text-base sm:text-sm"
            >
              <option value="">Alle Bewertungen</option>
              <option value="1">Mindestens 1 Stern</option>
              <option value="2">Mindestens 2 Sterne</option>
              <option value="3">Mindestens 3 Sterne</option>
              <option value="4">Mindestens 4 Sterne</option>
              <option value="5">5 Sterne</option>
            </select>
          </label>
        </div>
      </div>

      {/* Ausklappbare Nährwertfilter */}
      <div className="border-t border-border pt-3 sm:pt-4">
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <h3 className="text-sm sm:text-sm font-medium">Nährwertfilter</h3>
          <button
            onClick={() => setIsNutrientsVisible(!isNutrientsVisible)}
            className="text-primary p-2 -m-2 rounded-lg hover:bg-accent text-sm sm:text-sm transition-colors touch-manipulation min-h-[44px] sm:min-h-0"
          >
            {isNutrientsVisible ? "Filter ausblenden ↑" : "Filter anzeigen ↓"}
          </button>
        </div>

        {isNutrientsVisible && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm sm:text-sm font-medium mb-1.5">
                Kalorien
                <div className="flex gap-2 mt-1">
                  <input
                    type="number"
                    name="minCalories"
                    value={filters.minCalories}
                    onChange={onFilterChange}
                    className="input text-base sm:text-sm"
                    placeholder="Min"
                  />
                  <input
                    type="number"
                    name="maxCalories"
                    value={filters.maxCalories}
                    onChange={onFilterChange}
                    className="input text-base sm:text-sm"
                    placeholder="Max"
                  />
                </div>
              </label>
            </div>
            <div>
              <label className="block text-sm sm:text-sm font-medium mb-1.5">
                Protein
                <div className="flex gap-2 mt-1">
                  <input
                    type="number"
                    name="minProtein"
                    value={filters.minProtein}
                    onChange={onFilterChange}
                    className="input text-base sm:text-sm"
                    placeholder="Min"
                  />
                  <input
                    type="number"
                    name="maxProtein"
                    value={filters.maxProtein}
                    onChange={onFilterChange}
                    className="input text-base sm:text-sm"
                    placeholder="Max"
                  />
                </div>
              </label>
            </div>
            <div>
              <label className="block text-sm sm:text-sm font-medium mb-1.5">
                Fette
                <div className="flex gap-2 mt-1">
                  <input
                    type="number"
                    name="minFat"
                    value={filters.minFat}
                    onChange={onFilterChange}
                    className="input text-base sm:text-sm"
                    placeholder="Min"
                  />
                  <input
                    type="number"
                    name="maxFat"
                    value={filters.maxFat}
                    onChange={onFilterChange}
                    className="input text-base sm:text-sm"
                    placeholder="Max"
                  />
                </div>
              </label>
            </div>
            <div>
              <label className="block text-sm sm:text-sm font-medium mb-1.5">
                Kohlenhydrate
                <div className="flex gap-2 mt-1">
                  <input
                    type="number"
                    name="minCarbs"
                    value={filters.minCarbs}
                    onChange={onFilterChange}
                    className="input text-base sm:text-sm"
                    placeholder="Min"
                  />
                  <input
                    type="number"
                    name="maxCarbs"
                    value={filters.maxCarbs}
                    onChange={onFilterChange}
                    className="input text-base sm:text-sm"
                    placeholder="Max"
                  />
                </div>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
