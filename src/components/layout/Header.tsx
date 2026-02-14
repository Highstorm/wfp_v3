import { Fragment } from "react";
import { Link } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useFeatureAccess } from "../../hooks/useFeatureAccess";
import { logger } from "../../utils/logger";
import { ThemeToggle } from "./ThemeToggle";
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from "@headlessui/react";
import {
  Menu as MenuIcon,
  CalendarDays,
  ChefHat,
  UtensilsCrossed,
  User,
  LogOut,
} from "lucide-react";

export const Header = () => {
  const featureAccess = useFeatureAccess();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      logger.error("Error signing out:", error);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xs md:hidden">
      <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between">
          <Link
            to="/day-planning"
            className="font-heading text-lg font-bold tracking-tight text-foreground"
          >
            Weekly Food Planner
          </Link>

          <div className="flex items-center gap-1">
            <ThemeToggle />

            <Menu as="div" className="relative">
              <MenuButton
                className="inline-flex items-center justify-center rounded-md p-2 text-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Menue oeffnen"
              >
                <MenuIcon className="h-5 w-5" />
              </MenuButton>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-normal"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-fast"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <MenuItems className="absolute right-0 top-full mt-2 w-56 origin-top-right rounded-lg border border-border bg-card p-1.5 shadow-glass focus:outline-none">
                  <MenuItem>
                    <Link
                      to="/day-planning"
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground data-[focus]:bg-accent data-[focus]:text-accent-foreground transition-colors"
                    >
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      Tagesplanung
                    </Link>
                  </MenuItem>
                  <MenuItem>
                    <Link
                      to="/dishes"
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground data-[focus]:bg-accent data-[focus]:text-accent-foreground transition-colors"
                    >
                      <ChefHat className="h-4 w-4 text-muted-foreground" />
                      Meine Gerichte
                    </Link>
                  </MenuItem>
                  {featureAccess.porridgeCalculator && (
                    <MenuItem>
                      <Link
                        to="/porridge"
                        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground data-[focus]:bg-accent data-[focus]:text-accent-foreground transition-colors"
                      >
                        <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                        Porridge Calculator
                      </Link>
                    </MenuItem>
                  )}
                  <MenuItem>
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground data-[focus]:bg-accent data-[focus]:text-accent-foreground transition-colors"
                    >
                      <User className="h-4 w-4 text-muted-foreground" />
                      Profil
                    </Link>
                  </MenuItem>

                  <div className="my-1 border-t border-border" />

                  <MenuItem>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-destructive data-[focus]:bg-destructive/10 transition-colors cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      Abmelden
                    </button>
                  </MenuItem>
                </MenuItems>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>
    </header>
  );
};
