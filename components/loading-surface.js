"use client";

import { motion } from "framer-motion";

export default function LoadingSurface({ title = "Loading…", subtitle = "Just a moment." }) {
  return (
    <div className="py-10 sm:py-16">
      <motion.div
        initial={{ opacity: 0, y: 12, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-[32px] bg-white/55 p-8 ring-1 ring-black/5 backdrop-blur-xl dark:bg-black/25 dark:ring-white/10 sm:p-12"
      >
        <div className="flex items-center gap-4">
          <motion.div
            className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500/70 via-fuchsia-500/60 to-cyan-400/60 ring-1 ring-white/20"
            animate={{ rotate: [0, 6, -6, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          />
          <div>
            <div className="text-sm font-semibold text-zinc-950 dark:text-white">{title}</div>
            <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-300/70">{subtitle}</div>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-3xl bg-white/60 p-5 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10"
            >
              <div className="h-3 w-24 animate-pulse rounded bg-black/10 dark:bg-white/10" />
              <div className="mt-4 h-3 w-full animate-pulse rounded bg-black/10 dark:bg-white/10" />
              <div className="mt-2 h-3 w-5/6 animate-pulse rounded bg-black/10 dark:bg-white/10" />
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

