import { useEffect, useState } from "react";

function getSystemPrefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

export const ThemeToggle = () => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark") return true;
    if (stored === "light") return false;
    return getSystemPrefersDark();
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  return (
    <button
      aria-label="Designmodus umschalten"
      className="btn-ghost h-10 w-10 p-2"
      onClick={() => setIsDark((v) => !v)}
    >
      {isDark ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-5 w-5"
        >
          <path d="M21.64 13a9 9 0 11-10.63-10.6 1 1 0 01.9 1.45A7 7 0 0019.16 12a1 1 0 01.86 1.47 9 9 0 001.62-.47z" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-5 w-5"
        >
          <path d="M12 18a6 6 0 100-12 6 6 0 000 12zm0 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm0-22a1 1 0 01-1-1V-2a1 1 0 112 0v1a1 1 0 01-1 1zM22 11a1 1 0 011 1 1 1 0 01-1 1h-1a1 1 0 110-2h1zM3 12a1 1 0 01-1 1H1a1 1 0 110-2h1a1 1 0 011 1zm16.95 6.36a1 1 0 010 1.41l-.71.71a1 1 0 11-1.41-1.41l.71-.71a1 1 0 011.41 0zM5.17 5.17a1 1 0 010 1.41l-.71.71A1 1 0 113.05 5.9l.71-.71a1 1 0 011.41 0zM5.17 18.83a1 1 0 010-1.41l.71-.71a1 1 0 111.41 1.41l-.71.71a1 1 0 01-1.41 0zM18.83 5.17a1 1 0 00-1.41 0l-.71.71a1 1 0 101.41 1.41l.71-.71a1 1 0 000-1.41z" />
        </svg>
      )}
    </button>
  );
};
