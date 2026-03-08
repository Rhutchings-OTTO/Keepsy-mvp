import type { Metadata } from "next";
import { AboutClient } from "./AboutClient";

export const metadata: Metadata = {
  title: "Our Story",
  description:
    "Meet the people behind Keepsy — a small, passionate team dedicated to turning your most treasured memories into beautifully crafted, personalised gifts. Handmade with heart.",
  alternates: {
    canonical: "https://keepsy.store/about",
  },
  openGraph: {
    title: "Our Story — Keepsy",
    description:
      "Keepsy was born from a desire to make gifting feel personal again. Learn about our mission to craft keepsakes that truly matter.",
    type: "website",
    url: "https://keepsy.store/about",
  },
  twitter: {
    card: "summary_large_image",
    title: "Our Story — Keepsy",
    description:
      "A small team with a big passion for personalised gifts. Discover the story behind Keepsy.",
  },
};

export default function AboutPage() {
  return <AboutClient />;
}
