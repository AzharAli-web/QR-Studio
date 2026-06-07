import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.css";
import LayoutShell from "../components/layout-shell";
import ThemeInitScript from "../components/theme-init-script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "QR Studio | Free QR Code Generator, Scanner & Customizer",
  description: "Create professional QR codes with custom colors, logos, and styles. Scan QR codes, manage QR history, and download high-quality QR codes instantly with QR Studio.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ThemeInitScript />
      </head>
      <body className="min-h-full flex flex-col">
        <div className="app-gradient" />
        <div className="app-grain" />
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
