import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

/**
 * Nirbhoy Theme System
 * --------------------
 * Light/Dark theme toggle with localStorage persistence.
 * Default is dark. Theme is applied via `data-theme` attribute on <html>.
 */

export type Theme = "dark" | "light";

const STORAGE_KEY = "nirbhoy:theme";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount (avoids SSR mismatch)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (saved === "light" || saved === "dark") {
        setThemeState(saved);
        document.documentElement.setAttribute("data-theme", saved);
      } else {
        // Default: respect system preference, fall back to dark
        const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
        const initial = prefersLight ? "light" : "dark";
        setThemeState(initial);
        document.documentElement.setAttribute("data-theme", initial);
      }
    } catch {
      document.documentElement.setAttribute("data-theme", "dark");
    }
    setHydrated(true);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch { /* ignore */ }
    document.documentElement.setAttribute("data-theme", t);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  // Listen for system preference changes when no user preference is stored
  useEffect(() => {
    if (hydrated) return; // user preference already applied
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const handler = (e: MediaQueryListEvent) => {
      try {
        // Only auto-switch if user hasn't explicitly set a preference
        if (!localStorage.getItem(STORAGE_KEY)) {
          const t = e.matches ? "light" : "dark";
          setThemeState(t);
          document.documentElement.setAttribute("data-theme", t);
        }
      } catch { /* ignore */ }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [hydrated]);

  // Prevent flash of wrong theme: set data-theme immediately if stored
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (saved === "light" || saved === "dark") {
        document.documentElement.setAttribute("data-theme", saved);
      }
    } catch { /* ignore */ }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}