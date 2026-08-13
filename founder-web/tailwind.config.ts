import type { Config } from "tailwindcss";

/**
 * FounderOS — instrument, not document.
 *
 * The paper/serif system this replaces was a well-behaved editorial layout: a
 * page you read. This is a panel you operate. Graphite ground, hairline rules,
 * monospace for every number, tight radii.
 *
 * The rule that holds the whole thing together: COLOUR ONLY MEANS SIGNAL.
 * Nothing in the chrome is tinted. Buttons are ink inverted on the ground, the
 * active nav item is a raised surface, links are ink. Amber appears only where
 * something needs the founder, mint only where something resolved. If a screen
 * has no colour on it, nothing is wrong — and that is information.
 *
 * Token names are kept from the previous system so components re-skin in place.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    container: { center: true, padding: "1rem" },
    extend: {
      colors: {
        // Ground. Graphite, not navy and not pure black — black is a void,
        // graphite is a machined surface.
        void: "#0B0B0D",
        paper: "#0B0B0D",
        base: {
          surface: "#141417",   // cards
          raised: "#101013",    // the rail — recedes behind content
          overlay: "#1B1B1F",   // inputs, wells, nested panels
          border: "#26262B",    // hairlines
          "border-strong": "#35353C",
        },
        ink: {
          DEFAULT: "#F0F0EE",   // warm off-white; pure #FFF is clinical
          panel: "#141417",
          border: "#26262B",
          soft: "#1B1B1F",
        },
        foreground: {
          DEFAULT: "#F0F0EE",
          muted: "#9C9CA4",
          subtle: "#6E6E77",
          faint: "#3A3A41",
          "on-ink": "#0B0B0D",  // text on an inverted (ink-filled) surface
        },
        // Interactive is ink, not a brand colour. `accent` stays in the palette
        // because dozens of components reference it — it simply resolves to ink
        // now, which is the point.
        accent: {
          DEFAULT: "#F0F0EE",
          glow: "#FFFFFF",
          muted: "rgba(240,240,238,0.07)",
          "muted-strong": "rgba(240,240,238,0.13)",
          50: "#1B1B1F", 100: "#26262B", 200: "#35353C", 300: "#4A4A53",
          400: "#6E6E77", 500: "#9C9CA4", 600: "#F0F0EE", 700: "#FFFFFF",
          800: "#F0F0EE", 900: "#FFFFFF",
        },
        // The only two colours in the product.
        signal: {
          DEFAULT: "#FF8A4C",           // needs you
          surface: "rgba(255,138,76,0.10)",
          dim: "#E0A33E",               // needs you eventually
          "dim-surface": "rgba(224,163,62,0.10)",
        },
        state: {
          done: "#5EE0B0",              // resolved
          "done-surface": "rgba(94,224,176,0.10)",
          attention: "#E0A33E",
          "attention-surface": "rgba(224,163,62,0.10)",
          overdue: "#FF8A4C",
          "overdue-surface": "rgba(255,138,76,0.10)",
        },
        // Energy lanes read as instrument channels, not brand colours.
        energy: { admin: "#5EE0B0", medium: "#7FA6D9", deep: "#F0F0EE" },
      },
      fontFamily: {
        // IBM Plex was drawn for interfaces and instrumentation. Not Inter, not
        // a geometric — it has enough character to be a position, and the mono
        // is a true sibling rather than a bolt-on.
        sans: ["var(--font-sans)", "IBM Plex Sans", "system-ui", "sans-serif"],
        display: ["var(--font-sans)", "IBM Plex Sans", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "IBM Plex Mono", "ui-monospace", "monospace"],
      },
      // Denser than before. This is scanned, not read.
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem", letterSpacing: "0.11em", fontWeight: "500" }],
        xs: ["0.6875rem", { lineHeight: "0.95rem", letterSpacing: "0.005em" }],
        sm: ["0.75rem", { lineHeight: "1.05rem" }],
        base: ["0.8125rem", { lineHeight: "1.25rem" }],
        lg: ["0.9375rem", { lineHeight: "1.35rem", letterSpacing: "-0.006em" }],
        xl: ["1.0625rem", { lineHeight: "1.4rem", letterSpacing: "-0.012em" }],
        "2xl": ["1.25rem", { lineHeight: "1.45rem", letterSpacing: "-0.018em" }],
        "3xl": ["1.625rem", { lineHeight: "1.75rem", letterSpacing: "-0.024em" }],
        "4xl": ["2.125rem", { lineHeight: "2.2rem", letterSpacing: "-0.03em" }],
        metric: ["1.75rem", { lineHeight: "1", letterSpacing: "-0.03em", fontWeight: "400" }],
        "metric-sm": ["1.25rem", { lineHeight: "1", letterSpacing: "-0.02em", fontWeight: "400" }],
        hero: ["2.125rem", { lineHeight: "1.1", letterSpacing: "-0.03em", fontWeight: "500" }],
      },
      // Tight. Instruments do not have pill corners.
      borderRadius: { card: "8px", lg: "6px", xl: "7px", "2xl": "8px", pill: "9999px", sheet: "10px" },
      boxShadow: {
        ambient: "none",
        active: "0 0 0 1px #35353C",
        focused: "0 16px 40px -24px rgba(0,0,0,0.9)",
        glow: "0 0 0 1px #35353C",
        "glow-strong": "0 0 0 1px #4A4A53",
      },
      keyframes: {
        "slide-up": { from: { transform: "translateY(6px)", opacity: "0" }, to: { transform: "translateY(0)", opacity: "1" } },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "scale-in": { from: { transform: "scale(0.99)", opacity: "0" }, to: { transform: "scale(1)", opacity: "1" } },
        breathe: { "0%, 100%": { opacity: "0.55" }, "50%": { opacity: "1" } },
        dissolve: { from: { opacity: "1" }, to: { opacity: "0" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
      },
      animation: {
        "slide-up": "slide-up 260ms cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-in": "fade-in 180ms ease-out",
        "scale-in": "scale-in 200ms cubic-bezier(0.16, 1, 0.3, 1)",
        breathe: "breathe 2.6s ease-in-out infinite",
        dissolve: "dissolve 320ms ease-out forwards",
        shimmer: "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
