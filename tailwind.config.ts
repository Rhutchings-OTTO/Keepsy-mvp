import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // New brand palette
        cream:      "#FDF6EE",
        "cream-dark": "#F5EDE0",
        terracotta: {
          DEFAULT: "#C4714A",
          light:   "#E8967A",
          dark:    "#A05A38",
        },
        forest: {
          DEFAULT: "#2C4A3E",
          light:   "#3D6357",
        },
        gold: {
          DEFAULT: "#C9A84C",
          light:   "#DFC275",
          500:     "#C9A84C",
          400:     "#DFC275",
          600:     "#A88A38",
        },
        charcoal: "#2D2926",
        // Legacy kept for compatibility
        ivory:      "#FDF6EE",
        obsidian:   "#1A1A1A",
        periwinkle: "#E2E8FF",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Fraunces", "Iowan Old Style", "Georgia", "serif"],
        sans:  ["var(--font-sans)", "Manrope", "Aptos", "Helvetica Neue", "sans-serif"],
      },
      backdropBlur: { xs: "2px" },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        "warm-sm":    "0 8px 24px -12px rgba(45,41,38,0.28)",
        "warm-md":    "0 16px 40px -20px rgba(45,41,38,0.32)",
        "warm-lg":    "0 24px 64px -28px rgba(45,41,38,0.38)",
        "warm-xl":    "0 40px 100px -40px rgba(45,41,38,0.42)",
        "terra-glow": "0 8px 32px -8px rgba(196,113,74,0.45)",
        "forest-glow":"0 8px 32px -8px rgba(44,74,62,0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
