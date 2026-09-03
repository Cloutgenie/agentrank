import { createServiceClient } from "@/lib/supabase/server";
import { isResendConfigured, getResendClient, ALERTS_FROM_EMAIL } from "@/lib/email/resend";
import { SLACK_ELIGIBLE_TIERS } from "@/lib/plan-limits";
import type { AlertType, MentionedEntity } from "@/lib/types";

// A single day's score swing can be sampling noise from the LLM itself, not
// a real change (see docs/PRD.md §5.3) — both of these guard against
// firing on a one-off blip: DELTA_THRESHOLD is the minimum point swing that
// counts as "material," and requiring the same direction across the last
// two deltas (today-vs-yesterday AND yesterday-vs-day-before) is the
// "sustained across 2 runs" rule the PRD specifies.
const SCORE_DELTA_THRESHOLD = 8;

interface DetectAlertsInput {
  projectId: string;
  organizationId: string;
  projectName: string;
}

/**
 * Looks for score swings and competitor overtakes sustained across the last
 * two tracking runs, writes an `alerts` row for each, and emails the org's
 * members. Called from lib/runner.ts right after a run's scores are
 * persisted — the one place that already has a freshly computed score to
 * compare against history. Never throws: an alert failure must not fail the
 * tracking run that produced the data it's alerting about.
 */
export async function detectAndCreateAlerts({ projectId, organizationId, projectName }: DetectAlertsInput) {
  try {
    const supabase = createServiceClient();
    const firedTypes: { type: AlertType; title: string; body: string; metadata?: Record<string, unknown> }[] = [];

    firedTypes.push(...(await detectScoreSwing(supabase, projectId)));
    firedTypes.push(...(await detectCompetitorOvertakes(supabase, projectId, projectName)));

    for (const fired of firedTypes) {
      await createAndSendAlert(supabase, { projectId, organizationId, ...fired });
    }
  } catch (error) {
    console.error(`[alerts] detection failed for project ${projectId}:`, error);
  }
}

async function detectScoreSwing(
  supabase: ReturnType<typeof createServiceClient>,
  projectId: string
): Promise<{ type: AlertType; title: string; body: string }[]> {
  const { data: rows } = await supabase
    .from("visibility_scores")
    .select("visibility_score, score_date")
    .eq("project_id", projectId)
    .is("engine_id", null)
    .order("score_date", { ascending: false })
    .limit(3);

  if (!rows || rows.length < 3) return [];

  const [today, yesterday, dayBefore] = rows as { visibility_score: number; score_date: string }[];
  const deltaRecent = Number(today!.visibility_score) - Number(yesterday!.visibility_score);
  const deltaPrior = Number(yesterday!.visibility_score) - Number(dayBefore!.visibility_score);

  const sustained =
    Math.sign(deltaRecent) === Math.sign(deltaPrior) &&
    Math.sign(deltaRecent) !== 0 &&
    Math.abs(deltaRecent) >= SCORE_DELTA_THRESHOLD &&
    Math.abs(deltaPrior) >= SCORE_DELTA_THRESHOLD;

  if (!sustained) return [];

  const alreadyFired = await alertAlreadyFiredToday(supabase, projectId, deltaRecent > 0 ? "visibility_gained" : "visibility_lost");
  if (alreadyFired) return [];

  if (deltaRecent > 0) {
    return [
      {
        type: "visibility_gained" as const,
        title: "Your AI visibility is climbing",
        body: `Your visibility score has risen for two days running, up ${Math.abs(deltaRecent).toFixed(1)} points since yesterday and ${Math.abs(deltaPrior).toFixed(1)} points the day before.`,
      },
    ];
  }

  return [
    {
      type: "visibility_lost" as const,
      title: "Your AI visibility is dropping",
      body: `Your visibility score has fallen for two days running, down ${Math.abs(deltaRecent).toFixed(1)} points since yesterday and ${Math.abs(deltaPrior).toFixed(1)} points the day before.`,
    },
  ];
}

