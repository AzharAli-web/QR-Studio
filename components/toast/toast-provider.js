"use client";

import { AnimatePresence, motion } from "framer-motion";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

const ToastContext = createContext(null);

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function makeId() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const tm = timers.current.get(id);
    if (tm) clearTimeout(tm);
    timers.current.delete(id);
  }, []);

  const show = useCallback(
    ({ title, message, variant = "info", duration = 2600 }) => {
      const id = makeId();
      const toast = { id, title, message, variant };
      setToasts((prev) => [toast, ...prev].slice(0, 4));
      if (duration > 0) {
        const tm = setTimeout(() => remove(id), duration);
        timers.current.set(id, tm);
      }
      return id;
    },
    [remove],
  );

  const api = useMemo(() => ({ show, remove }), [show, remove]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed right-4 top-20 z-[90] w-[min(420px,calc(100vw-2rem))] space-y-2">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -10, scale: 0.98, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, scale: 0.98, filter: "blur(10px)" }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className={cx(
                "pointer-events-auto overflow-hidden rounded-3xl p-4 ring-1 backdrop-blur-xl",
                "bg-white/80 ring-black/10 shadow-sm shadow-black/10",
                "dark:bg-black/60 dark:ring-white/15 dark:shadow-black/40",
              )}
            >
              <div
                className={cx(
                  "absolute inset-x-0 top-0 h-1",
                  t.variant === "success"
                    ? "bg-emerald-400/80"
                    : t.variant === "error"
                      ? "bg-rose-400/80"
                      : "bg-indigo-400/80",
                )}
              />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-zinc-950 dark:text-white">
                    {t.title || (t.variant === "error" ? "Something went wrong" : "Done")}
                  </div>
                  {t.message ? (
                    <div className="mt-1 text-xs leading-5 text-zinc-700 dark:text-zinc-200/80">
                      {t.message}
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="rounded-xl bg-black/5 px-2 py-1 text-[11px] font-semibold text-zinc-700 ring-1 ring-black/10 transition hover:bg-black/10 dark:bg-white/5 dark:text-zinc-200/80 dark:ring-white/10 dark:hover:bg-white/10"
                  onClick={() => remove(t.id)}
                >
                  Close
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

