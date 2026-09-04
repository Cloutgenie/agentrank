import { redirect } from "next/navigation";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { getCitationSummary } from "@/lib/queries";
import { getCurrentContext } from "@/lib/auth-context";

export default async function CitationsPage() {
  const context = await getCurrentContext();
  if (!context.projectId) redirect("/dashboard/onboarding");

  const citations = await getCitationSummary(context.projectId);
  const maxMentions = Math.max(...citations.map((c) => c.mentions), 1);
  const [topCitation, secondCitation] = citations;

  return (
    <>
      <DashboardTopbar title="Citations" />

      <div className="space-y-6 p-6">
        <p className="text-sm text-muted-foreground">
          Domains AI engines cited while answering your tracked prompts, ranked by frequency.
        </p>

        {citations.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              No citations yet — domains AI engines cite while answering your tracked prompts will show up here after
              your first tracking run.
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardContent className="space-y-4 p-6">
                {citations.map((citation) => (
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
                  {topCitation!.domain}
                  {secondCitation ? ` and ${secondCitation.domain}` : ""} {secondCitation ? "dominate" : "leads"} your
                  category's citations so far — prioritize earning mentions there before writing more owned-domain
                  content. See the Recommendations tab for specific actions.
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
}
