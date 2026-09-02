"use server";

import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getCurrentContext } from "@/lib/auth-context";

/**
 * Snapshots the project's current blended visibility score as the "before"
 * baseline the moment a recommendation is actioned — manually or via a
 * Cursor agent. This is the row that makes recommendation_outcomes real
 * evidence instead of a guess: without a baseline captured at action time,
 * there's nothing to compare the eventual "after" score against.
 */
export async function recordOutcomeBaseline(recommendationId: string, actionType: "manual" | "cursor_agent") {
  const supabase = createServiceClient();

  const { data: recommendation } = await supabase
    .from("recommendations")
    .select("project_id")
    .eq("id", recommendationId)
    .single();
  if (!recommendation) return;

  const { data: latestScore } = await supabase
    .from("visibility_scores")
    .select("visibility_score, score_date")
    .eq("project_id", recommendation.project_id)
    .is("engine_id", null)
    .order("score_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!latestScore) return;

  await supabase.from("recommendation_outcomes").upsert(
    {
      recommendation_id: recommendationId,
      project_id: recommendation.project_id,
      action_type: actionType,
      score_before: latestScore.visibility_score,
      score_before_date: latestScore.score_date,
    },
    { onConflict: "recommendation_id" }
  );

  await supabase.from("recommendations").update({ status: "in_progress" }).eq("id", recommendationId);
}

export async function markRecommendationActioned(recommendationId: string) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const context = await getCurrentContext();
  const supabase = createServiceClient();
  const { data: recommendation } = await supabase
    .from("recommendations")
    .select("project_id")
    .eq("id", recommendationId)
    .single();
  if (recommendation?.project_id !== context.projectId) redirect("/dashboard/recommendations");

  await recordOutcomeBaseline(recommendationId, "manual");
  redirect("/dashboard/recommendations");
}

/**
 * Fills in the "after" side once there's a newer score than the baseline —
 * call this any time after the recommendation shipped; it's a no-op (stays
 * pending) until a tracking run has actually produced a fresher score.
 */
export async function captureRecommendationResult(recommendationId: string) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const context = await getCurrentContext();
  const supabase = createServiceClient();

  const { data: outcome } = await supabase
    .from("recommendation_outcomes")
    .select("project_id, score_before_date")
    .eq("recommendation_id", recommendationId)
    .single();

  if (outcome && outcome.project_id === context.projectId) {
    const { data: latestScore } = await supabase
      .from("visibility_scores")
      .select("visibility_score, score_date")
      .eq("project_id", outcome.project_id)
      .is("engine_id", null)
      .order("score_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestScore && latestScore.score_date > outcome.score_before_date) {
      await supabase
        .from("recommendation_outcomes")
        .update({
          score_after: latestScore.visibility_score,
          score_after_date: latestScore.score_date,
          measured_at: new Date().toISOString(),
        })
        .eq("recommendation_id", recommendationId);

      // Stays "in_progress" (not "done") so the result — the whole point of
      // capturing it — is still visible in the list instead of vanishing
      // the moment it's measured. Dismissing is a separate, deliberate action.
    }
  }

  redirect("/dashboard/recommendations");
}
