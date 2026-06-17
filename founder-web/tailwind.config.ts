import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    container: {
      center: true,
      padding: "1rem",
    },
    extend: {
      colors: {
        // Brand
        primary: {
          DEFAULT: "#5B4FE9",
          deep: "#3A2FD9",
          50: "#EEEBFF",
          100: "#DDD8FF",
          200: "#B8AEFF",
          300: "#9485FF",
          400: "#6F5BFF",
          500: "#5B4FE9",
          600: "#3A2FD9",
          700: "#2C24AE",
          800: "#1E1982",
          900: "#100E57",
        },
        // Energy
        admin: "#14B8A6",
        medium: "#3B82F6",
        deep: "#7C3AED",
        // Semantic
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
        // Light surface
        bg: "#F6F7FB",
        surface: "#FFFFFF",
        "surface-alt": "#EEF0F7",
        text: "#0F0F1A",
        "text-muted": "#6B6B7B",
        border: "#E3E5EE",
        // Dark surface
        "dark-bg": "#0A0A14",
        "dark-surface": "#15151F",
        "dark-surface-alt": "#1F1F2C",
        "dark-text": "#F5F5FA",
        "dark-text-muted": "#9595A8",
        "dark-border": "#2A2A3A",
        "dark-sidebar": "#0F0F18",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "16px",
        pill: "20px",
        sheet: "24px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 15, 26, 0.04)",
        "card-hover": "0 8px 24px rgba(91, 79, 233, 0.12)",
        primary: "0 8px 24px rgba(91, 79, 233, 0.30)",
        success: "0 8px 24px rgba(34, 197, 94, 0.30)",
      },
      keyframes: {
        "slide-up": {
          from: { transform: "translateY(8px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        "slide-up": "slide-up 200ms ease-out",
        "fade-in": "fade-in 200ms ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
