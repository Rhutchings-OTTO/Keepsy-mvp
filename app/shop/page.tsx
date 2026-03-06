import type { Metadata } from "next";
import { CatalogClient } from "./CatalogClient";

export const metadata: Metadata = {
  title: "Shop — Keepsy",
  description: "Browse our collection of personalised mugs, tees, hoodies and greeting cards.",
};

export default function ShopPage() {
  return <CatalogClient />;
}
