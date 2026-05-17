"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useMemo, useRef } from "react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function useReveal(options) {
  const ref = useRef(null);
  const inView = useInView(ref, { margin: "-15% 0px -15% 0px", once: true, ...options });
  return { ref, inView };
}

function Section({ eyebrow, title, subtitle, children, className = "" }) {
  const { ref, inView } = useReveal();
  return (
    <section ref={ref} className={cx("py-10 sm:py-14", className)}>
      <motion.div
        initial={{ opacity: 0, y: 14, filter: "blur(10px)" }}
        animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="max-w-2xl">
          {eyebrow ? (
            <div className="inline-flex items-center rounded-full bg-white/60 px-3 py-1 text-[11px] font-semibold tracking-wide text-zinc-700 ring-1 ring-black/5 dark:bg-white/10 dark:text-zinc-200/85 dark:ring-white/10">
              {eyebrow}
            </div>
          ) : null}
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-white/90 dark:text-white sm:text-4xl">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-3 text-pretty text-sm leading-7 text-white/60 dark:text-zinc-200/85 sm:text-base">
              {subtitle}
            </p>
          ) : null}
        </div>

        <div className="mt-8">{children}</div>
      </motion.div>
    </section>
  );
}

function FeatureCard({ title, desc, badge }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
      className="group rounded-3xl bg-white/60 p-6 ring-1 ring-black/5 backdrop-blur-xl dark:bg-black/30 dark:ring-white/10"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-white">
          {title}
        </div>
        {badge ? (
          <div className="rounded-full bg-black/5 px-3 py-1 text-[11px] font-semibold text-zinc-700 ring-1 ring-black/10 dark:bg-white/5 dark:text-zinc-200/80 dark:ring-white/10">
            {badge}
          </div>
        ) : null}
      </div>
      <p className="mt-3 text-sm leading-6 text-zinc-700 dark:text-zinc-200/80">
        {desc}
      </p>
      <div className="mt-5 h-px w-full bg-gradient-to-r from-transparent via-black/10 to-transparent dark:via-white/10" />
      <div className="mt-4 text-xs font-semibold text-indigo-700/90 transition group-hover:text-indigo-700 dark:text-indigo-200/90">
        Built with motion-first UX →
      </div>
    </motion.div>
  );
}

function StackPill({ children }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
      className="inline-flex items-center rounded-full bg-white/60 px-4 py-2 text-xs font-semibold text-zinc-800 ring-1 ring-black/5 backdrop-blur dark:bg-white/10 dark:text-zinc-100 dark:ring-white/10"
    >
      {children}
    </motion.div>
  );
}

