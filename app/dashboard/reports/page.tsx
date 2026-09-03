import { redirect } from "next/navigation";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { getCurrentContext } from "@/lib/auth-context";
import { getReports } from "@/lib/queries";
import { generateReportOnDemand } from "@/lib/actions/reports";

const TYPE_LABEL: Record<string, string> = { weekly: "Weekly", monthly: "Monthly", on_demand: "On-Demand" };

export default async function ReportsPage() {
  const context = await getCurrentContext();
  if (!context.projectId) redirect("/dashboard/onboarding");

  const reports = await getReports(context.projectId);
  const generateReportForProject = generateReportOnDemand.bind(null, context.projectId);

  return (
    <>
      <DashboardTopbar title="Reports" />

      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Auto-generated weekly and monthly visibility reports.</p>
          <form action={generateReportForProject}>
            <Button size="sm" variant="outline" type="submit">
              Generate report now
            </Button>
          </form>
        </div>

        {reports.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              No reports yet. Generate one to get a PDF snapshot of your current visibility standing.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              {reports.map((report) => (
                <div key={report.id} className="flex items-center justify-between border-b border-border/60 px-6 py-4 last:border-0">
                  <div>
                    <p className="text-sm font-medium">
                      {report.periodStart} – {report.periodEnd}
                    </p>
                    <p className="text-xs text-muted-foreground">{TYPE_LABEL[report.type] ?? report.type} report</p>
                  </div>
                  {report.pdfUrl ? (
                    <Button size="sm" variant="ghost" asChild>
                      <a href={report.pdfUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4" /> Export PDF
                      </a>
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" disabled>
                      <Download className="h-4 w-4" /> Export PDF
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
