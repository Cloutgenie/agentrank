import { redirect } from "next/navigation";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { getCurrentContext } from "@/lib/auth-context";

// Placeholder content — report generation isn't wired to real data yet
// (no `reports` table query exists), separate from the multi-tenancy pass.
const REPORTS = [
  { id: "1", label: "Week of Aug 25 – Sep 1", type: "Weekly" },
  { id: "2", label: "Week of Aug 18 – Aug 24", type: "Weekly" },
  { id: "3", label: "August 2026", type: "Monthly" },
];

export default async function ReportsPage() {
  const context = await getCurrentContext();
  if (!context.projectId) redirect("/dashboard/onboarding");

  return (
    <>
      <DashboardTopbar title="Reports" />

      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Auto-generated weekly and monthly visibility reports.</p>
          <Button size="sm" variant="outline">
            Generate report now
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {REPORTS.map((report) => (
              <div key={report.id} className="flex items-center justify-between border-b border-border/60 px-6 py-4 last:border-0">
                <div>
                  <p className="text-sm font-medium">{report.label}</p>
                  <p className="text-xs text-muted-foreground">{report.type} report</p>
                </div>
                <Button size="sm" variant="ghost">
                  <Download className="h-4 w-4" /> Export PDF
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
