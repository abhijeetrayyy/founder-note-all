import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

// No serif. The serif headline was the most recognisable thing about the old
// system and also the thing that made it read as an article. IBM Plex was drawn
// for interfaces and instrumentation, and its mono is a true sibling — so
// numbers and labels sit in the same voice as everything else.
const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600"],
  display: "swap",
});
const mono = IBM_Plex_Mono({
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
  themeColor: "#0B0B0D",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
      </head>
      <body className={`${sans.variable} ${mono.variable} font-sans antialiased bg-void text-foreground`}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
