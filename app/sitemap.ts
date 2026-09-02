import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

const STATIC_PATHS: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" }[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/pricing", priority: 0.9, changeFrequency: "weekly" },
  { path: "/ai-search-seo", priority: 0.8, changeFrequency: "weekly" },
  { path: "/chatgpt-ranking-checker", priority: 0.8, changeFrequency: "weekly" },
  { path: "/claude-ranking-checker", priority: 0.8, changeFrequency: "weekly" },
  { path: "/monitor-chatgpt-mentions", priority: 0.8, changeFrequency: "weekly" },
  { path: "/best-shopify-apps-ai-visibility", priority: 0.7, changeFrequency: "weekly" },
  { path: "/agency", priority: 0.6, changeFrequency: "monthly" },
  { path: "/about", priority: 0.4, changeFrequency: "monthly" },
  { path: "/blog", priority: 0.5, changeFrequency: "weekly" },
  { path: "/changelog", priority: 0.4, changeFrequency: "weekly" },
  { path: "/contact", priority: 0.3, changeFrequency: "monthly" },
  { path: "/careers", priority: 0.2, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.2, changeFrequency: "monthly" },
  { path: "/terms", priority: 0.2, changeFrequency: "monthly" },
  { path: "/security", priority: 0.2, changeFrequency: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return STATIC_PATHS.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
