import type { EngineSlug } from "@/lib/types";
import type { EngineProvider } from "./types";
import { openaiProvider } from "./openai";
import { anthropicProvider } from "./anthropic";
import { googleProvider } from "./google";
import { perplexityProvider } from "./perplexity";

export const ENGINE_PROVIDERS: Record<EngineSlug, EngineProvider> = {
  chatgpt: openaiProvider,
  claude: anthropicProvider,
  gemini: googleProvider,
  perplexity: perplexityProvider,
};

export function getProvider(slug: EngineSlug): EngineProvider {
  return ENGINE_PROVIDERS[slug];
}

export function getAllProviders(): EngineProvider[] {
  return Object.values(ENGINE_PROVIDERS);
}

export type { EngineProvider, EngineQuery, EngineQueryResult } from "./types";
