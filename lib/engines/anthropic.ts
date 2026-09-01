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
      }),
    });

    if (!res.ok) throw new Error(`Anthropic request failed: ${res.status} ${await res.text()}`);

    const data = await res.json();
    const rawResponse: string = data.content?.[0]?.text ?? "";

    return {
      engine: "claude",
      rawResponse,
      mentionedEntities: extractMentionedEntities(rawResponse, input.projectName, input.competitorNames),
      citedDomains: extractCitedDomains(rawResponse),
      latencyMs: Date.now() - start,
      tokensUsed: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0) || null,
    };
  },
};
