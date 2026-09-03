import { NextResponse } from "next/server";
import { createServiceClient, isSupabaseServiceConfigured } from "@/lib/supabase/server";
import { generateReport } from "@/lib/actions/reports";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

/**
 * Scheduled report generation (see vercel.json): weekly for every project
 * (Starter's "Weekly visibility reports"), monthly for Agency-tier orgs on
 * top of that ("Monthly automated reports"). Same CRON_SECRET auth pattern
 * as app/api/cron/run-tracking — this must never be a free, public way to
 * trigger report generation (real storage writes) for every project.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseServiceConfigured) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const url = new URL(request.url);
  const reportType = url.searchParams.get("type") === "monthly" ? "monthly" : "weekly";

  const supabase = createServiceClient();
  let query = supabase
    .from("projects")
    .select("id, organization_id, organizations!inner(plan_tier)")
    .eq("is_archived", false);
  if (reportType === "monthly") query = query.eq("organizations.plan_tier", "agency");

  const { data: projects, error: projectsError } = await query;
  if (projectsError) {
    return NextResponse.json({ error: projectsError.message }, { status: 500 });
  }

  const results: { projectId: string; status: "ok" | "error"; error?: string }[] = [];

  for (const project of projects ?? []) {
    const result = await generateReport(project.id, project.organization_id, reportType);
    results.push(
      result.ok
        ? { projectId: project.id, status: "ok" }
        : { projectId: project.id, status: "error", error: result.error }
    );
  }

  return NextResponse.json({ ranAt: new Date().toISOString(), reportType, count: results.length, results });
}
