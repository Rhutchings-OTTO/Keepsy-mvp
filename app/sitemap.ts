import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://keepsy.store";
  const now = new Date();
  return [
    { url: base,                              lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${base}/shop`,                    lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${base}/create`,                  lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/gift-ideas`,              lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${base}/product/mug`,             lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/product/card`,            lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/product/tee`,             lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/product/hoodie`,          lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/about`,                   lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/community`,               lastModified: now, changeFrequency: "weekly",  priority: 0.6 },
    { url: `${base}/shipping`,                lastModified: now, changeFrequency: "yearly",  priority: 0.4 },
    { url: `${base}/refunds`,                 lastModified: now, changeFrequency: "yearly",  priority: 0.4 },
    { url: `${base}/terms`,                   lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${base}/privacy`,                 lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
  ];
}
