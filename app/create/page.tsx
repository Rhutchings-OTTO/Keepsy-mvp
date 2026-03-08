import type { Metadata } from "next";
import { MerchGeneratorPlatformLoader as MerchGeneratorPlatform } from "./MerchGeneratorPlatformLoader";
import { ConversionFlowProvider } from "@/context/ConversionFlowContext";
import { GenerationProvider, SonicBoomEffect } from "@/context/GenerationContext";
import { LenisProvider } from "@/components/LenisProvider";
import { ExitGuardian } from "@/components/ExitGuardian";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Design Your Own Personalised Gift | Create Custom Prints — Keepsy",
  description: "Design your own personalised gift in seconds. Describe what you'd like or upload a photo — we'll turn it into a beautiful custom print on hoodies, mugs, t-shirts, cards or canvas. Preview before ordering.",
  alternates: { canonical: "https://keepsy.store/create" },
  openGraph: {
    title: "Design Your Own Personalised Gift | Create Custom Prints — Keepsy",
    description: "Design your own personalised gift in seconds. Describe what you'd like or upload a photo — we'll turn it into a beautiful custom print on hoodies, mugs, t-shirts, cards or canvas. Preview before ordering.",
    type: "website",
    url: "https://keepsy.store/create",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Keepsy personalised gift creator" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Design Your Own Personalised Gift | Create Custom Prints — Keepsy",
    description: "Design your own personalised gift in seconds. Describe what you'd like or upload a photo — we'll turn it into a beautiful custom print on hoodies, mugs, t-shirts, cards or canvas. Preview before ordering.",
    images: ["/twitter-image"],
  },
};

type CreatePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(params: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const raw = params?.[key];
  if (Array.isArray(raw)) return raw[0];
  return typeof raw === "string" ? raw : undefined;
}

export default async function CreatePage({ searchParams }: CreatePageProps) {
  const resolvedParams = (await searchParams) ?? {};
  return (
    <ConversionFlowProvider>
      <GenerationProvider>
        <LenisProvider>
          <SonicBoomEffect />
        <ExitGuardian />
        <MerchGeneratorPlatform
        initialQuery={{
          product: readParam(resolvedParams, "product"),
          prompt: readParam(resolvedParams, "prompt"),
          style: readParam(resolvedParams, "style"),
          occasion: readParam(resolvedParams, "occasion"),
          success: readParam(resolvedParams, "success") === "1",
          canceled: readParam(resolvedParams, "canceled") === "1",
        }}
      />
        </LenisProvider>
      </GenerationProvider>
    </ConversionFlowProvider>
  );
}
