import { getAuth } from "firebase/auth";
import { NutritionGoalsForm } from "../meal-planning/NutritionGoalsForm";
import { UserSettingsForm } from "./UserSettingsForm";

export const ProfilePage = () => {
  const auth = getAuth();

  if (!auth.currentUser) {
    return (
      <div className="container mx-auto px-4 py-6 pb-20 md:pb-6">
        <div className="text-center text-muted-foreground">
          Bitte melde dich an, um dein Profil zu bearbeiten.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 lg:py-6 pb-20 md:pb-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-8 max-w-7xl mx-auto">
        <UserSettingsForm />
        <NutritionGoalsForm />
      </div>
    </div>
  );
};
