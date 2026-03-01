import LandingPage from "./LandingPage";
import { cookies } from "next/headers";
import { REGION_COOKIE_KEY, type Region } from "@/lib/region";

export default async function Page() {
  const cookieStore = await cookies();
  const rawRegion = cookieStore.get(REGION_COOKIE_KEY)?.value;
  const initialRegion: Region | null = rawRegion === "US" || rawRegion === "UK" ? rawRegion : null;
  return <LandingPage initialRegion={initialRegion} />;
}