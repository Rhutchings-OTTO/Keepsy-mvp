import MerchGeneratorPlatform from "../MerchGeneratorPlatform";

export const dynamic = "force-dynamic";

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
    <MerchGeneratorPlatform
      initialQuery={{
        product: readParam(resolvedParams, "product"),
        style: readParam(resolvedParams, "style"),
        occasion: readParam(resolvedParams, "occasion"),
        success: readParam(resolvedParams, "success") === "1",
        canceled: readParam(resolvedParams, "canceled") === "1",
      }}
    />
  );
}