export default function AboutLanding() {
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { amount: 0.4, once: true });

  const tech = useMemo(
    () => [
      "Next.js (App Router)",
      "React",
      "JavaScript",
      "Tailwind CSS",
      "Framer Motion",
      "html5-qrcode",
      "Local-first history",
    ],
    [],
  );

  return (
    <div className="py-10 sm:py-16">
      <div
        ref={heroRef}
        className="relative overflow-hidden rounded-[32px] bg-white/55 p-6 ring-1 ring-black/5 backdrop-blur-xl dark:bg-black/25 dark:ring-white/10 sm:p-10"
      >
        <div className="absolute inset-0 -z-10">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
          <div className="absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-400/15 blur-3xl" />
        </div>

        <div className="max-w-3xl">
          <motion.h1
            initial={{ opacity: 0, y: 16, filter: "blur(10px)" }}
            animate={heroInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-balance text-4xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-6xl"
          >
            A premium QR platform UI that feels like a startup product.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 text-pretty text-base leading-7 text-zinc-700 dark:text-zinc-200/85 sm:text-lg"
          >
            QR Studio pairs live generation and scanning with motion-first interactions,
            polished layout, and modern theming. Built as a SaaS foundation you can grow into a real product.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="mt-7 flex flex-wrap gap-3"
          >
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-950 px-5 text-sm font-semibold text-white transition hover:bg-zinc-900 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
            >
              Try the Generator
            </Link>
            <Link
              href="/scanner"
              className="inline-flex h-11 items-center justify-center rounded-full bg-white/70 px-5 text-sm font-semibold text-zinc-950 ring-1 ring-black/10 transition hover:bg-white dark:bg-white/10 dark:text-white dark:ring-white/15 dark:hover:bg-white/15"
            >
              Open Scanner
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10, filter: "blur(10px)" }}
          animate={heroInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
          transition={{ duration: 0.6, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 grid gap-4 sm:grid-cols-3"
        >
          {[
            { k: "Real-time", v: "Instant preview + smart actions." },
            { k: "Polished UI", v: "Glass cards, hover lift, clean spacing." },
            { k: "Motion-first", v: "Smooth transitions everywhere." },
          ].map((s) => (
            <div
              key={s.k}
              className="rounded-3xl bg-white/60 p-5 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10"
            >
              <div className="text-xs font-semibold tracking-wide text-zinc-600 dark:text-zinc-300/75">
                {s.k}
              </div>
              <div className="mt-2 text-sm font-semibold text-zinc-950 dark:text-white">
                {s.v}
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      <Section
        eyebrow="Features"
        title="Everything you need for QR workflows"
        subtitle="A clean foundation for QR creation and scanning with a premium SaaS feel."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <FeatureCard
            title="QR Generator"
            badge="Live"
            desc="Auto-detects your input type, previews instantly, and supports color, size, error correction, logo overlay, and downloads."
          />
          <FeatureCard
            title="QR Scanner"
            badge="Camera"
            desc="Fullscreen scanning mode, animated frame + laser effect, camera switching, torch toggle when supported, and image scanning."
          />
          <FeatureCard
            title="Fast & Secure"
            badge="Local-first"
            desc="History is stored locally, scanning runs on-device, and the UI is optimized for speed with motion that stays smooth."
          />
        </div>
      </Section>

      <Section
        eyebrow="Tech Stack"
        title="Modern tooling, modern experience"
        subtitle="Built with today’s best-in-class UI stack for a fast, polished product feel."
      >
        <div className="flex flex-wrap gap-2">
          {tech.map((t) => (
            <StackPill key={t}>{t}</StackPill>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Why this app"
        title="Designed like a product, not a demo"
        subtitle="The goal is a UI foundation that scales: consistent motion, strong layout primitives, and “premium by default” interactions."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {[
            {
              title: "Motion that earns trust",
              desc: "Transitions are subtle and intentional—helping users understand state changes without slowing them down.",
            },
            {
              title: "SaaS-grade composition",
              desc: "Cards, pills, buttons, and layouts feel cohesive across pages with predictable spacing and hierarchy.",
            },
            {
              title: "Smart actions built-in",
              desc: "Scanning results turn into actions (open, email, call, copy) so users can complete a task immediately.",
            },
            {
              title: "A strong foundation",
              desc: "The structure is ready for auth, billing, QR projects, analytics, and more—without redoing core UI.",
            },
          ].map((x) => (
            <motion.div
              key={x.title}
              whileHover={{ y: -3 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
              className="rounded-3xl bg-white/60 p-6 ring-1 ring-black/5 backdrop-blur-xl dark:bg-black/30 dark:ring-white/10"
            >
              <div className="text-sm font-semibold text-zinc-950 dark:text-white">{x.title}</div>
              <p className="mt-2 text-sm leading-6 text-zinc-700 dark:text-zinc-200/80">{x.desc}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      <footer className="mt-6 rounded-3xl bg-white/55 p-6 text-sm ring-1 ring-black/5 backdrop-blur-xl dark:bg-black/25 dark:ring-white/10 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-zinc-950 dark:text-white">QR Studio</div>
            <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-300/70">
              A modern QR SaaS UI foundation.
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-950 px-4 text-xs font-semibold text-white transition hover:bg-zinc-900 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
            >
              Generator
            </Link>
            <Link
              href="/scanner"
              className="inline-flex h-10 items-center justify-center rounded-full bg-white/70 px-4 text-xs font-semibold text-zinc-950 ring-1 ring-black/10 transition hover:bg-white dark:bg-white/10 dark:text-white dark:ring-white/15 dark:hover:bg-white/15"
            >
              Scanner
            </Link>
          </div>
        </div>
        <div className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-black/10 to-transparent dark:via-white/10" />
        <div className="mt-5 text-xs text-zinc-600 dark:text-zinc-300/70">
          © {new Date().getFullYear()} QR Studio. Built with Next.js, Tailwind, and Framer Motion.
        </div>
      </footer>
    </div>
  );
}

