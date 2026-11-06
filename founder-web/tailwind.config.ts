import type { Config } from "tailwindcss";

/**
 * An index card on a desk.
 *
 * Index cards are what people have always grabbed to dump a task on: white
 * stock, one red line across the top, faint blue lines underneath. Today is
 * literally that card. Everything you can press is ballpoint blue; everything
 * you read is graphite. Red is only ever the card's header line and the line
 * your list holds to — never decoration.
 *
 * Colours live as CSS variables in globals.css so dark mode is one swap.
 */
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        desk: v("desk"),
        card: v("card"),
        sunk: v("sunk"),
        ink: { DEFAULT: v("ink"), 2: v("ink-2"), 3: v("ink-3") },
        hair: v("hair"),
        rule: v("rule"),
        red: v("red"),
        pen: { DEFAULT: v("pen"), tint: v("pen-tint") },
        amber: v("amber"),
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 0 rgb(var(--shadow) / 0.05), 0 10px 28px -14px rgb(var(--shadow) / 0.28)",
        lift: "0 24px 60px -20px rgb(var(--shadow) / 0.45)",
      },
      keyframes: {
        rise: { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "none" } },
        sheet: { from: { transform: "translateY(24px)", opacity: "0" }, to: { transform: "none", opacity: "1" } },
        fade: { from: { opacity: "0" }, to: { opacity: "1" } },
      },
      animation: {
        rise: "rise 220ms cubic-bezier(.2,.7,.2,1) both",
        sheet: "sheet 240ms cubic-bezier(.2,.8,.2,1) both",
        fade: "fade 160ms ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
