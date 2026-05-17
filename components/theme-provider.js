"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const THEME_STORAGE_KEY = "qrstudio.theme";

const ThemeContext = createContext(null);

function getSystemPrefersDark() {
  if (typeof window === "undefined") return true;
  return Boolean(window.matchMedia?.("(prefers-color-scheme: dark)")?.matches);
}

function getStoredTheme() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.documentElement.classList.toggle("dark", isDark);
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const stored = getStoredTheme();
    const next = stored === "light" || stored === "dark" ? stored : getSystemPrefersDark() ? "dark" : "light";
    setTheme(next);
    applyTheme(next);

    const mql = window.matchMedia?.("(prefers-color-scheme: dark)");
    const onChange = () => {
      const currentStored = getStoredTheme();
      if (currentStored === "light" || currentStored === "dark") return;
      const sys = mql?.matches ? "dark" : "light";
      setTheme(sys);
      applyTheme(sys);
    };
    mql?.addEventListener?.("change", onChange);
    return () => mql?.removeEventListener?.("change", onChange);
  }, []);

  const api = useMemo(
    () => ({
      theme,
      setTheme: (next) => {
        const val = next === "dark" ? "dark" : "light";
        setTheme(val);
        applyTheme(val);
        try {
          localStorage.setItem(THEME_STORAGE_KEY, val);
        } catch {}
      },
      toggle: () => {
        const next = theme === "dark" ? "light" : "dark";
        try {
          localStorage.setItem(THEME_STORAGE_KEY, next);
        } catch {}
        setTheme(next);
        applyTheme(next);
      },
    }),
    [theme],
  );

  return <ThemeContext.Provider value={api}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

