import { DashboardTopbar } from "@/components/dashboard/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { demoCitations } from "@/lib/demo-data";

const maxMentions = Math.max(...demoCitations.map((c) => c.mentions));

export default function CitationsPage() {
  return (
    <>
      <DashboardTopbar title="Citations" />

      <div className="space-y-6 p-6">
        <p className="text-sm text-muted-foreground">
          Domains AI engines cited while answering your tracked prompts, ranked by frequency.
        </p>

        <Card>
          <CardContent className="space-y-4 p-6">
            {demoCitations.map((citation) => (
              <div key={citation.domain} className="flex items-center gap-4">
                <span className="w-36 shrink-0 text-sm font-medium">{citation.domain}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(citation.mentions / maxMentions) * 100}%` }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
                  {citation.mentions} cites
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-medium">What this means</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Reddit and G2 dominate your category's citations — prioritize earning mentions there before writing more
              owned-domain content. See the Recommendations tab for specific actions.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
