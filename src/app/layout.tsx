import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { Toaster } from "@/components/toaster";
import { NativeBridge } from "@/components/native-bridge";
import { themeScript } from "@/components/theme-toggle";
import "./globals.css";

const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-serif", display: "swap" });
const sans = Geist({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Foundry: the founder's think tank", template: "%s · Foundry" },
  description:
    "Capture ideas, validate them, and turn the best ones into projects with a progress bar for every part of the business. Free for founders.",
  appleWebApp: { capable: true, title: "Foundry", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // lets the iPhone app draw under the notch; CSS pads with safe-area insets
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafc" },
    { media: "(prefers-color-scheme: dark)", color: "#09090f" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {children}
        <Toaster />
        <NativeBridge />
        <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
          <defs>
            <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" style={{ stopColor: "var(--brand)" }} />
              <stop offset="1" style={{ stopColor: "var(--brand-2)" }} />
            </linearGradient>
          </defs>
        </svg>
      </body>
    </html>
  );
}
