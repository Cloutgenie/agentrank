import type { EngineProvider, EngineQuery, EngineQueryResult } from "./types";
import { extractMentionedEntities, extractCitedDomains } from "./extract";
import { mockEngineQuery } from "./mock";

export const openaiProvider: EngineProvider = {
  slug: "chatgpt",

  isConfigured() {
    return Boolean(process.env.OPENAI_API_KEY);
  },

  async query(input: EngineQuery): Promise<EngineQueryResult> {
    if (!this.isConfigured()) return mockEngineQuery("chatgpt", input);

    const start = Date.now();
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-search-preview",
        messages: [{ role: "user", content: input.prompt }],
      }),
    });

    if (!res.ok) throw new Error(`OpenAI request failed: ${res.status} ${await res.text()}`);

    const data = await res.json();
    const rawResponse: string = data.choices?.[0]?.message?.content ?? "";

    return {
      engine: "chatgpt",
      rawResponse,
      mentionedEntities: extractMentionedEntities(rawResponse, input.projectName, input.competitorNames),
      citedDomains: extractCitedDomains(rawResponse),
      latencyMs: Date.now() - start,
      tokensUsed: data.usage?.total_tokens ?? null,
    };
  },
};
