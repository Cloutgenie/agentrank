import type { EngineSlug, MentionedEntity } from "@/lib/types";
import type { EngineQuery, EngineQueryResult } from "./types";

const MOCK_DOMAINS = ["reddit.com", "g2.com", "trustpilot.com", "techcrunch.com", "github.com"];

// Deterministic pseudo-random so the same (engine, prompt, project) pair
// always mocks the same result in dev/demo — no flicker between reloads.
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 1000) / 1000;
}

export async function mockEngineQuery(engine: EngineSlug, input: EngineQuery): Promise<EngineQueryResult> {
  const seed = `${engine}:${input.prompt}:${input.projectName}`;
  const r = seededRandom(seed);

  const allBrands = [input.projectName, ...input.competitorNames];
  const mentionedCount = 1 + Math.floor(r * allBrands.length);
  const shuffled = [...allBrands].sort((a, b) => seededRandom(a + seed) - seededRandom(b + seed));
  const mentioned = shuffled.slice(0, mentionedCount);

  const mentionedEntities: MentionedEntity[] = mentioned.map((name, i) => ({
    name,
    is_project: name === input.projectName,
    rank_position: i + 1,
    sentiment: r > 0.7 ? "positive" : r > 0.3 ? "neutral" : "negative",
  }));

  const projectMentioned = mentioned.includes(input.projectName);
  const citedDomains = MOCK_DOMAINS.filter((_, i) => seededRandom(seed + i) > 0.5);

  return {
    engine,
    rawResponse: `[MOCK] Response to "${input.prompt}" — ${
      projectMentioned ? `${input.projectName} is mentioned` : `${input.projectName} not mentioned`
    } among ${mentioned.join(", ")}. Set the corresponding API key in .env to replace this with a live answer.`,
    mentionedEntities,
    citedDomains,
    latencyMs: Math.round(400 + r * 1800),
    tokensUsed: null,
  };
}
