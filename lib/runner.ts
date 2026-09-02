import { createServiceClient } from "@/lib/supabase/server";
import { getAllProviders } from "@/lib/engines";
import { computeVisibilityScore } from "@/lib/scoring";
import type { Prompt, Competitor, Project, MentionedEntity } from "@/lib/types";

interface RunProjectPromptsOptions {
  project: Pick<Project, "id" | "name">;
  prompts: Pick<Prompt, "id" | "text">[];
  competitors: Pick<Competitor, "name">[];
}

/**
 * Runs every active prompt for a project against every configured engine,
 * persists one prompt_results row per (prompt, engine, day), then rolls the
 * day's results up into visibility_scores (overall + per engine). Intended
 * to run from a scheduled job (Supabase Edge Function / cron), not a
 * user-facing request — it can take minutes for a project with hundreds of
 * prompts across four engines.
 */
export async function runProjectPrompts({ project, prompts, competitors }: RunProjectPromptsOptions) {
  const supabase = createServiceClient();
  const providers = getAllProviders();
  const competitorNames = competitors.map((c) => c.name);

  const { data: engineRows } = await supabase.from("engines").select("id, slug");
  const engineIdBySlug = new Map((engineRows ?? []).map((e: { id: string; slug: string }) => [e.slug, e.id]));

  const allResultsByEngine = new Map<string, { mentionedEntities: MentionedEntity[] }[]>();

  for (const provider of providers) {
    const engineId = engineIdBySlug.get(provider.slug);
    if (!engineId) continue;

    const engineResults: { mentionedEntities: MentionedEntity[] }[] = [];

    for (const prompt of prompts) {
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
        continue;
      }

      const projectEntity = result.mentionedEntities.find((e) => e.is_project);
      const mentionType = !projectEntity
        ? "not_mentioned"
        : projectEntity.rank_position === 1
          ? "top_pick"
          : "mentioned";

      await supabase.from("prompt_results").upsert(
        {
          prompt_id: prompt.id,
          engine_id: engineId,
          run_date: new Date().toISOString().slice(0, 10),
          mention_type: mentionType,
          rank_position: projectEntity?.rank_position ?? null,
          raw_response: result.rawResponse,
          mentioned_entities: result.mentionedEntities,
          latency_ms: result.latencyMs,
          tokens_used: result.tokensUsed,
        },
        { onConflict: "prompt_id,engine_id,run_date" }
      );

      if (result.citedDomains.length) {
        const { data: insertedResult } = await supabase
          .from("prompt_results")
          .select("id")
          .eq("prompt_id", prompt.id)
          .eq("engine_id", engineId)
          .eq("run_date", new Date().toISOString().slice(0, 10))
          .single();

        if (insertedResult) {
          await supabase.from("citations").insert(
            result.citedDomains.map((domain) => ({
              prompt_result_id: insertedResult.id,
              project_id: project.id,
              domain,
              mentions_project: Boolean(projectEntity),
            }))
          );
        }
      }

      engineResults.push({ mentionedEntities: result.mentionedEntities });
    }

    allResultsByEngine.set(provider.slug, engineResults);
  }

  const scoreDate = new Date().toISOString().slice(0, 10);
  const allResultsCombined = Array.from(allResultsByEngine.values()).flat();
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

  for (const [slug, results] of allResultsByEngine) {
    const engineId = engineIdBySlug.get(slug);
    if (!engineId) continue;
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
  }

  return overall;
}
