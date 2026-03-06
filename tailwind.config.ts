import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: "#F9F8F6",
        obsidian: "#1A1A1A",
        periwinkle: "#E2E8FF",
        gold: {
          500: "#D4AF37",
          400: "#E5C158",
          600: "#B8962E",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Fraunces", "Iowan Old Style", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Manrope", "Aptos", "Helvetica Neue", "sans-serif"],
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
