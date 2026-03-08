import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/debug/", "/perf/", "/mockup-previews/", "/api/", "/track/", "/success/", "/account/"],
    },
    sitemap: "https://keepsy.store/sitemap.xml",
  };
}
