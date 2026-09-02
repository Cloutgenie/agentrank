import type { MetadataRoute } from "next";

const BASE_URL = "https://agentrank.ai";

const STATIC_PATHS: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] =
  [
    { path: "/", changeFrequency: "weekly", priority: 1 },
    { path: "/pricing", changeFrequency: "weekly", priority: 0.9 },
    { path: "/ai-search-seo", changeFrequency: "weekly", priority: 0.8 },
    { path: "/chatgpt-ranking-checker", changeFrequency: "weekly", priority: 0.8 },
    { path: "/claude-ranking-checker", changeFrequency: "weekly", priority: 0.8 },
    { path: "/monitor-chatgpt-mentions", changeFrequency: "weekly", priority: 0.7 },
    { path: "/best-shopify-apps-ai-visibility", changeFrequency: "weekly", priority: 0.7 },
    { path: "/vs/profound-vs-agentrank", changeFrequency: "daily", priority: 0.9 },
  ];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return STATIC_PATHS.map(({ path, changeFrequency, priority }) => ({
    url: `${BASE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
