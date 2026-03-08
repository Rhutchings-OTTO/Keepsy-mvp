import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const disallow = ["/api/", "/admin/", "/debug/", "/perf/", "/track", "/success", "/account"];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow,
      },
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow,
      },
      {
        userAgent: "ChatGPT-User",
        allow: "/",
        disallow,
      },
      {
        userAgent: "anthropic-ai",
        allow: "/",
        disallow,
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow,
      },
      {
        userAgent: "Google-Extended",
        allow: "/",
        disallow,
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow,
      },
    ],
    sitemap: "https://keepsy.store/sitemap.xml",
  };
}
