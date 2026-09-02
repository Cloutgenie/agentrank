import Link from "next/link";
import { ArrowRight, Check, TrendingUp, TrendingDown, Quote, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { pageMetadata, SITE_NAME, SITE_TAGLINE } from "@/lib/seo";

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

const SCOREBOARD = [
  { name: "Your Company", score: 43, trend: "up" as const },
  { name: "Competitor A", score: 31, trend: "down" as const },
  { name: "Competitor B", score: 18, trend: "flat" as const },
];

export default function HomePage() {
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

      <section className="border-b border-border/60 py-20">
        <div className="container">
          <Card className="mx-auto max-w-2xl">
            <CardContent className="p-8">
              <h3 className="text-sm font-medium text-muted-foreground">AI Visibility Score — "best project management software"</h3>
              <div className="mt-6 space-y-4">
                {SCOREBOARD.map((row) => (
                  <div key={row.name} className="flex items-center gap-4">
                    <span className="w-32 shrink-0 text-sm font-medium">{row.name}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${row.score}%` }} />
                    </div>
                    <span className="w-10 shrink-0 text-right text-sm tabular-nums">{row.score}%</span>
                    {row.trend === "up" && <TrendingUp className="h-4 w-4 shrink-0 text-success" />}
                    {row.trend === "down" && <TrendingDown className="h-4 w-4 shrink-0 text-destructive" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

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
        <div className="container grid gap-10 md:grid-cols-2 md:items-center">
          <div>
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

          <Card>
            <CardContent className="p-8">
              <Quote className="h-6 w-6 text-primary" />
              <p className="mt-4 text-lg">
                "We found out ChatGPT was recommending three competitors before us for our exact category — and had no
                idea until Agent Rank Radar showed us the gap."
              </p>
              <p className="mt-4 text-sm text-muted-foreground">Head of Growth, B2B SaaS company</p>
            </CardContent>
          </Card>
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
