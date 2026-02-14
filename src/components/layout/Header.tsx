import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useFeatureAccess } from "../../hooks/useFeatureAccess";
import { logger } from "../../utils/logger";

export const Header = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const featureAccess = useFeatureAccess();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      logger.error("Error signing out:", error);
    }
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Schließe das Menü, wenn außerhalb geklickt wird
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const menu = document.getElementById("menu-dropdown");
      const menuButton = document.getElementById("menu-button");
      if (
        menu &&
        !menu.contains(event.target as Node) &&
        menuButton &&
        !menuButton.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-[100] border-b border-border bg-background/80 backdrop-blur-xs">
      <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between">
          <Link
            to="/day-planning"
            className="text-xl font-semibold tracking-tight"
            onClick={closeMenu}
          >
            Weekly Food Planner
          </Link>

          <div className="flex items-center gap-1">
            <div className="relative">
              <button
                id="menu-button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="btn-ghost h-10 w-10 p-2"
                aria-label="Menü öffnen"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>

              {isMenuOpen && (
                <div
                  id="menu-dropdown"
                  className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-border bg-background p-2 shadow-glass"
                >
                  <div className="flex flex-col">
                    <Link
                      to="/day-planning"
                      className="rounded-md px-3 py-2 text-sm hover:bg-accent"
                      onClick={closeMenu}
                    >
                      Tagesplanung
                    </Link>
                    <Link
                      to="/dishes"
                      className="rounded-md px-3 py-2 text-sm hover:bg-accent"
                      onClick={closeMenu}
                    >
                      Meine Gerichte
                    </Link>
                    {featureAccess.porridgeCalculator && (
                      <Link
                        to="/porridge"
                        className="rounded-md px-3 py-2 text-sm hover:bg-accent"
                        onClick={closeMenu}
                      >
                        Porridge Calculator
                      </Link>
                    )}
                    <Link
                      to="/profile"
                      className="rounded-md px-3 py-2 text-sm hover:bg-accent"
                      onClick={closeMenu}
                    >
                      Profil
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        closeMenu();
                      }}
                      className="btn-primary mt-2"
                    >
                      Abmelden
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
