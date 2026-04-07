import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";

export const { fontFamily: FRAUNCES } = loadFraunces("normal", {
  weights: ["600", "700"],
  subsets: ["latin"],
});

export const { fontFamily: MANROPE } = loadManrope("normal", {
  weights: ["500", "600", "700"],
  subsets: ["latin"],
});

// Brand colours
export const BRAND = {
  cream: "#F9F8F6",
  creamDark: "#F0EDE8",
  ink: "#2D2926",
  terracotta: "#C4714A",
  forest: "#2B4038",
  gold: "#D4A853",
  white: "#FFFEF9",
} as const;
