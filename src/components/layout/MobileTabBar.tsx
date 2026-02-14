import { Link, useLocation } from "react-router-dom";
import type { JSX } from "react";
import { useFeatureAccess } from "../../hooks/useFeatureAccess";

type Tab = {
  to: string;
  label: string;
  icon: (active: boolean) => JSX.Element;
  requiresFeature?: keyof ReturnType<typeof useFeatureAccess>;
};

const tabs: Tab[] = [
  {
    to: "/day-planning",
    label: "Plan",
    icon: (active) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`h-6 w-6 ${
          active ? "text-primary" : "text-muted-foreground"
        }`}
      >
        <path d="M6.75 3A2.25 2.25 0 004.5 5.25v13.5A2.25 2.25 0 006.75 21h10.5A2.25 2.25 0 0019.5 18.75V5.25A2.25 2.25 0 0017.25 3H6.75zM6 8.25h12v9.75a.75.75 0 01-.75.75H6.75A.75.75 0 016 18V8.25z" />
      </svg>
    ),
  },
  {
    to: "/dishes",
    label: "Gerichte",
    icon: (active) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className={`h-6 w-6 ${
          active ? "text-primary" : "text-muted-foreground"
        }`}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 3h18M9 7h6M4 10h16M4 14h16M4 18h16"
        />
      </svg>
    ),
  },
  {
    to: "/porridge",
    label: "Porridge",
    requiresFeature: "porridgeCalculator",
    icon: (active) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`h-6 w-6 ${
          active ? "text-primary" : "text-muted-foreground"
        }`}
      >
        <path d="M12 2a7 7 0 00-7 7v1H4a2 2 0 00-2 2v1a9 9 0 009 9h2a9 9 0 009-9v-1a2 2 0 00-2-2h-1V9a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    to: "/profile",
    label: "Profil",
    icon: (active) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`h-6 w-6 ${
          active ? "text-primary" : "text-muted-foreground"
        }`}
      >
        <path d="M12 2a5 5 0 100 10 5 5 0 000-10zm-7 18a7 7 0 0114 0H5z" />
      </svg>
    ),
  },
];

export const MobileTabBar = () => {
  const location = useLocation();
  const featureAccess = useFeatureAccess();

  // Filtere Tabs basierend auf Feature-Zugriff
  const visibleTabs = tabs.filter((tab) => {
    if (!tab.requiresFeature) return true;
    return featureAccess[tab.requiresFeature];
  });

  return (
    <nav
      className="md:hidden"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        backgroundColor: "hsl(var(--background))",
        borderTop: "1px solid hsl(var(--border))",
        boxShadow: "0 -1px 2px rgba(0,0,0,0.04), 0 -4px 12px rgba(0,0,0,0.06)",
        width: "100vw",
        height: "auto",
        minHeight: "60px",
        display: "grid",
        gridTemplateColumns: `repeat(${visibleTabs.length}, 1fr)`,
        visibility: "visible",
        opacity: 1,
        transform: "none",
        transition: "none",
      }}
      role="tablist"
      aria-label="Hauptnavigation"
    >
      {visibleTabs.map((tab) => {
        const active =
          location.pathname === tab.to ||
          (tab.to !== "/day-planning" && location.pathname.startsWith(tab.to));
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={`flex flex-col items-center justify-center gap-1 py-2 text-xs ${
              active ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {tab.icon(active)}
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
