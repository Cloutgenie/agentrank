"use server";

import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { createCursorAgent, getCursorRunStatus } from "@/lib/cursor";
import { createServiceClient } from "@/lib/supabase/server";
import { recordOutcomeBaseline } from "@/lib/actions/recommendations";
import { getCurrentContext } from "@/lib/auth-context";

export async function launchCursorAgent(recommendationId: string) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const context = await getCurrentContext();
  // lib/cursor.ts always targets Agent Rank Radar's own repo (CURSOR_TARGET_REPO_URL)
  // — there's no per-customer repo wiring yet, so letting a real tenant
  // trigger this would open PRs against our codebase, not theirs. Restrict
  // to the seeded demo project until that's built.
  if (!context.isDemo) redirect("/dashboard/recommendations");

  const supabase = createServiceClient();
  const { data: recommendation } = await supabase
    .from("recommendations")
    .select("title, description, project_id")
    .eq("id", recommendationId)
    .single();

  if (!recommendation || recommendation.project_id !== context.projectId) redirect("/dashboard/recommendations");

  await recordOutcomeBaseline(recommendationId, "cursor_agent");

  const promptText = [
    "Implement this AI-SEO recommendation for Agent Rank Radar in this repo.",
    "",
    `Title: ${recommendation.title}`,
    `Description: ${recommendation.description}`,
    "",
    "Make the necessary code and content changes to accomplish this, following the existing conventions in the codebase.",
  ].join("\n");

  const { agentId, runId, status } = await createCursorAgent(promptText);

  await supabase
    .from("recommendations")
    .update({ cursor_agent_id: agentId, cursor_run_id: runId, cursor_status: status, cursor_pr_url: null })
    .eq("id", recommendationId);

  redirect("/dashboard/recommendations");
}

export async function refreshCursorAgentStatus(recommendationId: string) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const context = await getCurrentContext();
  const supabase = createServiceClient();
  const { data: recommendation } = await supabase
    .from("recommendations")
    .select("cursor_agent_id, cursor_run_id, project_id")
    .eq("id", recommendationId)
    .single();

  if (!recommendation || recommendation.project_id !== context.projectId) redirect("/dashboard/recommendations");

  if (recommendation?.cursor_agent_id && recommendation?.cursor_run_id) {
    const { status, prUrl } = await getCursorRunStatus(recommendation.cursor_agent_id, recommendation.cursor_run_id);
    await supabase
      .from("recommendations")
      .update({ cursor_status: status, cursor_pr_url: prUrl })
      .eq("id", recommendationId);
  }

  redirect("/dashboard/recommendations");
}
