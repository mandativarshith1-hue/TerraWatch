import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { ThemeMode } from "@/types";

interface ThemeContextValue {
  mode: ThemeMode;
  toggle: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem("terrwatch-theme");
    return (saved as ThemeMode) ?? "dark";
  });

  useEffect(() => {
    localStorage.setItem("terrwatch-theme", mode);
    document.documentElement.classList.toggle("light-mode", mode === "light");
  }, [mode]);

  const toggle = () => setMode((m) => (m === "dark" ? "light" : "dark"));

  return <ThemeContext.Provider value={{ mode, toggle, setMode }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
