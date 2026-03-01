import { auth } from "../../lib/firebase";
import { NutritionGoalsForm } from "../meal-planning/NutritionGoalsForm";
import { UserSettingsForm } from "./UserSettingsForm";

export const ProfilePage = () => {
  if (!auth.currentUser) {
    return (
      <div className="container mx-auto px-4 py-6 pb-20 md:pb-6">
        <div className="text-center text-muted-foreground">
          Bitte melde dich an, um dein Profil zu bearbeiten.
        </div>
      </div>
    );
  }

  const displayName = auth.currentUser.displayName || "Benutzer";
  const email = auth.currentUser.email || "";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="container mx-auto px-4 py-4 pb-20 md:pb-6 max-w-lg md:max-w-none">
      {/* Avatar Section */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center mx-auto mb-3">
          <span className="font-display font-bold text-2xl">{initials}</span>
        </div>
        <h1 className="font-display font-extrabold text-xl">{displayName}</h1>
        <p className="text-sm text-muted-foreground">{email}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
        <NutritionGoalsForm />
        <UserSettingsForm />
      </div>
    </div>
  );
};
