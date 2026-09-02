import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "About",
  description: "Why we built AgentRank.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <div className="container max-w-2xl py-24">
      <h1 className="text-4xl font-semibold tracking-tight">About AgentRank</h1>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <p>
          Search is changing. A growing share of buying research now happens inside ChatGPT, Claude, Gemini, and
          Perplexity instead of a search results page — and there's been no easy way to know whether those models are
          recommending your company or quietly sending buyers to a competitor instead.
        </p>
        <p>
          AgentRank tracks that gap. We generate the buyer-intent questions real prospects ask AI models about your
          category, run them daily across every major engine, and turn the results into a visibility score, a
          competitor breakdown, and a prioritized list of content to publish to close the gap.
        </p>
        <p>
          We're early — building this in the open, shipping fast, and talking to every team that tries it. If you
          have feedback, we want to hear it.
        </p>
      </div>
    </div>
  );
}
