import { createServiceClient, isSupabaseServiceConfigured } from "@/lib/supabase/server";
import { computeVisibilityScore } from "@/lib/scoring";
import type { EngineSlug, MentionedEntity, MentionType } from "@/lib/types";
import * as demo from "@/lib/demo-data";

// There's no Clerk session (and no project switcher UI) yet, so every query
// below is scoped to the one project seeded in supabase/seed.sql rather than
// resolved from an authenticated org. Swap this for a real lookup once
// Clerk is wired — see docs/ROADMAP.md.
export const DEMO_PROJECT_ID = "00000000-0000-0000-0000-000000000010";
export const DEMO_ORG_ID = "00000000-0000-0000-0000-000000000001";

const ENGINE_LABELS: Record<EngineSlug, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude",
  gemini: "Gemini",
  perplexity: "Perplexity",
};

/**
 * Every function here follows the same shape: skip the network call
 * entirely when the service-role key isn't configured, and fall back to the
 * same demo dataset on any query error, so a dashboard page never crashes
 * because Supabase isn't wired up yet or a request failed transiently.
 */
async function withFallback<T>(fallback: T, run: () => Promise<T>): Promise<T> {
  if (!isSupabaseServiceConfigured) return fallback;
  try {
    return await run();
  } catch (error) {
    console.error("[lib/queries] falling back to demo data:", error);
    return fallback;
  }
}

export async function getProject(projectId = DEMO_PROJECT_ID) {
  return withFallback(demo.demoProject, async () => {
    const supabase = createServiceClient();
    const { data, error } = await supabase.from("projects").select("id, name, slug, website_url, industry").eq("id", projectId).single();
    if (error) throw error;
    return data;
  });
}

export async function getCompetitors(projectId = DEMO_PROJECT_ID) {
  return withFallback(demo.demoCompetitors, async () => {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("competitors")
      .select("id, name, website_url, is_primary")
      .eq("project_id", projectId)
      .order("is_primary", { ascending: false });
    if (error) throw error;
    return data;
  });
}

export async function getOverallScore(projectId = DEMO_PROJECT_ID) {
  return withFallback(demo.demoOverallScore, async () => {
    const supabase = createServiceClient();
    const { data: rows, error } = await supabase
      .from("visibility_scores")
      .select("visibility_score, mention_frequency, share_of_voice, avg_position, score_date")
      .eq("project_id", projectId)
      .is("engine_id", null)
      .order("score_date", { ascending: false })
      .limit(2);
    if (error) throw error;
    if (!rows?.length) return demo.demoOverallScore;

    const [latest, previous] = rows as [(typeof rows)[number], (typeof rows)[number] | undefined];
    return {
      visibilityScore: Number(latest.visibility_score),
      mentionFrequency: Number(latest.mention_frequency),
      shareOfVoice: Number(latest.share_of_voice),
      avgPosition: latest.avg_position === null ? null : Number(latest.avg_position),
      trend: previous ? Number(latest.visibility_score) - Number(previous.visibility_score) : 0,
    };
  });
}

export async function getEngineScores(projectId = DEMO_PROJECT_ID) {
  return withFallback(demo.demoEngineScores, async () => {
    const supabase = createServiceClient();
    const { data: engines, error: engineError } = await supabase.from("engines").select("id, slug");
    if (engineError) throw engineError;

    const results = await Promise.all(
      (engines ?? []).map(async (engine: { id: string; slug: EngineSlug }) => {
        const { data: rows, error } = await supabase
          .from("visibility_scores")
          .select("visibility_score, mention_frequency, score_date")
          .eq("project_id", projectId)
          .eq("engine_id", engine.id)
          .order("score_date", { ascending: false })
          .limit(2);
        if (error) throw error;
        if (!rows?.length) return null;

        const [latest, previous] = rows as [(typeof rows)[number], (typeof rows)[number] | undefined];
        return {
          engine: engine.slug,
          label: ENGINE_LABELS[engine.slug],
          score: Number(latest.visibility_score),
          mentionFrequency: Number(latest.mention_frequency),
          trend: previous ? Number(latest.visibility_score) - Number(previous.visibility_score) : 0,
        };
      })
    );

    const rows = results.filter((r): r is NonNullable<typeof r> => r !== null);
    return rows.length ? rows : demo.demoEngineScores;
  });
}

