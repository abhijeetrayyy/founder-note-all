import type { Config } from "tailwindcss";

/**
 * FounderOS design tokens — the paper system from the handoff.
 *
 * Token names are deliberately unchanged from the previous violet-glass theme
 * so every existing component re-skins by changing values here rather than by
 * editing thirty files. What changed is the world: a warm paper ground instead
 * of cold near-white, real borders instead of blurred translucency, indigo
 * instead of violet, and ink that is brown-black rather than blue-black.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    container: { center: true, padding: "1rem" },
    extend: {
      colors: {
        // Brand indigo — matches lib/constants.ts BRAND_COLOR, which the old
        // Tailwind theme silently disagreed with.
        accent: {
          DEFAULT: "#5B4FE9",
          glow: "#7A70F0",
          muted: "rgba(91,79,233,0.07)",
          "muted-strong": "rgba(91,79,233,0.14)",
          50: "#F4F2FF", 100: "#EFECFE", 200: "#DDD8FC", 300: "#C3BBF8",
          400: "#9F94F3", 500: "#7A70F0", 600: "#5B4FE9", 700: "#4A3EDA",
          800: "#3B31AE", 900: "#2E2686",
        },
        // Paper, not white. The warmth is the point — it is what makes long
        // sessions feel like a notebook rather than a dashboard.
        base: {
          DEFAULT: "#F6F3EC",
          surface: "#FFFDF8",
          raised: "#FBF8F2",
          overlay: "#F1EDE3",
          border: "#E6DFD2",
          "border-strong": "#DCD3C2",
        },
        ink: {
          DEFAULT: "#171512",
          panel: "#201D18",
          border: "#302C25",
          soft: "#3B352C",
        },
        foreground: {
          DEFAULT: "#171512",
          muted: "#6B6459",
          subtle: "#9A9285",
          faint: "#D8D0C0",
          "on-ink": "#FBF8F2",
        },
        // Semantic state, deliberately low-chroma. These appear as 6px dots and
        // small text, never as large numerals — a screen where four different
        // saturated colours shout at once has no hierarchy, and the founder has
        // to decide what matters instead of being told.
        state: {
          done: "#3E7D6E",
          "done-surface": "#EDF4F1",
          attention: "#9A6E22",
          "attention-surface": "#F7F1E4",
          overdue: "#B5482A",
          "overdue-surface": "#F8EEE9",
        },
        // Energy stays distinguishable but sits back; these are 3px bars.
        energy: { admin: "#5FA396", medium: "#6485B8", deep: "#5B4FE9" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Instrument Sans", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Instrument Serif", "Georgia", "serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "monospace"],
      },
      // Product-UI scale, not website scale. Base is 14px with 13px for
      // secondary text; emphasis comes from weight (500/600), never from size.
      // The old scale was 16px+ everywhere, which is why the app read like a
      // marketing page rather than a tool.
      fontSize: {
        "2xs": ["0.6563rem", { lineHeight: "0.875rem", letterSpacing: "0.1em", fontWeight: "500" }],
        xs: ["0.75rem", { lineHeight: "1rem", letterSpacing: "0" }],
        sm: ["0.8125rem", { lineHeight: "1.15rem", letterSpacing: "0" }],
        base: ["0.875rem", { lineHeight: "1.35rem", letterSpacing: "-0.003em" }],
        lg: ["1rem", { lineHeight: "1.45rem", letterSpacing: "-0.008em" }],
        xl: ["1.125rem", { lineHeight: "1.5rem", letterSpacing: "-0.012em" }],
        "2xl": ["1.375rem", { lineHeight: "1.6rem", letterSpacing: "-0.016em" }],
        "3xl": ["1.75rem", { lineHeight: "1.9rem", letterSpacing: "-0.02em" }],
        "4xl": ["2.25rem", { lineHeight: "2.35rem", letterSpacing: "-0.022em" }],
        metric: ["2rem", { lineHeight: "1", letterSpacing: "-0.02em", fontWeight: "500" }],
        "metric-sm": ["1.375rem", { lineHeight: "1", letterSpacing: "-0.01em", fontWeight: "500" }],
        hero: ["2.25rem", { lineHeight: "1.08", letterSpacing: "-0.022em", fontWeight: "400" }],
      },
      borderRadius: { card: "20px", lg: "13px", xl: "16px", "2xl": "18px", pill: "9999px", sheet: "24px" },
      boxShadow: {
        // Paper does not glow. These are the shadows of something resting on a
        // surface, not of something emitting light.
        ambient: "0 1px 2px rgba(23,21,18,0.04)",
        active: "0 2px 10px rgba(23,21,18,0.06)",
        focused: "0 8px 30px rgba(23,21,18,0.08)",
        glow: "0 2px 10px rgba(91,79,233,0.14)",
        "glow-strong": "0 4px 18px rgba(91,79,233,0.20)",
      },
      keyframes: {
        "slide-up": { from: { transform: "translateY(10px)", opacity: "0" }, to: { transform: "translateY(0)", opacity: "1" } },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "scale-in": { from: { transform: "scale(0.98)", opacity: "0" }, to: { transform: "scale(1)", opacity: "1" } },
        breathe: { "0%, 100%": { opacity: "0.6" }, "50%": { opacity: "1" } },
        dissolve: { from: { opacity: "1", transform: "scale(1)" }, to: { opacity: "0", transform: "scale(0.99)" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
      },
      animation: {
        "slide-up": "slide-up 320ms cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-in": "fade-in 240ms ease-out",
        "scale-in": "scale-in 240ms cubic-bezier(0.16, 1, 0.3, 1)",
        breathe: "breathe 3s ease-in-out infinite",
        dissolve: "dissolve 400ms ease-out forwards",
        shimmer: "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
