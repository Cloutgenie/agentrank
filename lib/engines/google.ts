import type { EngineProvider, EngineQuery, EngineQueryResult } from "./types";
import { extractMentionedEntities, extractCitedDomains } from "./extract";
import { mockEngineQuery } from "./mock";

export const googleProvider: EngineProvider = {
  slug: "gemini",

  isConfigured() {
    return Boolean(process.env.GOOGLE_AI_API_KEY);
  },

  async query(input: EngineQuery): Promise<EngineQueryResult> {
    if (!this.isConfigured()) return mockEngineQuery("gemini", input);

    const start = Date.now();
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: input.prompt }] }],
        }),
      }
    );

    if (!res.ok) throw new Error(`Gemini request failed: ${res.status} ${await res.text()}`);

    const data = await res.json();
    const rawResponse: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    return {
      engine: "gemini",
      rawResponse,
      mentionedEntities: extractMentionedEntities(rawResponse, input.projectName, input.competitorNames),
      citedDomains: extractCitedDomains(rawResponse),
      latencyMs: Date.now() - start,
      tokensUsed: data.usageMetadata?.totalTokenCount ?? null,
    };
  },
};
