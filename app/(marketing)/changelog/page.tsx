import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Changelog",
  description: "What's new in Agent Rank Radar.",
  path: "/changelog",
});

const ENTRIES = [
  {
    date: "September 2026",
    title: "Agent Rank Radar launches",
    body: "AI Visibility Score, competitor tracking across ChatGPT, Claude, Gemini, and Perplexity, citation analysis, and AI SEO recommendations — all live from day one.",
  },
];

export default function ChangelogPage() {
  return (
    <div className="container max-w-2xl py-24">
      <h1 className="text-4xl font-semibold tracking-tight">Changelog</h1>
      <p className="mt-4 text-muted-foreground">What's new in Agent Rank Radar.</p>

      <div className="mt-12 space-y-10 border-l border-border/60 pl-6">
        {ENTRIES.map((entry) => (
          <div key={entry.title} className="relative">
            <span className="absolute -left-[29px] top-1.5 h-2 w-2 rounded-full bg-primary" />
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{entry.date}</p>
            <h2 className="mt-1 font-medium">{entry.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{entry.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
