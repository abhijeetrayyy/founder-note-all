import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

// The handoff's actual type system. Instrument Serif carries headlines (italic
// for the emphasis word), Instrument Sans the body, JetBrains Mono every
// micro-label, timer and metric.
const sans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
const serif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FounderOS",
  description: "The execution system for founders who get stuck choosing what to do next.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#F6F3EC",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        <Script id="time-mode" strategy="beforeInteractive">
          {`(() => { const h = new Date().getHours(); const c = document.documentElement.classList; if (h >= 17 && h < 22) c.add('evening'); if (h >= 22 || h < 5) c.add('night'); })()`}
        </Script>
      </head>
      <body className={`${sans.variable} ${serif.variable} ${mono.variable} font-sans antialiased bg-base text-foreground`}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
