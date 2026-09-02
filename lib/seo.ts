import type { Metadata } from "next";

export const SITE_URL = "https://agentrankradar.com";
export const SITE_NAME = "AgentRank Radar";
export const SITE_TAGLINE = "The 24/7 Radar for Your AI Answer Visibility";

interface PageMetadataInput {
  title: string;
  description: string;
  path: string;
}

/** Builds per-page metadata with the canonical URL and OpenGraph/Twitter card
 *  data every marketing page needs, so each page only has to state its title,
 *  description, and path once. */
export function pageMetadata({ title, description, path }: PageMetadataInput): Metadata {
  const url = `${SITE_URL}${path}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export interface FaqItem {
  q: string;
  a: string;
}
