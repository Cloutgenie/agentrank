import { redirect } from "next/navigation";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAlerts } from "@/lib/queries";
import { getCurrentContext } from "@/lib/auth-context";

const TYPE_VARIANT = {
  visibility_gained: "success",
  visibility_lost: "destructive",
  competitor_overtook: "destructive",
  new_ranking: "success",
  lost_ranking: "destructive",
  weekly_summary: "outline",
} as const;

export default async function AlertsPage() {
  const context = await getCurrentContext();
  if (!context.projectId) redirect("/dashboard/onboarding");

  const alerts = await getAlerts(context.orgId);

  return (
    <>
      <DashboardTopbar title="Alerts" />

      <div className="space-y-4 p-6">
        <p className="text-sm text-muted-foreground">
          We check daily and email a weekly summary. Configure channels in Settings.
        </p>

        {alerts.map((alert) => (
          <Card key={alert.id}>
            <CardContent className="flex items-start justify-between gap-4 p-6">
              <div>
                <div className="mb-2">
                  <Badge variant={TYPE_VARIANT[alert.type]}>{alert.type.replace(/_/g, " ")}</Badge>
                </div>
                <h3 className="font-medium">{alert.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{alert.body}</p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{alert.createdAt}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
