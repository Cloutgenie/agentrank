import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Blog",
  description: "Notes on AI search visibility from the AgentRank Radar team.",
  path: "/blog",
});

export default function BlogPage() {
  return (
    <div className="container max-w-2xl py-24">
      <h1 className="text-4xl font-semibold tracking-tight">Blog</h1>
      <p className="mt-4 text-muted-foreground">
        Nothing published yet — we're focused on building the product first. Check back soon for notes on AI search
        visibility, what's actually moving AI recommendations, and what we're learning from tracking it.
      </p>
    </div>
  );
}
