import { createServiceClient } from "@/lib/supabase/server";
import { getAllProviders } from "@/lib/engines";
import { computeVisibilityScore } from "@/lib/scoring";
import { detectAndCreateAlerts } from "@/lib/alerts";
import type { Prompt, Competitor, Project, MentionedEntity, EngineSlug } from "@/lib/types";

interface RunProjectPromptsOptions {
  project: Pick<Project, "id" | "name" | "organization_id">;
  prompts: Pick<Prompt, "id" | "text">[];
  competitors: Pick<Competitor, "name">[];
}

/**
 * Runs `fn` over `items` with at most `limit` in flight at once — real
 * provider calls are far slower than the mock fallback (seconds, not
 * milliseconds), and a fully sequential loop across dozens of prompts times
 * out Vercel's function budget long before finishing (confirmed directly:
 * a real run against ~65 prompts × 4 engines hit the 300s ceiling). Each
 * engine's prompts still queue behind this limit to stay polite to that
 * provider's own rate limits, per docs/PRD.md §5.1.
 */
async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const current = nextIndex++;
      results[current] = await fn(items[current]!);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

const PROMPT_CONCURRENCY_PER_ENGINE = 5;

/**
 * Runs every active prompt for a project against every configured engine,
 * persists one prompt_results row per (prompt, engine, day), then rolls the
 * day's results up into visibility_scores (overall + per engine). Intended
 * to run from a scheduled job, not a user-facing request.
 */
export async function runProjectPrompts({ project, prompts, competitors }: RunProjectPromptsOptions) {
  const supabase = createServiceClient();
  const providers = getAllProviders();
  const competitorNames = competitors.map((c) => c.name);
  const scoreDate = new Date().toISOString().slice(0, 10);

  const { data: engineRows } = await supabase.from("engines").select("id, slug");
  const engineIdBySlug = new Map((engineRows ?? []).map((e: { id: string; slug: string }) => [e.slug, e.id]));

  async function runOnePrompt(
    provider: (typeof providers)[number],
    engineId: string,
    prompt: Pick<Prompt, "id" | "text">
  ): Promise<{ mentionedEntities: MentionedEntity[] } | null> {
    let result: Awaited<ReturnType<typeof provider.query>>;
    try {
      result = await provider.query({
        prompt: prompt.text,
        projectName: project.name,
        competitorNames,
      });
    } catch (error) {
      // One engine being down (rate limit, billing, outage) shouldn't
      // lose results the other engines already produced for this run.
      console.error(`[runner] ${provider.slug} failed for prompt "${prompt.text}":`, error);
      return null;
    }

    const projectEntity = result.mentionedEntities.find((e) => e.is_project);
    const mentionType = !projectEntity
      ? "not_mentioned"
      : projectEntity.rank_position === 1
        ? "top_pick"
        : "mentioned";

    const { data: upserted } = await supabase
      .from("prompt_results")
      .upsert(
        {
          prompt_id: prompt.id,
          engine_id: engineId,
          run_date: scoreDate,
          mention_type: mentionType,
          rank_position: projectEntity?.rank_position ?? null,
          raw_response: result.rawResponse,
          mentioned_entities: result.mentionedEntities,
          latency_ms: result.latencyMs,
          tokens_used: result.tokensUsed,
        },
        { onConflict: "prompt_id,engine_id,run_date" }
      )
      .select("id")
      .single();

    if (upserted && result.citedDomains.length) {
      await supabase.from("citations").insert(
        result.citedDomains.map((domain) => ({
          prompt_result_id: upserted.id,
          project_id: project.id,
          domain,
          mentions_project: Boolean(projectEntity),
        }))
      );
    }

    return { mentionedEntities: result.mentionedEntities };
  }

  const engineResultLists = await Promise.all(
    providers.map(async (provider) => {
      const engineId = engineIdBySlug.get(provider.slug);
      if (!engineId) return [provider.slug, []] as [EngineSlug, { mentionedEntities: MentionedEntity[] }[]];

      const outcomes = await mapWithConcurrency(prompts, PROMPT_CONCURRENCY_PER_ENGINE, (prompt) =>
        runOnePrompt(provider, engineId, prompt)
      );
      const results = outcomes.filter((r): r is { mentionedEntities: MentionedEntity[] } => r !== null);
      return [provider.slug, results] as [EngineSlug, { mentionedEntities: MentionedEntity[] }[]];
    })
  );

  const allResultsByEngine = new Map(engineResultLists);
  const allResultsCombined = engineResultLists.flatMap(([, results]) => results);
  const overall = computeVisibilityScore(allResultsCombined, project.name);

  await supabase.from("visibility_scores").upsert(
    {
      project_id: project.id,
      engine_id: null,
      score_date: scoreDate,
      visibility_score: overall.visibilityScore,
      mention_frequency: overall.mentionFrequency,
      share_of_voice: overall.shareOfVoice,
      avg_position: overall.avgPosition,
      prompts_tracked: overall.promptsTracked,
      prompts_mentioned: overall.promptsMentioned,
    },
    { onConflict: "project_id,engine_id,score_date" }
  );

  await Promise.all(
    Array.from(allResultsByEngine.entries()).map(async ([slug, results]) => {
      const engineId = engineIdBySlug.get(slug);
      if (!engineId) return;
      const perEngine = computeVisibilityScore(results, project.name);

      await supabase.from("visibility_scores").upsert(
        {
          project_id: project.id,
          engine_id: engineId,
          score_date: scoreDate,
          visibility_score: perEngine.visibilityScore,
          mention_frequency: perEngine.mentionFrequency,
          share_of_voice: perEngine.shareOfVoice,
          avg_position: perEngine.avgPosition,
          prompts_tracked: perEngine.promptsTracked,
          prompts_mentioned: perEngine.promptsMentioned,
        },
        { onConflict: "project_id,engine_id,score_date" }
      );
    })
  );

  await detectAndCreateAlerts({
    projectId: project.id,
    organizationId: project.organization_id,
    projectName: project.name,
  });

  return overall;
}
