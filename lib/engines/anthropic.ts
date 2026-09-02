import type { EngineProvider, EngineQuery, EngineQueryResult } from "./types";
import { extractMentionedEntities, extractCitedDomains } from "./extract";
import { mockEngineQuery } from "./mock";

export const anthropicProvider: EngineProvider = {
  slug: "claude",

  isConfigured() {
    return Boolean(process.env.ANTHROPIC_API_KEY);
  },

  async query(input: EngineQuery): Promise<EngineQueryResult> {
    if (!this.isConfigured()) return mockEngineQuery("claude", input);

    const start = Date.now();
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 1024,
        messages: [{ role: "user", content: input.prompt }],
        // Without this, Claude answers from static training data (no live
        // grounding) — confirmed empirically while wiring this up: the same
        // prompt without the tool returned a stale "(2024)" answer, and with
        // it returned a correctly-dated, citation-backed one.
        tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 3 }],
      }),
    });

    if (!res.ok) throw new Error(`Anthropic request failed: ${res.status} ${await res.text()}`);

    const data = await res.json();
    const textBlocks = (data.content ?? []).filter((block: { type: string }) => block.type === "text");
    const rawResponse: string = textBlocks.map((block: { text: string }) => block.text).join("");

    const citedDomains = Array.from(
      new Set(
        textBlocks
          .flatMap((block: { citations?: { type: string; url?: string }[] }) => block.citations ?? [])
          .filter((c: { type: string }) => c.type === "web_search_result_location")
          .map((c: { url?: string }) => {
            try {
              return c.url ? new URL(c.url).hostname.replace(/^www\./, "") : null;
            } catch {
              return null;
            }
          })
          .filter(Boolean)
      )
    ) as string[];

    return {
      engine: "claude",
      rawResponse,
      mentionedEntities: extractMentionedEntities(rawResponse, input.projectName, input.competitorNames),
      citedDomains: citedDomains.length ? citedDomains : extractCitedDomains(rawResponse),
      latencyMs: Date.now() - start,
      tokensUsed: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0) || null,
    };
  },
};
