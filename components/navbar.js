"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import ThemeToggle from "./theme-toggle";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/history", label: "History" },
  { href: "/scanner", label: "Scanner" },
  { href: "/about", label: "About" },
];

function useIsScrolled(threshold = 8) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return isScrolled;
}

function HamburgerIcon({ open }) {
  return (
    <div className="relative h-4 w-5">
      <motion.span
        className="absolute left-0 top-0 block h-0.5 w-5 rounded bg-current"
        animate={{ rotate: open ? 45 : 0, y: open ? 7 : 0 }}
        transition={{ duration: 0.18 }}
      />
      <motion.span
        className="absolute left-0 top-1.5 block h-0.5 w-5 rounded bg-current"
        animate={{ opacity: open ? 0 : 1 }}
        transition={{ duration: 0.12 }}
      />
      <motion.span
        className="absolute left-0 top-3 block h-0.5 w-5 rounded bg-current"
        animate={{ rotate: open ? -45 : 0, y: open ? -5 : 0 }}
        transition={{ duration: 0.18 }}
      />
    </div>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const isScrolled = useIsScrolled();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const activeHref = useMemo(() => {
    // Basic match for now (exact routes only).
    return NAV_LINKS.find((l) => l.href === pathname)?.href ?? null;
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50">
      <div className="px-4 pt-4 sm:px-6 lg:px-8">
        <motion.div
          layout
          initial={{ opacity: 0, y: -10, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className={[
            "mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-3 py-3 sm:px-4",
            "text-zinc-950 dark:text-white",
            "backdrop-blur-xl",
            "ring-1 ring-white/15",
            "shadow-[0_1px_0_rgba(255,255,255,0.25)_inset]",
            isScrolled
              ? "bg-white/70 shadow-sm shadow-black/5 dark:bg-black/35"
              : "bg-white/55 dark:bg-black/25",
          ].join(" ")}
        >
          <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.99 }}>
            <Link
              href="/"
              className="group flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-black/5 dark:hover:bg-white/5"
            >
              <span className="relative grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-indigo-500/90 via-fuchsia-500/80 to-cyan-400/80 text-white ring-1 ring-white/25 shadow-sm">
                <span className="text-sm font-semibold tracking-tight">QR</span>
                <span className="pointer-events-none absolute -inset-2 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-fuchsia-500/10 to-cyan-400/20 opacity-0 blur-md transition group-hover:opacity-100" />
              </span>
              <div className="leading-tight">
                <div className="text-sm font-semibold tracking-tight">QR Studio</div>
                <div className="text-[11px] text-zinc-600 dark:text-zinc-300/80">
                  SaaS UI foundation
                </div>
              </div>
            </Link>
          </motion.div>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => {
              const active = activeHref === link.href;
              return (
                <motion.div key={link.href} whileHover={{ y: -1 }} whileTap={{ scale: 0.99 }}>
                  <Link
                    href={link.href}
                    className={[
                      "relative rounded-xl px-3 py-2 text-sm font-medium",
                      "text-zinc-700 hover:text-zinc-950 dark:text-zinc-200/90 dark:hover:text-white",
                      "transition",
                      "hover:bg-black/5 dark:hover:bg-white/5",
                    ].join(" ")}
                  >
                    <span className="relative z-10">{link.label}</span>
                    {active ? (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-0 rounded-xl bg-white/65 ring-1 ring-black/5 dark:bg-white/10 dark:ring-white/15"
                        transition={{ type: "spring", stiffness: 520, damping: 42 }}
                      />
                    ) : null}
                    <motion.span
                      className="absolute bottom-1 left-3 right-3 h-px rounded bg-gradient-to-r from-indigo-500/0 via-indigo-500/45 to-cyan-400/0 opacity-0"
                      whileHover={{ opacity: 1 }}
                      transition={{ duration: 0.18 }}
                    />
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle className="hidden sm:inline-flex" />

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
              className={[
                "inline-flex h-9 w-9 items-center justify-center rounded-xl",
                "bg-white/10 text-zinc-950 ring-1 ring-black/10 backdrop-blur-md",
                "transition hover:bg-black/5 dark:bg-black/20 dark:text-white dark:ring-white/15 dark:hover:bg-white/5",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70",
                "md:hidden",
              ].join(" ")}
            >
              <HamburgerIcon open={mobileOpen} />
            </button>
          </div>
        </motion.div>

        <AnimatePresence>
          {mobileOpen ? (
            <motion.div
              initial={{ height: 0, opacity: 0, y: -6 }}
              animate={{ height: "auto", opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -6 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto mt-2 max-w-6xl overflow-hidden rounded-2xl bg-white/70 backdrop-blur-xl ring-1 ring-black/5 dark:bg-black/35 dark:ring-white/15 md:hidden"
            >
              <div className="flex flex-col gap-1 p-2">
                {NAV_LINKS.map((link) => {
                  const active = activeHref === link.href;
                  return (
                    <motion.div key={link.href} whileTap={{ scale: 0.99 }}>
                      <Link
                        href={link.href}
                        className={[
                          "rounded-xl px-3 py-2.5 text-sm font-medium",
                          active
                            ? "bg-black/5 text-zinc-950 dark:bg-white/10 dark:text-white"
                            : "text-zinc-700 hover:bg-black/5 hover:text-zinc-950 dark:text-zinc-200/90 dark:hover:bg-white/5 dark:hover:text-white",
                          "transition",
                        ].join(" ")}
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  );
                })}

                <div className="mt-1 px-1 pb-1 sm:hidden">
                  <ThemeToggle className="w-full justify-between" />
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </header>
  );
}

