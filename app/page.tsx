import LandingPage from "./LandingPage";
import { cookies } from "next/headers";
import type { Region } from "@/lib/region";

function parseRegion(value: string | undefined): Region | null {
  return value === "US" || value === "UK" ? value : null;
}

export default async function Page() {
  const cookieStore = await cookies();
  const initialRegion = parseRegion(cookieStore.get("keepsy_region")?.value);
  return <LandingPage initialRegion={initialRegion} />;
}