"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { cn } from "../lib/utils";

type Props = {
  className?: string;
};

export function ThemeToggle({ className }: Props) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-brand-100/70 bg-white/80 px-3 py-2 text-xs font-semibold text-brand-800 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-700",
        className
      )}
      aria-label="تغییر تم"
    >
      <span
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-sm transition",
          "dark:from-slate-700 dark:to-slate-500"
        )}
      >
        {mounted ? (
          isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />
        ) : (
          <Sun className="h-4 w-4" />
        )}
      </span>
      <span className="hidden sm:inline">{mounted ? (isDark ? "حالت تیره" : "حالت روشن") : "در حال بارگذاری"}</span>
    </button>
  );
}
