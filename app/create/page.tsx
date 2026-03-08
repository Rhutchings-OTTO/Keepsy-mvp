import type { Metadata } from "next";
import { MerchGeneratorPlatformLoader as MerchGeneratorPlatform } from "./MerchGeneratorPlatformLoader";
import { ConversionFlowProvider } from "@/context/ConversionFlowContext";
import { GenerationProvider, SonicBoomEffect } from "@/context/GenerationContext";
import { LenisProvider } from "@/components/LenisProvider";
import { ExitGuardian } from "@/components/ExitGuardian";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create Your Custom Gift",
  description: "Design a unique personalised gift in seconds. Describe your memory, pick a product, and we'll bring it to life.",
  alternates: { canonical: "https://keepsy.store/create" },
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
