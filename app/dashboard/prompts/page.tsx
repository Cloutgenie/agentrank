import { DashboardTopbar } from "@/components/dashboard/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getPromptResults } from "@/lib/queries";

const MENTION_STYLE = {
  top_pick: { label: "Top pick", variant: "success" as const },
  recommended: { label: "Recommended", variant: "success" as const },
  mentioned: { label: "Mentioned", variant: "outline" as const },
  not_mentioned: { label: "Not mentioned", variant: "destructive" as const },
};

export default async function PromptsPage() {
  const results = await getPromptResults();
  const promptCount = new Set(results.map((r) => r.text)).size;

  return (
    <>
      <DashboardTopbar title="Prompts" />

      <div className="space-y-6 p-6">
        <p className="text-sm text-muted-foreground">
          {promptCount} buyer-intent prompts generated for your category, {results.length} results across all tracked engines.
        </p>

        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-border/60 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 font-medium">Prompt</th>
                  <th className="px-6 py-3 font-medium">Category</th>
                  <th className="px-6 py-3 font-medium">Engine</th>
                  <th className="px-6 py-3 font-medium">Position</th>
                  <th className="px-6 py-3 font-medium">Result</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result) => {
                  const style = MENTION_STYLE[result.mention_type];
                  return (
                    <tr key={`${result.id}-${result.engine_slug}`} className="border-b border-border/60 last:border-0">
                      <td className="px-6 py-4 font-medium">{result.text}</td>
                      <td className="px-6 py-4 text-muted-foreground">{result.category}</td>
                      <td className="px-6 py-4 capitalize text-muted-foreground">{result.engine_slug}</td>
                      <td className="px-6 py-4 tabular-nums">{result.rank_position ?? "—"}</td>
                      <td className="px-6 py-4">
                        <Badge variant={style.variant}>{style.label}</Badge>
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
