"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { getCurrentContext } from "@/lib/auth-context";
import { getProject, getOverallScore, getCompetitorComparison, getCitationSummary, getOrganizationBranding } from "@/lib/queries";
import type { ReportPdfData } from "@/lib/reports/pdf-template";

type ReportType = "weekly" | "monthly" | "on_demand";

const PERIOD_DAYS: Record<ReportType, number> = { weekly: 7, monthly: 30, on_demand: 7 };
const TYPE_LABEL: Record<ReportType, string> = { weekly: "Weekly", monthly: "Monthly", on_demand: "On-Demand" };

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

/**
 * Generates a real PDF report for the given project and stores it —
 * replaces the old hardcoded REPORTS array and non-functional "Export PDF"
 * button on app/dashboard/reports/page.tsx.
 *
 * Takes `organizationId` explicitly rather than deriving it from the
 * signed-in session, because this also runs from the scheduled report-
 * generation cron (app/api/cron/generate-reports), which has no Clerk
 * session at all — deriving it via getCurrentContext() there would silently
 * fall back to the demo org and misattribute every generated report.
 * Caller is responsible for verifying the requester actually owns
 * projectId/organizationId before calling this (see generateReportOnDemand
 * below for the dashboard's user-facing entry point).
 */
export async function generateReport(
  projectId: string,
  organizationId: string,
  reportType: ReportType = "on_demand"
): Promise<{ ok: true; reportId: string } | { ok: false; error: string }> {
  const supabase = createServiceClient();
  const periodEnd = new Date();
  const periodStart = new Date(periodEnd.getTime() - PERIOD_DAYS[reportType] * 24 * 60 * 60 * 1000);

  const [org, project, overallScore, competitorComparison, citations] = await Promise.all([
    getOrganizationBranding(organizationId),
    getProject(projectId),
    getOverallScore(projectId),
    getCompetitorComparison(projectId),
    getCitationSummary(projectId),
  ]);

  const isWhiteLabel = org.whiteLabelEnabled;

  const pdfData: ReportPdfData = {
    brandName: isWhiteLabel ? org.name : "Agent Rank Radar",
    brandLogoUrl: isWhiteLabel ? org.logoUrl : null,
    projectName: project.name,
    reportTypeLabel: TYPE_LABEL[reportType],
    periodStart: isoDate(periodStart),
    periodEnd: isoDate(periodEnd),
    overallScore,
    competitorComparison,
    citations,
  };

  let pdfBuffer: Buffer;
  try {
    // VERCEL_URL is auto-populated by Vercel with the current deployment's
    // own hostname — a more reliable fallback than a hardcoded localhost
    // default for this internal, same-deployment call.
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const response = await fetch(`${appUrl}/api/reports/render-pdf`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${process.env.CRON_SECRET}` },
      body: JSON.stringify(pdfData),
    });
    if (!response.ok) throw new Error(`render-pdf responded ${response.status}`);
    pdfBuffer = Buffer.from(await response.arrayBuffer());
  } catch (error) {
    console.error(`[reports] PDF render failed for project ${projectId}:`, error);
    return { ok: false, error: "Couldn't render the PDF. Try again." };
  }

  const path = `${projectId}/${crypto.randomUUID()}.pdf`;
  const { error: uploadError } = await supabase.storage.from("reports").upload(path, pdfBuffer, {
    contentType: "application/pdf",
  });
  if (uploadError) {
    console.error(`[reports] upload failed for project ${projectId}:`, uploadError);
    return { ok: false, error: "Couldn't save the generated PDF." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("reports").getPublicUrl(path);

  const { data: report, error: insertError } = await supabase
    .from("reports")
    .insert({
      project_id: projectId,
      organization_id: organizationId,
      report_type: reportType,
      period_start: isoDate(periodStart),
      period_end: isoDate(periodEnd),
      summary: {
        visibilityScore: overallScore.visibilityScore,
        mentionFrequency: overallScore.mentionFrequency,
        shareOfVoice: overallScore.shareOfVoice,
      },
      pdf_url: publicUrl,
      is_white_label: isWhiteLabel,
    })
    .select("id")
    .single();

  if (insertError || !report) {
    return { ok: false, error: insertError?.message ?? "Failed to save the report." };
  }

  revalidatePath("/dashboard/reports");
  return { ok: true, reportId: report.id };
}

/**
 * User-facing entry point, bound to the dashboard's "Generate report now"
 * form — verifies the signed-in user's org actually owns projectId before
 * delegating to generateReport, then discards the result (void) so it can
 * be used directly as a <form action>.
 */
export async function generateReportOnDemand(projectId: string): Promise<void> {
  const context = await getCurrentContext();
  if (!context.isDemo && !context.projects.some((p) => p.id === projectId)) {
    console.error(`[reports] refused on-demand generation: project ${projectId} not owned by org ${context.orgId}`);
    return;
  }

  const result = await generateReport(projectId, context.orgId, "on_demand");
  if (!result.ok) console.error(`[reports] on-demand generation failed for project ${projectId}: ${result.error}`);
}
