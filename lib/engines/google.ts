import type { EngineProvider, EngineQuery, EngineQueryResult } from "./types";
import { extractMentionedEntities, extractCitedDomains } from "./extract";
import { mockEngineQuery } from "./mock";
import { fetchWithRetry } from "./fetch-with-retry";

export const googleProvider: EngineProvider = {
  slug: "gemini",
  maxConcurrency: 3,

  isConfigured() {
    return Boolean(process.env.GOOGLE_AI_API_KEY);
  },

  async query(input: EngineQuery): Promise<EngineQueryResult> {
    if (!this.isConfigured()) return mockEngineQuery("gemini", input);

    const start = Date.now();
    const res = await fetchWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: input.prompt }] }],
          // Without this, Gemini answers from static training data instead
          // of live results — same grounding requirement as the other three
          // providers. Requires billing enabled on the Google AI Studio
          // project tied to the API key; the free tier has zero grounding
          // quota and returns 429s otherwise.
          tools: [{ google_search: {} }],
        }),
      }
    );

    if (!res.ok) throw new Error(`Gemini request failed: ${res.status} ${await res.text()}`);

    const data = await res.json();
    const candidate = data.candidates?.[0];
    const rawResponse: string = (candidate?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("");

    const citedDomains = Array.from(
      new Set(
        (candidate?.groundingMetadata?.groundingChunks ?? [])
          .map((chunk: { web?: { uri?: string } }) => chunk.web?.uri)
          .filter(Boolean)
          .map((uri: string) => {
            try {
              return new URL(uri).hostname.replace(/^www\./, "");
            } catch {
              return null;
            }
          })
          .filter(Boolean)
      )
    ) as string[];

    return {
      engine: "gemini",
      rawResponse,
      mentionedEntities: extractMentionedEntities(rawResponse, input.projectName, input.competitorNames),
      citedDomains: citedDomains.length ? citedDomains : extractCitedDomains(rawResponse),
      latencyMs: Date.now() - start,
      tokensUsed: data.usageMetadata?.totalTokenCount ?? null,
    };
  },
};
