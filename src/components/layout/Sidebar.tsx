import { Link, useLocation } from "react-router-dom";
import { cn } from "../../lib/utils";
import { useFeatureAccess } from "../../hooks/useFeatureAccess";
import {
    CalendarDays,
    ChefHat,
    UtensilsCrossed,
    User,
    LogOut
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { logger } from "../../utils/logger";

export const Sidebar = () => {
    const location = useLocation();
    const featureAccess = useFeatureAccess();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            // Navigate handling is usually done by auth listener but safe to have
        } catch (error) {
            logger.error("Error signing out:", error);
        }
    };

    const menuItems = [
        {
            to: "/day-planning",
            label: "Tagesplanung",
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
            icon: UtensilsCrossed,
            requiresFeature: "porridgeCalculator" as keyof ReturnType<typeof useFeatureAccess>,
        },
        {
            to: "/profile",
            label: "Profil",
            icon: User,
        }
    ];

    return (
        <aside className="hidden border-r bg-card md:flex md:w-64 md:flex-col min-h-screen sticky top-0 h-screen">
            <div className="p-6 border-b">
                <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary">
                    <UtensilsCrossed className="w-6 h-6" />
                    <span>Food Planner</span>
                </Link>
            </div>

            <nav className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-2">
                {menuItems.map((item) => {
                    if (item.requiresFeature && !featureAccess?.[item.requiresFeature]) return null;

                    const isActive = location.pathname === item.to || (item.to !== "/day-planning" && location.pathname.startsWith(item.to));

                    return (
                        <Link
                            key={item.to}
                            to={item.to}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t">
                <button
                    onClick={handleLogout}
                    className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                    )}
                >
                    <LogOut className="h-4 w-4" />
                    Abmelden
                </button>
            </div>
        </aside>
    );
};