export async function getScoreTrend(projectId = DEMO_PROJECT_ID, days = 60) {
  return withFallback(demo.demoTrend, async () => {
    const supabase = createServiceClient();
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("visibility_scores")
      .select("score_date, visibility_score")
      .eq("project_id", projectId)
      .is("engine_id", null)
      .gte("score_date", since)
      .order("score_date", { ascending: true });
    if (error) throw error;
    if (!data?.length) return demo.demoTrend;

    return data.map((row: { score_date: string; visibility_score: number }) => ({
      date: new Date(row.score_date).toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
      score: Number(row.visibility_score),
    }));
  });
}

interface PromptResultRow {
  id: string;
  text: string;
  category: string | null;
  engine_slug: EngineSlug;
  mention_type: MentionType;
  rank_position: number | null;
}

export async function getPromptResults(projectId = DEMO_PROJECT_ID): Promise<PromptResultRow[]> {
  const fallback: PromptResultRow[] = demo.demoPrompts.map((p) => ({
    id: p.id,
    text: p.text,
    category: p.category,
    engine_slug: p.engine as EngineSlug,
    mention_type: p.mentionType,
    rank_position: p.position,
  }));

  return withFallback(fallback, async () => {
    const supabase = createServiceClient();
    const { data: prompts, error: promptError } = await supabase
      .from("prompts")
      .select("id, text, category")
      .eq("project_id", projectId)
      .eq("status", "active");
    if (promptError) throw promptError;
    if (!prompts?.length) return fallback;

    const { data: results, error: resultError } = await supabase
      .from("prompt_results")
      .select("prompt_id, mention_type, rank_position, engines(slug)")
      .in(
        "prompt_id",
        prompts.map((p: { id: string }) => p.id)
      );
    if (resultError) throw resultError;

    const promptById = new Map(prompts.map((p: { id: string; text: string; category: string | null }) => [p.id, p]));

    const rows: PromptResultRow[] = (results ?? []).map(
      (r: { prompt_id: string; mention_type: MentionType; rank_position: number | null; engines: { slug: EngineSlug } | { slug: EngineSlug }[] }) => {
        const prompt = promptById.get(r.prompt_id)!;
        const engineSlug = Array.isArray(r.engines) ? r.engines[0]?.slug : r.engines?.slug;
        return {
          id: r.prompt_id,
          text: prompt.text,
          category: prompt.category,
          engine_slug: engineSlug ?? "chatgpt",
          mention_type: r.mention_type,
          rank_position: r.rank_position,
        };
      }
    );

    return rows.length ? rows : fallback;
  });
}

export async function getCitationSummary(projectId = DEMO_PROJECT_ID) {
  return withFallback(demo.demoCitations, async () => {
    const supabase = createServiceClient();
    const { data, error } = await supabase.from("citations").select("domain, source_type").eq("project_id", projectId);
    if (error) throw error;
    if (!data?.length) return demo.demoCitations;

    const counts = new Map<string, { domain: string; sourceType: string; mentions: number }>();
    for (const row of data as { domain: string; source_type: string }[]) {
      const existing = counts.get(row.domain);
      if (existing) existing.mentions += 1;
      else counts.set(row.domain, { domain: row.domain, sourceType: row.source_type, mentions: 1 });
    }

    return Array.from(counts.values()).sort((a, b) => b.mentions - a.mentions) as typeof demo.demoCitations;
  });
}

