"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { loadHistory, saveHistory } from "../../lib/storage";
import { detectType, normalizeUrl } from "../../lib/qr";
import { useToast } from "../../components/toast/toast-provider";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Button({ variant = "ghost", className = "", ...props }) {
  const base =
    "group relative inline-flex h-11 items-center justify-center gap-2 overflow-hidden rounded-2xl px-4 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70 disabled:opacity-50 disabled:cursor-not-allowed";
  const styles =
    variant === "primary"
      ? "bg-zinc-950 text-white hover:bg-zinc-900 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
      : "bg-white/60 text-zinc-950 ring-1 ring-black/10 hover:bg-white dark:bg-white/10 dark:text-white dark:ring-white/15 dark:hover:bg-white/15";

  return (
    <motion.button
      whileTap={{ scale: 0.985 }}
      whileHover={{ y: -1, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 520, damping: 38 }}
      className={cx(base, styles, className)}
      {...props}
    >
      <span className="pointer-events-none absolute -inset-10 opacity-0 blur-2xl transition duration-500 group-hover:opacity-100">
        <span className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-fuchsia-500/10 to-cyan-400/18" />
      </span>
      <span className="relative z-10">{props.children}</span>
    </motion.button>
  );
}

function actionFor(text) {
  const t = String(text || "").trim();
  const type = detectType(t);
  if (type === "url") {
    const url = normalizeUrl(t);
    return { type, primaryLabel: "Open link", onPrimary: () => window.open(url, "_blank", "noopener,noreferrer") };
  }
  if (type === "email") {
    const href = t.startsWith("mailto:") ? t : `mailto:${t}`;
    return { type, primaryLabel: "Email", onPrimary: () => (window.location.href = href) };
  }
  if (type === "phone") {
    const href = t.startsWith("tel:") ? t : `tel:${t}`;
    return { type, primaryLabel: "Call", onPrimary: () => (window.location.href = href) };
  }
  return { type: "text", primaryLabel: "Copy", onPrimary: null };
}

export default function HistoryPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setItems(loadHistory().slice(0, 30));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((x) => String(x.payload || "").toLowerCase().includes(q));
  }, [items, query]);

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      toast.show({ variant: "success", title: "Copied", message: "Saved to clipboard." });
    } catch {
      toast.show({ variant: "error", title: "Clipboard blocked", message: "Your browser blocked clipboard access." });
    }
  }

  function clearAll() {
    setItems([]);
    saveHistory([]);
    toast.show({ variant: "success", title: "Cleared", message: "History removed from this device." });
  }

  function removeOne(id) {
    setItems((prev) => {
      const next = prev.filter((x) => x.id !== id);
      saveHistory(next);
      return next;
    });
    toast.show({ variant: "success", title: "Removed", message: "Item removed from history." });
  }

  return (
    <div className="py-10 sm:py-16">
      <div className="rounded-[32px] bg-white/55 p-6 ring-1 ring-black/5 backdrop-blur-xl dark:bg-black/25 dark:ring-white/10 sm:p-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-5xl">
              History
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-700 dark:text-zinc-200/85 sm:text-base">
              Your recently saved QR payloads (stored locally on this device).
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-950 px-5 text-sm font-semibold text-white transition hover:bg-zinc-900 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
            >
              Back to Generator
            </Link>
            <Button onClick={clearAll} disabled={items.length === 0}>
              Clear all
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_260px]">
          <div className="rounded-3xl bg-white/60 p-4 ring-1 ring-black/5 dark:bg-black/30 dark:ring-white/10">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search history…"
              className="h-11 w-full rounded-2xl bg-white/70 px-3 text-sm text-zinc-950 ring-1 ring-black/10 transition focus:outline-none focus:ring-2 focus:ring-indigo-400/70 dark:bg-white/5 dark:text-white dark:ring-white/10"
            />
            <div className="mt-3 text-xs text-zinc-600 dark:text-zinc-300/70">
              Showing <span className="font-semibold">{filtered.length}</span> of{" "}
              <span className="font-semibold">{items.length}</span>
            </div>
          </div>

          <div className="rounded-3xl bg-white/60 p-4 ring-1 ring-black/5 dark:bg-black/30 dark:ring-white/10">
            <div className="text-sm font-semibold text-zinc-950 dark:text-white">Tips</div>
            <ul className="mt-3 space-y-2 text-xs leading-6 text-zinc-700 dark:text-zinc-200/80">
              <li>- History is saved in your browser only.</li>
              <li>- Use copy/open/email/call actions per item.</li>
              <li>- Want more? We can add tags and favorites next.</li>
            </ul>
          </div>
        </div>

        <div className="mt-6">
          <AnimatePresence initial={false}>
            {filtered.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 10, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: 10, filter: "blur(10px)" }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-3xl bg-white/55 p-8 text-center ring-1 ring-black/5 backdrop-blur-xl dark:bg-black/25 dark:ring-white/10"
              >
                <div className="text-sm font-semibold text-zinc-950 dark:text-white">
                  No history yet
                </div>
                <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-300/70">
                  Save from the generator to see items appear here.
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid gap-3"
              >
                {filtered.map((item) => {
                  const a = actionFor(item.payload);
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      whileHover={{ y: -2 }}
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                      className="group relative overflow-hidden rounded-3xl bg-white/60 p-5 ring-1 ring-black/5 backdrop-blur-xl dark:bg-black/30 dark:ring-white/10"
                    >
                      <div className="pointer-events-none absolute -inset-14 opacity-0 blur-2xl transition duration-500 group-hover:opacity-100">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/16 via-fuchsia-500/10 to-cyan-400/12" />
                      </div>

                      <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="rounded-full bg-black/5 px-3 py-1 text-[11px] font-semibold text-zinc-700 ring-1 ring-black/10 dark:bg-white/5 dark:text-zinc-200/80 dark:ring-white/10">
                              {String(a.type || item.type || "text").toUpperCase()}
                            </div>
                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                              {new Date(item.ts).toLocaleString()}
                            </div>
                          </div>
                          <div className="mt-2 break-all text-sm font-semibold text-zinc-950 dark:text-white">
                            {String(item.payload || "")}
                          </div>
                          <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-300/70">
                            Size {item.opts?.size || 320}px • EC {item.opts?.ecLevel || "M"}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 sm:justify-end">
                          <Button
                            variant="primary"
                            onClick={() => (a.onPrimary ? a.onPrimary() : copy(item.payload))}
                          >
                            {a.primaryLabel}
                          </Button>
                          <Button onClick={() => copy(item.payload)}>Copy</Button>
                          <Button onClick={() => removeOne(item.id)}>Remove</Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

