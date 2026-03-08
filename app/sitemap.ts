// After deploying, submit https://keepsy.store/sitemap.xml to Google Search Console at https://search.google.com/search-console

import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://keepsy.store";
  const now = new Date();
  return [
    { url: `${base}`,                    lastModified: now, changeFrequency: "daily",   priority: 1.0 },
    { url: `${base}/shop`,               lastModified: now, changeFrequency: "daily",   priority: 0.95 },
    { url: `${base}/create`,             lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${base}/product/card`,       lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${base}/product/hoodie`,     lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${base}/product/mug`,        lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${base}/product/tee`,        lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${base}/gift-ideas`,         lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${base}/about`,              lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/community`,          lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${base}/faq`,                lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/shipping`,           lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/refunds`,            lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/terms`,              lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/privacy`,            lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/cookies`,            lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/sar`,                lastModified: now, changeFrequency: "monthly", priority: 0.2 },
  ];
}
