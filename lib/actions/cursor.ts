"use server";

import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { createCursorAgent, getCursorRunStatus } from "@/lib/cursor";
import { createServiceClient } from "@/lib/supabase/server";

export async function launchCursorAgent(recommendationId: string) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const supabase = createServiceClient();
  const { data: recommendation } = await supabase
    .from("recommendations")
    .select("title, description")
    .eq("id", recommendationId)
    .single();

  if (!recommendation) redirect("/dashboard/recommendations");

  const promptText = [
    "Implement this AI-SEO recommendation for AgentRank.ai in this repo.",
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

  const supabase = createServiceClient();
  const { data: recommendation } = await supabase
    .from("recommendations")
    .select("cursor_agent_id, cursor_run_id")
    .eq("id", recommendationId)
    .single();

  if (recommendation?.cursor_agent_id && recommendation?.cursor_run_id) {
    const { status, prUrl } = await getCursorRunStatus(recommendation.cursor_agent_id, recommendation.cursor_run_id);
    await supabase
      .from("recommendations")
      .update({ cursor_status: status, cursor_pr_url: prUrl })
      .eq("id", recommendationId);
  }

  redirect("/dashboard/recommendations");
}
