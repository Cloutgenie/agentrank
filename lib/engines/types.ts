import type { EngineSlug, MentionedEntity } from "@/lib/types";

export interface EngineQuery {
  prompt: string;
  projectName: string;
  competitorNames: string[];
}

export interface EngineQueryResult {
  engine: EngineSlug;
  rawResponse: string;
  mentionedEntities: MentionedEntity[];
  citedDomains: string[];
  latencyMs: number;
  tokensUsed: number | null;
}

export interface EngineProvider {
  slug: EngineSlug;
  isConfigured(): boolean;
  query(input: EngineQuery): Promise<EngineQueryResult>;
}
