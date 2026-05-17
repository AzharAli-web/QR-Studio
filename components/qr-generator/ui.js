"use client";

import { motion } from "framer-motion";

export function Card({ children, className = "", ...props }) {
  return (
    <motion.section
      whileHover={{ y: -3, scale: 1.005 }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
      className={[
        "group relative overflow-hidden rounded-3xl bg-white/60 p-5 ring-1 ring-black/5 backdrop-blur-xl",
        "shadow-sm shadow-black/5 transition-shadow",
        "hover:shadow-md hover:shadow-indigo-500/10",
        "dark:bg-black/30 dark:ring-white/10 dark:shadow-black/20",
        className,
      ].join(" ")}
      {...props}
    >
      <div className="pointer-events-none absolute -inset-14 opacity-0 blur-2xl transition duration-500 group-hover:opacity-100">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/18 via-fuchsia-500/10 to-cyan-400/14" />
      </div>
      {children}
    </motion.section>
  );
}

export function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-end justify-between gap-3">
        <div className="text-xs font-semibold tracking-wide text-zinc-950/90 dark:text-white/90">
          {label}
        </div>
        {hint ? (
          <div className="text-[11px] text-zinc-600 dark:text-zinc-300/70">{hint}</div>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function Input({ className = "", ...props }) {
  return (
    <motion.input
      whileFocus={{ scale: 1.012, y: -0.5 }}
      transition={{ type: "spring", stiffness: 520, damping: 40 }}
      className={[
        "h-11 w-full rounded-2xl px-3 text-sm",
        "bg-white/70 text-zinc-950 placeholder:text-zinc-500",
        "ring-1 ring-black/10 focus:outline-none focus:ring-2 focus:ring-indigo-400/70 focus:shadow-[0_0_0_4px_rgba(99,102,241,0.10)]",
        "dark:bg-white/5 dark:text-white dark:placeholder:text-zinc-400 dark:ring-white/10",
        className,
      ].join(" ")}
      {...props}
    />
  );
}

export function Textarea({ className = "", ...props }) {
  return (
    <motion.textarea
      whileFocus={{ scale: 1.012, y: -0.5 }}
      transition={{ type: "spring", stiffness: 520, damping: 40 }}
      className={[
        "min-h-28 w-full resize-y rounded-2xl px-3 py-3 text-sm",
        "bg-white/70 text-zinc-950 placeholder:text-zinc-500",
        "ring-1 ring-black/10 focus:outline-none focus:ring-2 focus:ring-indigo-400/70 focus:shadow-[0_0_0_4px_rgba(99,102,241,0.10)]",
        "dark:bg-white/5 dark:text-white dark:placeholder:text-zinc-400 dark:ring-white/10",
        className,
      ].join(" ")}
      {...props}
    />
  );
}

export function Select({ className = "", ...props }) {
  return (
    <motion.select
      whileFocus={{ scale: 1.01, y: -0.5 }}
      transition={{ type: "spring", stiffness: 520, damping: 40 }}
      className={[
        "h-11 w-full rounded-2xl px-3 text-sm",
        "bg-white/70 text-zinc-950",
        "ring-1 ring-black/10 focus:outline-none focus:ring-2 focus:ring-indigo-400/70 focus:shadow-[0_0_0_4px_rgba(99,102,241,0.10)]",
        "dark:bg-white/5 dark:text-white dark:ring-white/10",
        className,
      ].join(" ")}
      {...props}
    />
  );
}

export function Button({ variant = "primary", className = "", ...props }) {
  const base =
    "group relative inline-flex h-11 items-center justify-center gap-2 overflow-hidden rounded-2xl px-4 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70 disabled:opacity-50 disabled:cursor-not-allowed";

  const styles =
    variant === "primary"
      ? "bg-zinc-950 text-white hover:bg-zinc-900 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
      : variant === "ghost"
        ? "bg-white/60 text-zinc-950 ring-1 ring-black/10 hover:bg-white dark:bg-white/10 dark:text-white dark:ring-white/15 dark:hover:bg-white/15"
        : "bg-rose-600 text-white hover:bg-rose-500";

  return (
    <motion.button
      whileTap={{ scale: 0.985 }}
      whileHover={{ y: -1, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 520, damping: 38 }}
      className={[base, styles, className].join(" ")}
      {...props}
    >
      <span className="pointer-events-none absolute -inset-10 opacity-0 blur-2xl transition duration-500 group-hover:opacity-100">
        <span className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-fuchsia-500/10 to-cyan-400/18" />
      </span>
      <span className="relative z-10">{props.children}</span>
    </motion.button>
  );
}

