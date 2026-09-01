import { DashboardTopbar } from "@/components/dashboard/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { demoRecommendations } from "@/lib/demo-data";

const IMPACT_VARIANT = { high: "destructive", medium: "outline", low: "secondary" } as const;

export default function RecommendationsPage() {
  return (
    <>
      <DashboardTopbar title="Recommendations" />

      <div className="space-y-4 p-6">
        <p className="text-sm text-muted-foreground">
          Generated from gaps between you and competitors across tracked prompts and citations.
        </p>

        {demoRecommendations.map((rec) => (
          <Card key={rec.id}>
            <CardContent className="flex items-start justify-between gap-4 p-6">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant={IMPACT_VARIANT[rec.impact]}>{rec.impact} impact</Badge>
                  <Badge variant="secondary">{rec.category.replace(/_/g, " ")}</Badge>
                </div>
                <h3 className="font-medium">{rec.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{rec.description}</p>
              </div>
              <Button size="sm" variant="outline" className="shrink-0">
                Mark in progress
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
