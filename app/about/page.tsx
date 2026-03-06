import type { Metadata } from "next";
import { AboutClient } from "./AboutClient";

export const metadata: Metadata = {
  title: "Our Story — Keepsy",
  description:
    "Learn about Keepsy — the personalised gift brand built by a mom who wanted to preserve memories.",
};

export default function AboutPage() {
  return <AboutClient />;
}
