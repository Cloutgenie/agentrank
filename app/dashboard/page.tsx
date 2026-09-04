import { redirect } from "next/navigation";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VisibilityTrendChart } from "@/components/dashboard/charts/visibility-trend-chart";
import { CompetitorBarChart } from "@/components/dashboard/charts/competitor-bar-chart";
import { TrendingUp, TrendingDown, Radar } from "lucide-react";
import { getOverallScore, getEngineScores, getCompetitorComparison, getScoreTrend, getAlerts } from "@/lib/queries";
import { getCurrentContext } from "@/lib/auth-context";

function TrendBadge({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${up ? "text-success" : "text-destructive"}`}>
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {up ? "+" : ""}
      {value}
      {typeof value === "number" ? "pt" : ""}
    </span>
  );
}

export default async function DashboardOverviewPage() {
  const context = await getCurrentContext();
  if (!context.projectId) redirect("/dashboard/onboarding");

  const [overallScore, engineScores, competitorComparison, trend, alerts] = await Promise.all([
    getOverallScore(context.projectId),
    getEngineScores(context.projectId),
    getCompetitorComparison(context.projectId),
    getScoreTrend(context.projectId),
    getAlerts(context.projectId),
  ]);

  // A brand-new project has no visibility_scores rows until its first
  // scheduled tracking run — showing charts full of zeros (or worse, demo
  // data mislabeled as theirs) here would be actively misleading.
  const hasTrackedSignal = trend.length > 0;

  return (
    <>
      <DashboardTopbar title="Overview" alertCount={alerts.length} showNewProject />

      {!hasTrackedSignal ? (
        <div className="p-6">
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
              <Radar className="h-8 w-8 text-muted-foreground" />
              <h2 className="text-lg font-medium">Your first tracking run is coming</h2>
              <p className="max-w-md text-sm text-muted-foreground">
                We generate your buyer-intent prompts and run them against every AI engine on a daily schedule — your AI
                Visibility Score and competitor comparison will appear here after the first run completes, usually within
                24 hours of setup.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
      <div className="space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>AI Visibility Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold tabular-nums">{overallScore.visibilityScore}</span>
                <span className="text-sm text-muted-foreground">/ 100</span>
              </div>
              <TrendBadge value={overallScore.trend} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Mention Frequency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold tabular-nums">{overallScore.mentionFrequency}%</span>
              </div>
              <p className="text-xs text-muted-foreground">of tracked prompts mention you</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Share of Voice</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold tabular-nums">{overallScore.shareOfVoice}%</span>
              </div>
              <p className="text-xs text-muted-foreground">of all brand mentions are you</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Avg. Position</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold tabular-nums">{overallScore.avgPosition}</span>
              </div>
              <p className="text-xs text-muted-foreground">when mentioned, average rank</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Visibility trend</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <VisibilityTrendChart data={trend} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>By engine</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {engineScores.map((engine) => (
                <div key={engine.engine} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{engine.label}</p>
                    <p className="text-xs text-muted-foreground">{engine.mentionFrequency}% mention freq.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold tabular-nums">{engine.score}</span>
                    <TrendBadge value={engine.trend} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Competitor comparison</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <CompetitorBarChart data={competitorComparison} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {alerts.map((alert) => (
                <div key={alert.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        alert.type === "visibility_gained" ? "success" : alert.type === "visibility_lost" ? "destructive" : "outline"
                      }
                    >
                      {alert.type.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium">{alert.title}</p>
                  <p className="text-xs text-muted-foreground">{alert.body}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
      )}
    </>
  );
}