async function detectCompetitorOvertakes(
  supabase: ReturnType<typeof createServiceClient>,
  projectId: string,
  projectName: string
): Promise<{ type: AlertType; title: string; body: string; metadata: Record<string, unknown> }[]> {
  const { data: prompts } = await supabase.from("prompts").select("id").eq("project_id", projectId);
  const promptIds = (prompts ?? []).map((p: { id: string }) => p.id);
  if (!promptIds.length) return [];

  const { data: results } = await supabase
    .from("prompt_results")
    .select("prompt_id, run_date, mentioned_entities")
    .in("prompt_id", promptIds)
    .order("run_date", { ascending: false });

  type ResultRow = { prompt_id: string; run_date: string; mentioned_entities: MentionedEntity[] };
  const rows = (results ?? []) as ResultRow[];
  const dates = Array.from(new Set(rows.map((r) => r.run_date))).slice(0, 2);
  if (dates.length < 2) return [];
  const [latestDate, priorDate] = dates as [string, string];

  const overtakesOn = (date: string) => {
    const set = new Set<string>();
    for (const row of rows.filter((r) => r.run_date === date)) {
      const project = row.mentioned_entities.find((e) => e.is_project);
      if (!project || project.rank_position === null) continue;
      for (const entity of row.mentioned_entities) {
        if (entity.is_project || entity.rank_position === null) continue;
        if (entity.rank_position < project.rank_position) {
          set.add(`${row.prompt_id}::${entity.name}`);
        }
      }
    }
    return set;
  };

  const latestOvertakes = overtakesOn(latestDate);
  const priorOvertakes = overtakesOn(priorDate);
  const sustained = Array.from(latestOvertakes).filter((key) => priorOvertakes.has(key));
  if (!sustained.length) return [];

  const promptCountByCompetitor = new Map<string, number>();
  for (const key of sustained) {
    const competitor = key.split("::")[1]!;
    promptCountByCompetitor.set(competitor, (promptCountByCompetitor.get(competitor) ?? 0) + 1);
  }

  const alerts: { type: AlertType; title: string; body: string; metadata: Record<string, unknown> }[] = [];
  for (const [competitor, count] of promptCountByCompetitor) {
    const alreadyFired = await alertAlreadyFiredToday(supabase, projectId, "competitor_overtook", competitor);
    if (alreadyFired) continue;

    alerts.push({
      type: "competitor_overtook",
      title: `${competitor} overtook you`,
      body: `${competitor} has outranked ${projectName} on ${count} tracked prompt${count > 1 ? "s" : ""} for two tracking runs in a row.`,
      metadata: { competitor },
    });
  }

  return alerts;
}

async function alertAlreadyFiredToday(
  supabase: ReturnType<typeof createServiceClient>,
  projectId: string,
  alertType: AlertType,
  competitor?: string
): Promise<boolean> {
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  let query = supabase
    .from("alerts")
    .select("id")
    .eq("project_id", projectId)
    .eq("alert_type", alertType)
    .gte("created_at", todayStart.toISOString());

  if (competitor) query = query.contains("metadata", { competitor });

  const { data } = await query.limit(1);
  return Boolean(data?.length);
}

async function createAndSendAlert(
  supabase: ReturnType<typeof createServiceClient>,
  input: {
    projectId: string;
    organizationId: string;
    type: AlertType;
    title: string;
    body: string;
    metadata?: Record<string, unknown>;
  }
) {
  await supabase.from("alerts").insert({
    project_id: input.projectId,
    organization_id: input.organizationId,
    alert_type: input.type,
    channel: "email",
    title: input.title,
    body: input.body,
    metadata: input.metadata ?? {},
  });

  await sendToSlackIfEligible(supabase, input);

  if (!isResendConfigured) return;

  const { data: members } = await supabase
    .from("organization_members")
    .select("users(email)")
    .eq("organization_id", input.organizationId);

  const recipients = (members ?? [])
    .map((m: { users: { email: string } | { email: string }[] | null }) =>
      Array.isArray(m.users) ? m.users[0]?.email : m.users?.email
    )
    .filter((email: string | undefined): email is string => Boolean(email));

  if (!recipients.length) return;

  try {
    await getResendClient().emails.send({
      from: ALERTS_FROM_EMAIL,
      to: recipients,
      subject: input.title,
      text: input.body,
    });
  } catch (error) {
    // Email is a notification, not the source of truth — the alerts row
    // above already persisted, so a delivery failure shouldn't be treated
    // as the alert itself having failed.
    console.error(`[alerts] failed to email project ${input.projectId}:`, error);
  }
}

/** Slack alerts are Growth+ (docs/PRD.md §4.8) — delivered alongside email, not instead of it. */
async function sendToSlackIfEligible(
  supabase: ReturnType<typeof createServiceClient>,
  input: { organizationId: string; title: string; body: string }
) {
  const { data: org } = await supabase
    .from("organizations")
    .select("slack_webhook_url, plan_tier")
    .eq("id", input.organizationId)
    .single();

  if (!org?.slack_webhook_url || !SLACK_ELIGIBLE_TIERS.has(org.plan_tier)) return;

  try {
    await fetch(org.slack_webhook_url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: `*${input.title}*\n${input.body}` }),
    });
  } catch (error) {
    console.error(`[alerts] failed to post to Slack for org ${input.organizationId}:`, error);
  }
}
