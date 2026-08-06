import type { Metadata, Viewport } from "next";
import { Inter, DM_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-display", weight: ["700"], display: "swap" });

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
  themeColor: "#FAFAFC",
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
      <body className={`${inter.variable} ${dmSans.variable} font-sans antialiased bg-base text-foreground`}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
