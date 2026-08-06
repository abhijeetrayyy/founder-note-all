import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    container: { center: true, padding: "1rem" },
    extend: {
      colors: {
        accent: {
          DEFAULT: "#7C3AED",
          glow: "#8B5CF6",
          muted: "rgba(124,58,237,0.08)",
          "muted-strong": "rgba(124,58,237,0.16)",
          50: "#FAF5FF", 100: "#F3E8FF", 200: "#E9D5FF", 300: "#D8B4FE",
          400: "#C084FC", 500: "#A855F7", 600: "#9333EA", 700: "#7C3AED", 800: "#6B21A8", 900: "#581C87",
        },
        base: {
          DEFAULT: "#FAFAFC",
          surface: "#FFFFFF",
          raised: "#F4F4F8",
          overlay: "#EEEEF4",
          border: "rgba(0,0,0,0.06)",
          "border-strong": "rgba(0,0,0,0.10)",
        },
        glass: {
          ambient: "rgba(255,255,255,0.55)",
          active: "rgba(255,255,255,0.72)",
          focused: "rgba(255,255,255,0.88)",
        },
        foreground: {
          DEFAULT: "#1A1A2E",
          muted: "rgba(26,26,46,0.50)",
          subtle: "rgba(26,26,46,0.30)",
          faint: "rgba(26,26,46,0.12)",
        },
        state: {
          done: "#10B981",
          "done-surface": "rgba(16,185,129,0.08)",
          attention: "#F59E0B",
          "attention-surface": "rgba(245,158,11,0.08)",
          overdue: "#EF4444",
          "overdue-surface": "rgba(239,68,68,0.08)",
        },
        energy: { admin: "#10B981", medium: "#3B82F6", deep: "#8B5CF6" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem", letterSpacing: "0.05em", fontWeight: "600" }],
        metric: ["2.5rem", { lineHeight: "1", letterSpacing: "-0.03em", fontWeight: "700" }],
        "metric-sm": ["1.75rem", { lineHeight: "1", letterSpacing: "-0.02em", fontWeight: "700" }],
        hero: ["2.25rem", { lineHeight: "1.1", letterSpacing: "-0.03em", fontWeight: "700" }],
      },
      borderRadius: { card: "24px", lg: "16px", xl: "20px", "2xl": "24px", pill: "9999px", sheet: "32px" },
      boxShadow: {
        ambient: "0 0 0 1px rgba(0,0,0,0.03), 0 1px 2px rgba(0,0,0,0.04)",
        active: "0 0 0 1px rgba(124,58,237,0.10), 0 4px 24px rgba(0,0,0,0.06)",
        focused: "0 0 0 1px rgba(124,58,237,0.18), 0 8px 40px rgba(124,58,237,0.10), 0 2px 8px rgba(0,0,0,0.08)",
        glow: "0 0 40px rgba(124,58,237,0.08)",
        "glow-strong": "0 0 60px rgba(124,58,237,0.14)",
      },
      keyframes: {
        "slide-up": { from: { transform: "translateY(16px)", opacity: "0" }, to: { transform: "translateY(0)", opacity: "1" } },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "scale-in": { from: { transform: "scale(0.96)", opacity: "0" }, to: { transform: "scale(1)", opacity: "1" } },
        breathe: { "0%, 100%": { opacity: "0.5" }, "50%": { opacity: "1" } },
        dissolve: { from: { opacity: "1", transform: "scale(1)", filter: "blur(0)" }, to: { opacity: "0.3", transform: "scale(0.98)", filter: "blur(2px)" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
      },
      animation: {
        "slide-up": "slide-up 400ms cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-in": "fade-in 300ms ease-out",
        "scale-in": "scale-in 300ms cubic-bezier(0.16, 1, 0.3, 1)",
        breathe: "breathe 3s ease-in-out infinite",
        dissolve: "dissolve 500ms ease-out forwards",
        shimmer: "shimmer 2s linear infinite",
      },
      backdropBlur: { glass: "24px", "glass-heavy": "40px" },
    },
  },
  plugins: [],
};

export default config;
