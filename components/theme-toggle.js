"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { useTheme } from "./theme-provider";

export default function ThemeToggle({ className = "" }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  const label = useMemo(() => {
    return isDark ? "Dark" : "Light";
  }, [isDark]);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      className={[
        "group relative inline-flex h-9 items-center gap-2 rounded-full px-3",
        "bg-white/10 text-white ring-1 ring-white/15 backdrop-blur-md",
        "transition hover:bg-white/15 dark:bg-black/20 dark:text-white dark:hover:bg-black/25",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70",
        className,
      ].join(" ")}
    >
      <span className="text-xs font-medium tracking-wide">{label}</span>
      <span className="relative h-5 w-9 rounded-full bg-black/25 ring-1 ring-white/15 dark:bg-white/10">
        <motion.span
          className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm"
          animate={{ x: isDark ? 16 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
        />
      </span>
    </button>
  );
}

