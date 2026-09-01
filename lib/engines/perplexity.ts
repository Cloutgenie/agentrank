import type { EngineProvider, EngineQuery, EngineQueryResult } from "./types";
import { extractMentionedEntities, extractCitedDomains } from "./extract";
import { mockEngineQuery } from "./mock";

export const perplexityProvider: EngineProvider = {
  slug: "perplexity",

  isConfigured() {
    return Boolean(process.env.PERPLEXITY_API_KEY);
  },

  async query(input: EngineQuery): Promise<EngineQueryResult> {
    if (!this.isConfigured()) return mockEngineQuery("perplexity", input);

    const start = Date.now();
    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [{ role: "user", content: input.prompt }],
      }),
    });

    if (!res.ok) throw new Error(`Perplexity request failed: ${res.status} ${await res.text()}`);

    const data = await res.json();
    const rawResponse: string = data.choices?.[0]?.message?.content ?? "";
    const citedFromApi: string[] = (data.citations ?? [])
      .map((url: string) => {
        try {
          return new URL(url).hostname.replace(/^www\./, "");
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    return {
      engine: "perplexity",
      rawResponse,
      mentionedEntities: extractMentionedEntities(rawResponse, input.projectName, input.competitorNames),
      citedDomains: citedFromApi.length ? citedFromApi : extractCitedDomains(rawResponse),
      latencyMs: Date.now() - start,
      tokensUsed: data.usage?.total_tokens ?? null,
    };
  },
};
