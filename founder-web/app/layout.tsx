import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import { Shell } from "@/components/shell";
import "./globals.css";

const sans = Geist({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });
// Only for the day's name on the Today card and page titles — used sparingly.
const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600"], display: "swap" });

export const metadata: Metadata = {
  title: "FounderOS",
  description: "Dump tasks, pick a few for today, keep the list honest. Plus notes.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "FounderOS", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#EAEDF1" },
    { media: "(prefers-color-scheme: dark)", color: "#101214" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${display.variable}`}>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
