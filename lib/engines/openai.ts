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
        model: "gpt-5-search-api",
        messages: [{ role: "user", content: input.prompt }],
      }),
    });

    if (!res.ok) throw new Error(`OpenAI request failed: ${res.status} ${await res.text()}`);

    const data = await res.json();
    const message = data.choices?.[0]?.message;
    const rawResponse: string = message?.content ?? "";

    // gpt-5-search-api returns structured url_citation annotations alongside
    // the grounded answer — prefer those over regex-scraping the response
    // text, falling back only if the model didn't attach any.
    const citedFromAnnotations: string[] = (message?.annotations ?? [])
      .map((a: { type: string; url_citation?: { url: string } }) => a.url_citation?.url)
      .filter(Boolean)
      .map((url: string) => {
        try {
          return new URL(url).hostname.replace(/^www\./, "");
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    return {
      engine: "chatgpt",
      rawResponse,
      mentionedEntities: extractMentionedEntities(rawResponse, input.projectName, input.competitorNames),
      citedDomains: citedFromAnnotations.length ? Array.from(new Set(citedFromAnnotations)) : extractCitedDomains(rawResponse),
      latencyMs: Date.now() - start,
      tokensUsed: data.usage?.total_tokens ?? null,
    };
  },
};
