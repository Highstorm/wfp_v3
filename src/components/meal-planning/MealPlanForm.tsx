import { WeekCalendar } from "./WeekCalendar";
import { DeleteConfirmDialog } from "../shared/DeleteConfirmDialog";
import { ResetConfirmDialog } from "../shared/ResetConfirmDialog";
import { NutritionSummary } from "./NutritionSummary";
import { MealSection } from "./MealSection";
import { SportSection } from "./SportSection";
import { SnacksAndExtrasSection } from "./SnacksAndExtrasSection";
import { MealPlanActions } from "./MealPlanActions";
import { WeeklyNutritionGoalsForm } from "./WeeklyNutritionGoalsForm";
import { useMealPlanFormState } from "../../hooks/useMealPlanFormState";
import { useMealPlanActions } from "../../hooks/useMealPlanActions";
import { useIntervalsSync } from "../../hooks/useIntervalsSync";
import { calculateTotalBurnedCalories } from "../../utils/nutrition.utils";

export const MealPlanForm = () => {
  const state = useMealPlanFormState();
  const actions = useMealPlanActions(state);
  const { handleLoadIntervalsActivities } = useIntervalsSync(
    state,
    actions.handleAddSportActivity
  );

  const {
    date,
    weekStartDate,
    mealPlan,
    message,
    selectedMeal,
    searchTerm,
    showDishList,
    showSnacksDishList,
    deleteConfirmDialog,
    resetConfirmDialog,
    expandedRecipes,
    stomachPainTrackingEnabled,
    weeklyNutritionGoalsEnabled,
    dailyNoteEnabled,
    sportEnabled,
    isDishesLoading,
    isMealPlanLoading,
    isCreating,
    isUpdating,
    isDeleting,
    combinedNutritionGoals,
    setDeleteConfirmDialog,
    setResetConfirmDialog,
    calculateTotalNutrition,
    getCategoryFilteredDishes,
    mealSections,
  } = state;

  const {
    handleDateChange,
    handleInputFocus,
    handleInputBlur,
    handleAddDish,
    handleRemoveDish,
    handleUpdateDishQuantity,
    handleAddSportActivity,
    handleRemoveSportActivity,
    handleAddTemporaryMeal,
    handleRemoveTemporaryMeal,
    handleStomachPainChange,
    handleDailyNoteChange,
    toggleRecipe,
    handleSave,
    handleDelete,
    handleReset,
  } = actions;

  if (isDishesLoading || isMealPlanLoading) {
    return (
      <div className="container mx-auto p-2 sm:p-4">
        <div className="card p-8">
          <p className="text-center text-muted-foreground">Lade Daten...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-2 pb-20 md:pb-4 max-w-lg md:max-w-none">
      {/* Week Calendar */}
      <div className="py-2">
        <WeekCalendar selectedDate={date} onDateSelect={handleDateChange} />
      </div>

      {/* Weekly Nutrition Goals */}
      {weeklyNutritionGoalsEnabled && (
        <div className="py-2">
          <WeeklyNutritionGoalsForm weekStartDate={weekStartDate} />
        </div>
      )}

      {/* Nutrition Hero + Macro Bar */}
      <NutritionSummary
        currentNutrition={calculateTotalNutrition()}
        nutritionGoals={combinedNutritionGoals}
        burnedCalories={calculateTotalBurnedCalories(mealPlan.sports || [])}
      />

      {/* Meals */}
      <div className="space-y-6 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mealSections.map((section, index) => (
            <div
              key={section.key}
              className={
                index === 0
                  ? "relative z-[60]"
                  : index === 1
                  ? "relative z-[59]"
                  : "relative z-[58]"
              }
            >
              <MealSection
                title={section.title}
                dishes={section.dishes || []}
                searchTerm={searchTerm}
                selectedMeal={selectedMeal}
                sectionKey={section.key}
                showDishList={showDishList}
                availableDishes={getCategoryFilteredDishes(section.key)}
                expandedRecipes={expandedRecipes}
                onInputFocus={handleInputFocus}
                onInputBlur={handleInputBlur}
                onSearchTermChange={state.setSearchTerm}
                onAddDish={(dish) => {
                  handleAddDish(dish);
                  state.setSearchTerm("");
                  state.setShowDishList(false);
                }}
                onRemoveDish={(dishId) =>
                  handleRemoveDish(section.key, dishId)
                }
                onToggleRecipe={toggleRecipe}
                onUpdateDishQuantity={handleUpdateDishQuantity}
              />
            </div>
          ))}
        </div>

        {/* Snacks & Extras */}
        <div className="relative z-40">
          <SnacksAndExtrasSection
            dishes={mealPlan.snacks || []}
            temporaryMeals={mealPlan.temporaryMeals || []}
            searchTerm={selectedMeal === "snacks" ? searchTerm : ""}
            showDishList={showSnacksDishList}
            availableDishes={getCategoryFilteredDishes("snacks")}
            expandedRecipes={expandedRecipes}
            onInputFocus={() => handleInputFocus("snacks")}
            onInputBlur={handleInputBlur}
            onSearchTermChange={state.setSearchTerm}
            onAddDish={(dish) => {
              handleAddDish(dish);
              state.setSearchTerm("");
              state.setShowSnacksDishList(false);
            }}
            onRemoveDish={(dishId) => handleRemoveDish("snacks", dishId)}
            onToggleRecipe={toggleRecipe}
            onAddTemporaryMeal={handleAddTemporaryMeal}
            onRemoveTemporaryMeal={handleRemoveTemporaryMeal}
            onUpdateDishQuantity={handleUpdateDishQuantity}
          />
        </div>

        {/* Sport */}
        {sportEnabled && (
          <div className="relative z-30">
            <SportSection
              activities={mealPlan.sports || []}
              onAddActivity={handleAddSportActivity}
              onRemoveActivity={handleRemoveSportActivity}
              onLoadIntervalsActivities={handleLoadIntervalsActivities}
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6">
        <MealPlanActions
          mealPlan={mealPlan}
          isCreating={isCreating}
          isUpdating={isUpdating}
          isDeleting={isDeleting}
          message={message}
          onSave={handleSave}
          onReset={() =>
            setResetConfirmDialog({ isOpen: true, planDate: date })
          }
          onDelete={() =>
            setDeleteConfirmDialog({ isOpen: true, planDate: date })
          }
          onDailyNoteChange={handleDailyNoteChange}
          onStomachPainChange={handleStomachPainChange}
          stomachPainTrackingEnabled={stomachPainTrackingEnabled}
          dailyNoteEnabled={dailyNoteEnabled}
        />
      </div>

      <DeleteConfirmDialog
        isOpen={deleteConfirmDialog.isOpen}
        planDate={deleteConfirmDialog.planDate}
        onConfirm={handleDelete}
        onCancel={() =>
          setDeleteConfirmDialog({ isOpen: false, planDate: "" })
        }
        isDeleting={isDeleting}
      />

      <ResetConfirmDialog
        isOpen={resetConfirmDialog.isOpen}
        planDate={resetConfirmDialog.planDate}
        onConfirm={handleReset}
        onCancel={() =>
          setResetConfirmDialog({ isOpen: false, planDate: "" })
        }
      />
    </div>
  );
};