export async function getRecommendations(projectId = DEMO_PROJECT_ID) {
  return withFallback(demo.demoRecommendations, async () => {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("recommendations")
      .select("id, title, description, category, impact_estimate, cursor_agent_id, cursor_status, cursor_pr_url")
      .eq("project_id", projectId)
      .eq("status", "open")
      .order("created_at", { ascending: false });
    if (error) throw error;
    if (!data?.length) return demo.demoRecommendations;

    return data.map(
      (r: {
        id: string;
        title: string;
        description: string;
        category: string;
        impact_estimate: string | null;
        cursor_agent_id: string | null;
        cursor_status: string | null;
        cursor_pr_url: string | null;
      }) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        category: r.category as (typeof demo.demoRecommendations)[number]["category"],
        impact: (r.impact_estimate ?? "medium") as "high" | "medium" | "low",
        cursorAgentId: r.cursor_agent_id,
        cursorStatus: r.cursor_status,
        cursorPrUrl: r.cursor_pr_url,
      })
    );
  });
}

export async function getAlerts(organizationId = DEMO_ORG_ID) {
  return withFallback(demo.demoAlerts, async () => {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("alerts")
      .select("id, alert_type, title, body, created_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) throw error;
    if (!data?.length) return demo.demoAlerts;

    return data.map((a: { id: string; alert_type: string; title: string; body: string; created_at: string }) => ({
      id: a.id,
      type: a.alert_type as (typeof demo.demoAlerts)[number]["type"],
      title: a.title,
      body: a.body,
      createdAt: a.created_at.slice(0, 10),
    }));
  });
}

/**
 * There's no per-competitor row in visibility_scores (see docs/PRD.md's
 * out-of-scope notes) — a competitor's score is derived on read by rerunning
 * computeVisibilityScore() with that competitor's mentions swapped into the
 * is_project slot, reusing the exact same scoring logic applied to the
 * tracked project.
 */
export async function getCompetitorComparison(projectId = DEMO_PROJECT_ID) {
  return withFallback(demo.demoCompetitorComparison, async () => {
    const supabase = createServiceClient();
    const project = await getProject(projectId);
    const competitors = await getCompetitors(projectId);

    const { data: prompts, error: promptError } = await supabase.from("prompts").select("id").eq("project_id", projectId);
    if (promptError) throw promptError;
    if (!prompts?.length) return demo.demoCompetitorComparison;

    const { data: results, error: resultError } = await supabase
      .from("prompt_results")
      .select("mentioned_entities")
      .in(
        "prompt_id",
        prompts.map((p: { id: string }) => p.id)
      );
    if (resultError) throw resultError;
    if (!results?.length) return demo.demoCompetitorComparison;

    const entitySets = (results as { mentioned_entities: MentionedEntity[] }[]).map((r) => r.mentioned_entities ?? []);

    const scoreFor = (subjectName: string) =>
      computeVisibilityScore(
        entitySets.map((entities) => ({
          mentionedEntities: entities.map((e) => ({ ...e, is_project: e.name === subjectName })),
        })),
        subjectName
      ).visibilityScore;

    const rows = [
      { name: `${project.name} (you)`, score: scoreFor(project.name), isYou: true },
      ...competitors.map((c: { name: string }) => ({ name: c.name, score: scoreFor(c.name), isYou: false })),
    ];

    return rows.sort((a, b) => b.score - a.score);
  });
}

export async function getSubscription(organizationId = DEMO_ORG_ID) {
  return withFallback(demo.demoSubscription, async () => {
    const supabase = createServiceClient();

    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("stripe_customer_id")
      .eq("id", organizationId)
      .single();
    if (orgError) throw orgError;

    const { data: sub, error: subError } = await supabase
      .from("subscriptions")
      .select("plan_tier, status, current_period_end, cancel_at_period_end")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (subError) throw subError;

    if (!sub) {
      return {
        planTier: null,
        status: "none" as const,
        stripeCustomerId: org?.stripe_customer_id ?? null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      };
    }

    return {
      planTier: sub.plan_tier as (typeof demo.demoSubscription)["planTier"],
      status: sub.status as (typeof demo.demoSubscription)["status"],
      stripeCustomerId: org?.stripe_customer_id ?? null,
      currentPeriodEnd: sub.current_period_end,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    };
  });
}
