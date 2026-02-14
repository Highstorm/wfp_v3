import { Link, useLocation } from "react-router-dom";
import { useFeatureAccess } from "../../hooks/useFeatureAccess";
import { cn } from "../../lib/utils";
import {
  CalendarDays,
  ChefHat,
  UtensilsCrossed,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Tab = {
  to: string;
  label: string;
  icon: LucideIcon;
  requiresFeature?: keyof ReturnType<typeof useFeatureAccess>;
};

const tabs: Tab[] = [
  {
    to: "/day-planning",
    label: "Plan",
    icon: CalendarDays,
  },
  {
    to: "/dishes",
    label: "Gerichte",
    icon: ChefHat,
  },
  {
    to: "/porridge",
    label: "Porridge",
    requiresFeature: "porridgeCalculator",
    icon: UtensilsCrossed,
  },
  {
    to: "/profile",
    label: "Profil",
    icon: User,
  },
];

export const MobileTabBar = () => {
  const location = useLocation();
  const featureAccess = useFeatureAccess();

  const visibleTabs = tabs.filter((tab) => {
    if (!tab.requiresFeature) return true;
    return featureAccess[tab.requiresFeature];
  });

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background shadow-soft md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      role="tablist"
      aria-label="Hauptnavigation"
    >
      <div
        className="grid min-h-[60px]"
        style={{
          gridTemplateColumns: `repeat(${visibleTabs.length}, 1fr)`,
        }}
      >
        {visibleTabs.map((tab) => {
          const active =
            location.pathname === tab.to ||
            (tab.to !== "/day-planning" &&
              location.pathname.startsWith(tab.to));
          const Icon = tab.icon;

          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors cursor-pointer",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              role="tab"
              aria-selected={active}
            >
              <Icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
