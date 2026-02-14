import { useState, useEffect } from "react";
import { porridgeConfig } from "../../lib/porridgeConfig";
import { useCreateDish } from "../../hooks/useDishes";
import {
  useCreateMealPlan,
  useMealPlanByDate,
  useUpdateMealPlan,
} from "../../hooks/useMealPlans";
import { useToast } from "../../lib/toast";

interface FruitSelection {
  name: string;
  amount: number;
  selected: boolean;
}

export const PorridgeCalculator = () => {
  const [selectedLiquid, setSelectedLiquid] = useState(
    porridgeConfig.defaults.liquid.type
  );
  const [liquidAmount, setLiquidAmount] = useState(
    porridgeConfig.defaults.liquid.amount
  );
  const [oatsAmount, setOatsAmount] = useState(
    porridgeConfig.defaults.oats.amount
  );
  const [peanutButterAmount, setPeanutButterAmount] = useState(
    porridgeConfig.defaults.peanutButter.amount
  );
  const [selectedWheyProtein, setSelectedWheyProtein] = useState(
    porridgeConfig.defaults.wheyProtein.type
  );
  const [wheyProteinAmount, setWheyProteinAmount] = useState(
    porridgeConfig.defaults.wheyProtein.amount
  );
  const [fruits, setFruits] = useState<FruitSelection[]>(
    Object.entries(porridgeConfig.defaults.fruits).map(([name, config]) => ({
      name,
      amount: config.amount,
      selected: config.selected,
    }))
  );

  const [totalNutrition, setTotalNutrition] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });

  const { data: existingMealPlan } = useMealPlanByDate(
    new Date().toISOString().split("T")[0]
  );
  const { mutate: createMealPlan } = useCreateMealPlan();
  const { mutate: updateMealPlan } = useUpdateMealPlan();
  const { mutate: createDish } = useCreateDish();
  const { showToast } = useToast();

  useEffect(() => {
    calculateNutrition();
  }, [
    selectedLiquid,
    liquidAmount,
    oatsAmount,
    fruits,
    selectedWheyProtein,
    wheyProteinAmount,
    peanutButterAmount,
  ]);

  const calculateNutrition = () => {
    let total = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    };

    // Liquid nutrition
    const liquidPer100ml = porridgeConfig.liquids[selectedLiquid];
    total.calories += (liquidPer100ml.calories * liquidAmount) / 100;
    total.protein += (liquidPer100ml.protein * liquidAmount) / 100;
    total.carbs += (liquidPer100ml.carbs * liquidAmount) / 100;
    total.fat += (liquidPer100ml.fat * liquidAmount) / 100;

    // Oats nutrition
    total.calories += (porridgeConfig.oats.calories * oatsAmount) / 100;
    total.protein += (porridgeConfig.oats.protein * oatsAmount) / 100;
    total.carbs += (porridgeConfig.oats.carbs * oatsAmount) / 100;
    total.fat += (porridgeConfig.oats.fat * oatsAmount) / 100;

    // Peanut butter nutrition
    if (peanutButterAmount > 0) {
      total.calories +=
        (porridgeConfig.peanutButter.calories * peanutButterAmount) / 100;
      total.protein +=
        (porridgeConfig.peanutButter.protein * peanutButterAmount) / 100;
      total.carbs +=
        (porridgeConfig.peanutButter.carbs * peanutButterAmount) / 100;
      total.fat += (porridgeConfig.peanutButter.fat * peanutButterAmount) / 100;
    }

    // Fruits nutrition
    fruits.forEach((fruit) => {
      if (fruit.selected) {
        const fruitNutrition = porridgeConfig.fruits[fruit.name];
        total.calories += (fruitNutrition.calories * fruit.amount) / 100;
        total.protein += (fruitNutrition.protein * fruit.amount) / 100;
        total.carbs += (fruitNutrition.carbs * fruit.amount) / 100;
        total.fat += (fruitNutrition.fat * fruit.amount) / 100;
      }
    });

    // Whey protein nutrition
    if (selectedWheyProtein) {
      const proteinNutrition = porridgeConfig.wheyProtein[selectedWheyProtein];
      total.calories += (proteinNutrition.calories * wheyProteinAmount) / 100;
      total.protein += (proteinNutrition.protein * wheyProteinAmount) / 100;
      total.carbs += (proteinNutrition.carbs * wheyProteinAmount) / 100;
      total.fat += (proteinNutrition.fat * wheyProteinAmount) / 100;
    }

    setTotalNutrition(total);
  };

  const toggleFruit = (index: number) => {
    const newFruits = [...fruits];
    newFruits[index].selected = !newFruits[index].selected;
    setFruits(newFruits);
  };

  const updateFruitAmount = (index: number, amount: number) => {
    const newFruits = [...fruits];
    newFruits[index].amount = amount;
    setFruits(newFruits);
  };

  const addToDayPlanning = () => {
    const today = new Date().toISOString().split("T")[0];
    const formattedDate = new Date().toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    // Erstelle das Rezept mit den Zutaten
    const ingredients = [];

    // Flüssigkeit
    if (liquidAmount > 0) {
      ingredients.push(
        `${porridgeConfig.liquids[selectedLiquid].label}: ${liquidAmount}ml`
      );
    }

    // Haferflocken
    if (oatsAmount > 0) {
      ingredients.push(`Haferflocken: ${oatsAmount}g`);
    }

    // Erdnussbutter
    if (peanutButterAmount > 0) {
      ingredients.push(`Erdnussbutter: ${peanutButterAmount}g`);
    }

    // Whey Protein
    if (wheyProteinAmount > 0) {
      ingredients.push(
        `${porridgeConfig.wheyProtein[selectedWheyProtein].label}: ${wheyProteinAmount}g`
      );
    }

    // Obst
    fruits.forEach((fruit) => {
      if (fruit.selected && fruit.amount > 0) {
        ingredients.push(
          `${porridgeConfig.fruits[fruit.name].label}: ${fruit.amount}g`
        );
      }
    });

    const recipe = ingredients.join("\n");

    // Erstelle den Dish
    const porridgeDish = {
      name: `Frühstücksporridge (${formattedDate})`,
      calories: Math.round(totalNutrition.calories),
      protein: Math.round(totalNutrition.protein * 10) / 10,
      carbs: Math.round(totalNutrition.carbs * 10) / 10,
      fat: Math.round(totalNutrition.fat * 10) / 10,
      recipe: recipe,
      category: "breakfast" as const,
    };

    // Erstelle den Dish in der Datenbank
    createDish(porridgeDish, {
      onSuccess: (createdDish) => {
        if (existingMealPlan) {
          // Aktualisiere den bestehenden MealPlan
          const updatedMealPlan = {
            ...existingMealPlan,
            breakfast: [...existingMealPlan.breakfast, createdDish],
            updatedAt: new Date(),
          };
          updateMealPlan(updatedMealPlan, {
            onSuccess: () => {
              showToast({
                type: "success",
                message: "Porridge wurde erfolgreich zum Tagesplan hinzugefügt",
              });
            },
            onError: (error) => {
              console.error("Fehler beim Hinzufügen zum Tagesplan:", error);
              showToast({
                type: "error",
                message: "Fehler beim Hinzufügen zum Tagesplan",
              });
            },
          });
        } else {
          // Erstelle einen neuen MealPlan
          const newMealPlan = {
            date: today,
            breakfast: [createdDish],
            lunch: [],
            dinner: [],
            snacks: [],
            sports: [],
            temporaryMeals: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            dailyNote: "",
          };
          createMealPlan(newMealPlan, {
            onSuccess: () => {
              showToast({
                type: "success",
                message: "Neuer Tagesplan mit Porridge wurde erstellt",
              });
            },
            onError: (error) => {
              console.error("Fehler beim Erstellen des Tagesplans:", error);
              showToast({
                type: "error",
                message: "Fehler beim Erstellen des Tagesplans",
              });
            },
          });
        }
      },
      onError: (error) => {
        console.error("Fehler beim Erstellen des Porridge-Dishes:", error);
        showToast({
          type: "error",
          message: "Fehler beim Erstellen des Porridge-Dishes",
        });
      },
    });
  };

  return (
    <div className="container mx-auto px-4 py-6 pb-20 md:pb-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Porridge Calculator</h1>

        <div className="space-y-6">
          {/* Liquid Selection */}
          <div className="card p-4">
            <h2 className="text-lg font-semibold mb-4">Flüssigkeit</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {Object.keys(porridgeConfig.liquids).map((liquid) => (
                <button
                  key={liquid}
                  onClick={() => setSelectedLiquid(liquid)}
                  className={`p-2 rounded-lg border transition-colors ${
                    selectedLiquid === liquid
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-accent border-border"
                  }`}
                >
                  {porridgeConfig.liquids[liquid].label}
                </button>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Menge (ml)
              </label>
              <input
                type="number"
                value={liquidAmount}
                onChange={(e) => setLiquidAmount(Number(e.target.value))}
                className="input"
              />
            </div>
          </div>

          {/* Oats Amount */}
          <div className="card p-4">
            <h2 className="text-lg font-semibold mb-4">Haferflocken</h2>
            <div>
              <label className="block text-sm font-medium mb-2">
                Menge (g)
              </label>
              <input
                type="number"
                value={oatsAmount}
                onChange={(e) => setOatsAmount(Number(e.target.value))}
                className="input"
              />
            </div>
          </div>

          {/* Peanut Butter Amount */}
          <div className="card p-4">
            <h2 className="text-lg font-semibold mb-4">Erdnussbutter</h2>
            <div>
              <label className="block text-sm font-medium mb-2">
                Menge (g)
              </label>
              <input
                type="number"
                value={peanutButterAmount}
                onChange={(e) => setPeanutButterAmount(Number(e.target.value))}
                className="input"
              />
            </div>
          </div>

          {/* Whey Protein Selection */}
          <div className="card p-4">
            <h2 className="text-lg font-semibold mb-4">Whey Protein</h2>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {Object.keys(porridgeConfig.wheyProtein).map((flavor) => (
                <button
                  key={flavor}
                  onClick={() => setSelectedWheyProtein(flavor)}
                  className={`p-2 rounded-lg border transition-colors ${
                    selectedWheyProtein === flavor
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-accent border-border"
                  }`}
                >
                  {porridgeConfig.wheyProtein[flavor].label}
                </button>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Menge (g)
              </label>
              <input
                type="number"
                value={wheyProteinAmount}
                onChange={(e) => setWheyProteinAmount(Number(e.target.value))}
                className="input"
              />
            </div>
          </div>

          {/* Fruits Selection */}
          <div className="card p-4">
            <h2 className="text-lg font-semibold mb-4">Obst</h2>
            <div className="space-y-3">
              {fruits.map((fruit, index) => (
                <div key={fruit.name} className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleFruit(index)}
                    className={`p-2 rounded-lg border transition-colors ${
                      fruit.selected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background hover:bg-accent border-border"
                    } ${fruit.selected ? "w-[30%]" : "w-full"}`}
                  >
                    {porridgeConfig.fruits[fruit.name].label}
                  </button>
                  {fruit.selected && (
                    <div className="w-[70%]">
                      <input
                        type="number"
                        value={fruit.amount}
                        onChange={(e) =>
                          updateFruitAmount(index, Number(e.target.value))
                        }
                        className="input"
                        placeholder="g"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Nutrition Summary */}
          <div className="card p-4">
            <h2 className="text-lg font-semibold mb-4">Nährwerte</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-muted-foreground">Kalorien</p>
                <p className="text-xl font-semibold">
                  {Math.round(totalNutrition.calories)} kcal
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Protein</p>
                <p className="text-xl font-semibold">
                  {Math.round(totalNutrition.protein * 10) / 10}g
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Kohlenhydrate</p>
                <p className="text-xl font-semibold">
                  {Math.round(totalNutrition.carbs * 10) / 10}g
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fett</p>
                <p className="text-xl font-semibold">
                  {Math.round(totalNutrition.fat * 10) / 10}g
                </p>
              </div>
            </div>
            <button onClick={addToDayPlanning} className="btn-primary w-full">
              Als Frühstück hinzufügen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
