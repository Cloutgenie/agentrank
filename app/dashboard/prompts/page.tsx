import { DashboardTopbar } from "@/components/dashboard/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { demoPrompts } from "@/lib/demo-data";

const MENTION_STYLE = {
  top_pick: { label: "Top pick", variant: "success" as const },
  mentioned: { label: "Mentioned", variant: "outline" as const },
  not_mentioned: { label: "Not mentioned", variant: "destructive" as const },
};

export default function PromptsPage() {
  return (
    <>
      <DashboardTopbar title="Prompts" />

      <div className="space-y-6 p-6">
        <p className="text-sm text-muted-foreground">
          {demoPrompts.length} buyer-intent prompts generated for your category. Each is re-run daily across all four engines.
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
                {demoPrompts.map((prompt) => {
                  const style = MENTION_STYLE[prompt.mentionType];
                  return (
                    <tr key={prompt.id} className="border-b border-border/60 last:border-0">
                      <td className="px-6 py-4 font-medium">{prompt.text}</td>
                      <td className="px-6 py-4 text-muted-foreground">{prompt.category}</td>
                      <td className="px-6 py-4 capitalize text-muted-foreground">{prompt.engine}</td>
                      <td className="px-6 py-4 tabular-nums">{prompt.position ?? "—"}</td>
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
