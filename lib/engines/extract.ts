import type { MentionedEntity } from "@/lib/types";

const CITATION_URL_RE = /https?:\/\/(?:www\.)?([a-z0-9-]+(?:\.[a-z0-9-]+)+)/gi;

/**
 * Finds which brand names appear in a raw LLM answer and orders them by
 * first-occurrence position, which in practice tracks how AI engines list
 * recommendations closely enough to use as a rank proxy. Sentiment is a
 * coarse heuristic on nearby words — good enough to sort "top pick" from
 * "also consider", not a substitute for a real classifier.
 */
export function extractMentionedEntities(rawResponse: string, projectName: string, competitorNames: string[]): MentionedEntity[] {
  const candidates = [
    { name: projectName, isProject: true },
    ...competitorNames.map((name) => ({ name, isProject: false })),
  ];

  const found = candidates
    .map(({ name, isProject }) => {
      const index = rawResponse.toLowerCase().indexOf(name.toLowerCase());
      if (index === -1) return null;
      const window = rawResponse.slice(Math.max(0, index - 60), index + 120).toLowerCase();
      const sentiment = /best|top|recommend|excellent|leading|favorite/.test(window)
        ? "positive"
        : /avoid|worst|lacking|weak|limited|however/.test(window)
          ? "negative"
          : "neutral";
      return { name, is_project: isProject, index, sentiment } as const;
    })
    .filter((v): v is NonNullable<typeof v> => v !== null)
    .sort((a, b) => a.index - b.index);

  return found.map((entity, i) => ({
    name: entity.name,
    is_project: entity.is_project,
    rank_position: i + 1,
    sentiment: entity.sentiment,
  }));
}

export function extractCitedDomains(rawResponse: string): string[] {
  const domains = new Set<string>();
  for (const match of rawResponse.matchAll(CITATION_URL_RE)) {
    const domain = match[1]?.toLowerCase();
    if (domain) domains.add(domain);
  }
  return Array.from(domains);
}
