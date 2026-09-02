import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { pageMetadata, SITE_NAME, SITE_TAGLINE } from "@/lib/seo";
import { getScoreTrend, getEngineScores, DEMO_PROJECT_ID } from "@/lib/queries";
import { isSupabaseServiceConfigured } from "@/lib/supabase/server";
import { VisibilityTrendChart } from "@/components/dashboard/charts/visibility-trend-chart";

const HOME_TITLE = `${SITE_NAME} — ${SITE_TAGLINE}`;
const HOME_DESCRIPTION =
  "Agent Rank Radar continuously scans ChatGPT, Claude, Gemini, and Perplexity for how often they recommend you vs. your competitors — and tells you what content to publish to win.";

export const metadata = {
  ...pageMetadata({ title: HOME_TITLE, description: HOME_DESCRIPTION, path: "/" }),
  // The homepage's title already carries the brand name, so it must skip the
  // layout's "%s · Agent Rank Radar" template to avoid duplicating it.
  title: { absolute: HOME_TITLE },
};

const ENGINES = ["ChatGPT", "Claude", "Gemini", "Perplexity"];

const FEATURES = [
  {
    title: "AI Visibility Tracker",
    description:
      "We generate hundreds of buyer-intent prompts for your category and run them against every major AI engine, every day.",
  },
  {
    title: "Competitor Intelligence",
    description: "See exactly which prompts your competitors dominate, which they just gained, and which they lost.",
  },
  {
    title: "Citation Analysis",
    description: "Discover which domains — Reddit, G2, Trustpilot, blogs — AI models actually cite when they answer.",
  },
  {
    title: "AI SEO Recommendations",
    description: "Get a prioritized content plan: comparison pages, integration pages, glossary pages, citation targets.",
  },
  {
    title: "Weekly Alerts",
    description: "\"You lost visibility in ChatGPT.\" \"Competitor X overtook you in Perplexity.\" Straight to your inbox.",
  },
  {
    title: "Agency Mode",
    description: "Manage every client from one dashboard, with white-label reports your clients think you built.",
  },
];

export default async function HomePage() {
  const [trend, engineScores] = await Promise.all([
    getScoreTrend(DEMO_PROJECT_ID, 14),
    getEngineScores(DEMO_PROJECT_ID),
  ]);
  const latestDate = trend.at(-1)?.date ?? null;
  const isRealData = isSupabaseServiceConfigured;
  // Only feature the live score once it has something worth showing — a
  // brand-new project (or one that just changed names) can have a real but
  // uninformative 0 for a day or two before AI models catch up. Re-appears
  // automatically once real tracking picks up mentions again.
  const hasTrackedSignal = (trend.at(-1)?.score ?? 0) > 0;

  return (
    <>
      <section className="relative overflow-hidden border-b border-border/60 bg-grid">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-background" />
        <div className="container relative flex flex-col items-center py-24 text-center md:py-32">
          <Badge variant="outline" className="mb-6 gap-1.5">
            <Sparkles className="h-3 w-3" /> Now scanning ChatGPT, Claude, Gemini &amp; Perplexity
          </Badge>

          <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight md:text-6xl">
            The 24/7 Radar for Your <span className="text-primary">AI Answer Visibility</span>
          </h1>

          <p className="mt-6 max-w-xl text-balance text-lg text-muted-foreground">
            Does ChatGPT recommend your company — or your competitor's? Agent Rank Radar continuously scans every major AI
            engine, benchmarks you against competitors, and gets you a content plan to win the AI answer.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/sign-up">
                Check my AI visibility <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/pricing">See pricing</Link>
            </Button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">No credit card required · Free 3-day trial</p>

          <div className="mt-16 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm text-muted-foreground">
            <span className="font-medium text-foreground/70">Tracked across</span>
            {ENGINES.map((engine) => (
              <span key={engine} className="font-medium">
                {engine}
              </span>
            ))}
          </div>
        </div>
      </section>

      {hasTrackedSignal && (
        <section className="border-b border-border/60 py-20">
          <div className="container">
            <Card className="mx-auto max-w-2xl">
              <CardContent className="p-8">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {isRealData ? "Agent Rank Radar's own AI Visibility Score — real, tracked daily" : "Illustrative example"}
                  </h3>
                  {latestDate && <span className="shrink-0 text-xs text-muted-foreground">As of {latestDate}</span>}
                </div>
                <div className="mt-6 h-48">
                  <VisibilityTrendChart data={trend} />
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-4">
                  {engineScores.map((engine) => (
                    <div key={engine.engine}>
                      <p className="text-xs text-muted-foreground">{engine.label}</p>
                      <p className="text-lg font-semibold tabular-nums">{engine.score}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-6 text-xs text-muted-foreground">
                  {isRealData
                    ? "This is our own real score — produced by querying ChatGPT, Claude, Gemini, and Perplexity daily, the same tracking every customer gets. It moves, including down, because that's what actually happens."
                    : "Sign up to see your own real, tracked score across all four engines."}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      <section id="features" className="border-b border-border/60 py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Everything you need to win AI search</h2>
            <p className="mt-4 text-muted-foreground">
              SEO tools tell you how you rank on Google. Agent Rank Radar tells you how you rank inside the answer.
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <Card key={feature.title}>
                <CardContent className="p-6">
                  <h3 className="font-medium">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 py-24">
        <div className="container max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight">Built for the teams who already won Google</h2>
          <p className="mt-4 text-muted-foreground">
            SaaS founders, Shopify app developers, agencies, and SEO consultants use Agent Rank Radar to make sure they don't
            lose the next search war before it starts.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              "See your AI Visibility Score across 4 engines in one dashboard",
              "Get alerted the moment a competitor overtakes you",
              "Turn every gap into a prioritized content brief",
              "Export white-label reports for your clients",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-24">
        <div className="container flex flex-col items-center rounded-2xl border border-border/60 bg-card px-8 py-16 text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Find out where you stand today</h2>
          <p className="mt-4 max-w-lg text-muted-foreground">
            Enter your company and three competitors. We'll run your first visibility report in minutes.
          </p>
          <Button size="lg" className="mt-8" asChild>
            <Link href="/sign-up">
              Start free trial <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
