import { SITE_URL, SITE_NAME, type FaqItem } from "@/lib/seo";

export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    description:
      "AgentRank Radar continuously scans ChatGPT, Claude, Gemini, and Perplexity for how often they recommend a company vs. its competitors, and tells teams what content to publish to win the AI answer.",
    sameAs: [],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function FaqJsonLd({ faq }: { faq: FaqItem[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function SoftwareApplicationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "AgentRank Radar continuously scans ChatGPT, Claude, Gemini, and Perplexity for how often they recommend a company vs. its competitors, and tells teams what content to publish to win the AI answer.",
    offers: [
      { "@type": "Offer", name: "Starter", price: "29", priceCurrency: "USD", url: `${SITE_URL}/pricing` },
      { "@type": "Offer", name: "Growth", price: "99", priceCurrency: "USD", url: `${SITE_URL}/pricing` },
      { "@type": "Offer", name: "Agency", price: "299", priceCurrency: "USD", url: `${SITE_URL}/pricing` },
    ],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
