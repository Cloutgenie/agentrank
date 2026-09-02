import Link from "next/link";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getRecommendations } from "@/lib/queries";
import { launchCursorAgent, refreshCursorAgentStatus } from "@/lib/actions/cursor";
import { isCursorConfigured } from "@/lib/cursor";
import { GitPullRequest } from "lucide-react";

const IMPACT_VARIANT = { high: "destructive", medium: "outline", low: "secondary" } as const;

export default async function RecommendationsPage() {
  const recommendations = await getRecommendations();

  return (
    <>
      <DashboardTopbar title="Recommendations" />

      <div className="space-y-4 p-6">
        <p className="text-sm text-muted-foreground">
          Generated from gaps between you and competitors across tracked prompts and citations.
        </p>

        {recommendations.map((rec) => (
          <Card key={rec.id}>
            <CardContent className="flex items-start justify-between gap-4 p-6">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant={IMPACT_VARIANT[rec.impact]}>{rec.impact} impact</Badge>
                  <Badge variant="secondary">{rec.category.replace(/_/g, " ")}</Badge>
                  {rec.cursorStatus && <Badge variant="outline">Cursor: {rec.cursorStatus}</Badge>}
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
                ) : isCursorConfigured ? (
                  <form action={launchCursorAgent.bind(null, rec.id)}>
                    <Button size="sm" type="submit">
                      Build with Cursor
                    </Button>
                  </form>
                ) : (
                  <Button size="sm" variant="outline" disabled>
                    Mark in progress
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
