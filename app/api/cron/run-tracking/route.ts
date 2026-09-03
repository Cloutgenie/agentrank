import { NextResponse } from "next/server";
import { createServiceClient, isSupabaseServiceConfigured } from "@/lib/supabase/server";
import { runProjectPrompts } from "@/lib/runner";

// Vercel Cron functions have their own execution budget separate from
// regular requests — this can genuinely take minutes across many projects
// and four engines each, so it needs the longest duration the plan allows.
export const maxDuration = 300;
export const dynamic = "force-dynamic";

/**
 * Daily tracking run, triggered by Vercel Cron (see vercel.json). Runs every
 * active project's prompts against all four engines and persists results —
 * this is the job that makes the dashboard, homepage score, and alerts show
 * real data instead of nothing at all.
 *
 * Gated on CRON_SECRET: without this, the route would be a free, public way
 * for anyone to trigger real (billed) calls to every configured AI provider
 * for every project on the platform.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseServiceConfigured) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const supabase = createServiceClient();
  const { data: projects, error: projectsError } = await supabase.from("projects").select("id, name, organization_id");
  if (projectsError) {
    return NextResponse.json({ error: projectsError.message }, { status: 500 });
  }

  const results: { projectId: string; name: string; status: "ok" | "skipped" | "error"; error?: string }[] = [];

  for (const project of projects ?? []) {
    try {
      const [{ data: prompts, error: promptsError }, { data: competitors, error: competitorsError }] =
        await Promise.all([
          supabase.from("prompts").select("id, text").eq("project_id", project.id).eq("status", "active"),
          supabase.from("competitors").select("name").eq("project_id", project.id),
        ]);
      if (promptsError) throw promptsError;
      if (competitorsError) throw competitorsError;

      if (!prompts?.length) {
        results.push({ projectId: project.id, name: project.name, status: "skipped" });
        continue;
      }

      await runProjectPrompts({ project, prompts, competitors: competitors ?? [] });
      results.push({ projectId: project.id, name: project.name, status: "ok" });
    } catch (error) {
      // One project failing (bad data, a provider outage) shouldn't stop
      // the run from completing for every other project.
      console.error(`[cron/run-tracking] project ${project.id} failed:`, error);
      results.push({
        projectId: project.id,
        name: project.name,
        status: "error",
        error: error instanceof Error ? error.message : "unknown error",
      });
    }
  }

  return NextResponse.json({ ranAt: new Date().toISOString(), projectCount: results.length, results });
}
