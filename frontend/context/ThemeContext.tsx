"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (value: Theme) => void;
};

const STORAGE_KEY = "stylino-theme";

const ThemeContext = createContext<ThemeContextValue | null>(null);

const getStoredTheme = (): Theme | null => {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(STORAGE_KEY);
  return value === "dark" || value === "light" ? value : null;
};

const getSystemTheme = (): Theme | null => {
  if (typeof window === "undefined" || !window.matchMedia) return null;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const getTimeFallback = (): Theme => {
  const hour = new Date().getHours();
  return hour >= 7 && hour < 19 ? "light" : "dark";
};

const applyThemeClass = (theme: Theme) => {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme === "dark" ? "dark" : "light";
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  const resolveInitialTheme = useCallback((): Theme => {
    const stored = getStoredTheme();
    if (stored) return stored;
    const system = getSystemTheme();
    if (system) return system;
    return getTimeFallback();
  }, []);

  const setTheme = useCallback((value: Theme) => {
    setThemeState(value);
    if (typeof window !== "undefined") {
      applyThemeClass(value);
      window.localStorage.setItem(STORAGE_KEY, value);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === "light" ? "dark" : "light";
      if (typeof window !== "undefined") {
        applyThemeClass(next);
        window.localStorage.setItem(STORAGE_KEY, next);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const initial = resolveInitialTheme();
    setThemeState(initial);
    if (typeof window !== "undefined") {
      applyThemeClass(initial);
    }
  }, [resolveInitialTheme]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (getStoredTheme()) return;
      const next = media.matches ? "dark" : "light";
      setThemeState(next);
      applyThemeClass(next);
    };
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme,
      setTheme,
    }),
    [theme, toggleTheme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
