import type { Metadata } from "next";
import SarClient from "./SarClient";

export const metadata: Metadata = {
  title: "Subject Access Request — Keepsy",
  description: "Exercise your UK GDPR rights. Submit a subject access request to access, correct, delete or export the personal data Keepsy holds about you.",
  alternates: { canonical: "https://keepsy.store/sar" },
};

export default function SarPage() {
  return <SarClient />;
}
