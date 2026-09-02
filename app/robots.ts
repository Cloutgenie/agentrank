import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Search crawlers and AI answer-engine crawlers both need explicit access —
// a generic Disallow rule silently blocks GPTBot/ClaudeBot/PerplexityBot too,
// which would keep this site out of the exact answer engines it tracks.
export default function robots(): MetadataRoute.Robots {
  const disallow = ["/dashboard", "/api/", "/sign-in", "/sign-up"];

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      { userAgent: "GPTBot", allow: "/", disallow },
      { userAgent: "ChatGPT-User", allow: "/", disallow },
      { userAgent: "OAI-SearchBot", allow: "/", disallow },
      { userAgent: "ClaudeBot", allow: "/", disallow },
      { userAgent: "anthropic-ai", allow: "/", disallow },
      { userAgent: "Claude-Web", allow: "/", disallow },
      { userAgent: "PerplexityBot", allow: "/", disallow },
      { userAgent: "Perplexity-User", allow: "/", disallow },
      { userAgent: "Google-Extended", allow: "/", disallow },
      { userAgent: "GoogleOther", allow: "/", disallow },
      { userAgent: "CCBot", allow: "/", disallow },
      { userAgent: "Bytespider", allow: "/", disallow },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
