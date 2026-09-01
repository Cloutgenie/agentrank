import { DashboardTopbar } from "@/components/dashboard/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { demoCompetitors, demoCompetitorComparison } from "@/lib/demo-data";

export default function CompetitorsPage() {
  return (
    <>
      <DashboardTopbar title="Competitors" />

      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Track how each competitor performs across your prompt set.</p>
          <Button size="sm">
            <Plus className="h-4 w-4" /> Add competitor
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-border/60 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 font-medium">Competitor</th>
                  <th className="px-6 py-3 font-medium">Visibility score</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {demoCompetitors.map((competitor) => {
                  const comparison = demoCompetitorComparison.find((c) => c.name === competitor.name);
                  return (
                    <tr key={competitor.id} className="border-b border-border/60 last:border-0">
                      <td className="px-6 py-4">
                        <p className="font-medium">{competitor.name}</p>
                        <p className="text-xs text-muted-foreground">{competitor.website_url}</p>
                      </td>
                      <td className="px-6 py-4 tabular-nums">{comparison?.score ?? "—"}</td>
                      <td className="px-6 py-4">
                        {competitor.is_primary ? <Badge>Primary</Badge> : <Badge variant="outline">Tracked</Badge>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
