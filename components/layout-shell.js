"use client";

import Navbar from "./navbar";
import PageTransition from "./page-transition";
import FloatingBlobs from "./floating-blobs";
import { ToastProvider } from "./toast/toast-provider";
import { ThemeProvider } from "./theme-provider";

export default function LayoutShell({ children }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <div className="relative flex min-h-dvh flex-col">
          <FloatingBlobs />
          <Navbar />
          <PageTransition>
            <main className="flex-1 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
              <div className="mx-auto w-full max-w-6xl">{children}</div>
            </main>
          </PageTransition>
          <footer className="px-4 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
            QR Studio — UI foundation
          </footer>
        </div>
      </ToastProvider>
    </ThemeProvider>
  );
}

