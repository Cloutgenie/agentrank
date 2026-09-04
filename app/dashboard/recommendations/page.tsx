import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getRecommendations, getRecommendationOutcomes } from "@/lib/queries";
import { launchCursorAgent, refreshCursorAgentStatus } from "@/lib/actions/cursor";
import { markRecommendationActioned, captureRecommendationResult } from "@/lib/actions/recommendations";
import { isCursorConfigured } from "@/lib/cursor";
import { getCurrentContext } from "@/lib/auth-context";
import { GitPullRequest, TrendingUp, TrendingDown, Minus } from "lucide-react";

const IMPACT_VARIANT = { high: "destructive", medium: "outline", low: "secondary" } as const;

export default async function RecommendationsPage() {
  const context = await getCurrentContext();
  if (!context.projectId) redirect("/dashboard/onboarding");

  const [recommendations, outcomes] = await Promise.all([
    getRecommendations(context.projectId),
    getRecommendationOutcomes(context.projectId),
  ]);
  const outcomeByRecId = new Map(outcomes.map((o) => [o.recommendationId, o]));

  return (
    <>
      <DashboardTopbar title="Recommendations" />

      <div className="space-y-4 p-6">
        <p className="text-sm text-muted-foreground">
          Generated from gaps between you and competitors across tracked prompts and citations. Actioning one records a
          visibility baseline so you can see whether it actually moved the needle.
        </p>

        {recommendations.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              No recommendations yet — these are generated from gaps found in your tracked prompts and citations, so
              they'll appear here after your first tracking run.
            </CardContent>
          </Card>
        )}

        {recommendations.map((rec) => {
          const outcome = outcomeByRecId.get(rec.id);
          const delta = outcome?.scoreAfter != null ? outcome.scoreAfter - outcome.scoreBefore : null;

          return (
            <Card key={rec.id}>
              <CardContent className="flex items-start justify-between gap-4 p-6">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant={IMPACT_VARIANT[rec.impact]}>{rec.impact} impact</Badge>
                    <Badge variant="secondary">{rec.category.replace(/_/g, " ")}</Badge>
                    {rec.cursorStatus && <Badge variant="outline">Cursor: {rec.cursorStatus}</Badge>}
                    {outcome && delta === null && (
                      <Badge variant="outline">
                        Baseline {outcome.scoreBefore} · {outcome.scoreBeforeDate}
                      </Badge>
                    )}
                    {delta !== null && outcome && (
                      <Badge variant={delta > 0 ? "success" : delta < 0 ? "destructive" : "outline"} className="gap-1">
                        {delta > 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : delta < 0 ? (
                          <TrendingDown className="h-3 w-3" />
                        ) : (
                          <Minus className="h-3 w-3" />
                        )}
                        {delta > 0 ? "+" : ""}
                        {delta.toFixed(1)} pts ({outcome.scoreBefore} → {outcome.scoreAfter})
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-medium">{rec.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{rec.description}</p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  {rec.cursorPrUrl ? (
                    <Button size="sm" variant="outline" asChild>
                      <Link href={rec.cursorPrUrl} target="_blank" rel="noopener noreferrer">
                        <GitPullRequest className="h-4 w-4" /> View PR
                      </Link>
                    </Button>
                  ) : rec.cursorAgentId ? (
                    <form action={refreshCursorAgentStatus.bind(null, rec.id)}>
                      <Button size="sm" variant="outline" type="submit">
                        Check status
                      </Button>
                    </form>
                  ) : isCursorConfigured && context.isDemo ? (
                    <form action={launchCursorAgent.bind(null, rec.id)}>
                      <Button size="sm" type="submit">
                        Build with Cursor
                      </Button>
                    </form>
                  ) : !outcome ? (
                    <form action={markRecommendationActioned.bind(null, rec.id)}>
                      <Button size="sm" variant="outline" type="submit">
                        Mark as actioned
                      </Button>
                    </form>
                  ) : null}

                  {outcome && delta === null && (
                    <form action={captureRecommendationResult.bind(null, rec.id)}>
                      <Button size="sm" variant="ghost" type="submit">
                        Capture result
                      </Button>
                    </form>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
