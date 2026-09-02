import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Bot, Sparkles, ShieldCheck, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";

type CompanyPageProps = {
  params: Promise<{ slug: string }>;
};

const ENGINES = [
  { slug: "chatgpt", label: "ChatGPT", provider: "OpenAI" },
  { slug: "claude", label: "Claude", provider: "Anthropic" },
  { slug: "gemini", label: "Gemini", provider: "Google" },
  { slug: "perplexity", label: "Perplexity", provider: "Perplexity AI" },
] as const;

/** Turns a URL slug like "acme-software" into "Acme Software". */
function titleCaseSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Deterministic pseudo-random integer in [min, max], seeded from a string so the same
 *  slug always renders the same preview numbers. Not real measured data — see the
 *  "claim this report" CTA below, which replaces this with a live tracked score. */
function seededScore(seed: string, salt: number, min: number, max: number): number {
  let hash = salt;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return min + (hash % (max - min + 1));
}

export async function generateMetadata({ params }: CompanyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const companyName = titleCaseSlug(slug);

  return {
    title: `${companyName} AI Visibility Report — ChatGPT, Claude, Gemini & Perplexity`,
    description: `See how often ChatGPT, Claude, Gemini, and Perplexity mention ${companyName} in AI search answers, with a per-engine visibility breakdown and trend.`,
  };
}

export default async function CompanyPage({ params }: CompanyPageProps) {
  const { slug } = await params;
  const companyName = titleCaseSlug(slug);

  const overallScore = seededScore(slug, 7, 12, 68);
  const shareOfVoice = seededScore(slug, 19, 8, 45);
  const trackedPrompts = seededScore(slug, 31, 40, 220);

  const engineScores = ENGINES.map((engine, i) => {
    const score = seededScore(slug, 100 + i * 17, 10, 72);
    const trendValue = seededScore(slug, 200 + i * 23, 0, 2);
    const trend = trendValue === 0 ? "down" : trendValue === 1 ? "flat" : "up";
    return { ...engine, score, trend: trend as "up" | "down" | "flat" };
  });

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border/60 bg-grid">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-background" />
          <div className="container relative flex flex-col items-center py-24 text-center md:py-32">
            <Badge variant="outline" className="mb-6 gap-1.5">
              <Bot className="h-3 w-3" /> AI Visibility Report — preview
            </Badge>

            <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight md:text-6xl">
              How does AI talk about <span className="text-primary">{companyName}</span>?
            </h1>

            <p className="mt-6 max-w-xl text-balance text-lg text-muted-foreground">
              A preview of {companyName}'s AI Visibility Score across ChatGPT, Claude, Gemini, and Perplexity. Claim
              this report to track it live, add real competitors, and get alerted when it changes.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/sign-up">
                  Claim &amp; track {companyName} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/ai-search-seo">What is AI search SEO?</Link>
              </Button>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              Preview generated from {companyName}'s public name — not yet a tracked project
            </p>
          </div>
        </section>

        <section className="border-b border-border/60 py-20">
          <div className="container">
            <Card className="mx-auto max-w-2xl">
              <CardContent className="p-8">
                <h3 className="text-sm font-medium text-muted-foreground">{companyName} — AI Visibility Score</h3>
                <div className="mt-6 flex items-end gap-3">
                  <span className="text-5xl font-semibold tracking-tight">{overallScore}</span>
                  <span className="pb-1.5 text-sm text-muted-foreground">/ 100</span>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-6 border-t border-border pt-6 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Share of voice</p>
                    <p className="mt-1 text-xl font-semibold tabular-nums">{shareOfVoice}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Engines tracked</p>
                    <p className="mt-1 text-xl font-semibold tabular-nums">4</p>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-xs text-muted-foreground">Prompts this report covers</p>
                    <p className="mt-1 text-xl font-semibold tabular-nums">{trackedPrompts}</p>
                  </div>
                </div>

                <p className="mt-6 text-xs text-muted-foreground">
                  This is a preview estimate based on {companyName}'s name and category, not a live measurement. Claim
                  this report to generate a real prompt set and a tracked score.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="border-b border-border/60 py-24">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Per-engine breakdown</h2>
              <p className="mt-4 text-muted-foreground">
                How {companyName} shows up across each AI engine AgentRank tracks.
              </p>
            </div>

            <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {engineScores.map((engine) => (
                <Card key={engine.slug}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{engine.label}</h3>
                      {engine.trend === "up" && <TrendingUp className="h-4 w-4 text-success" />}
                      {engine.trend === "down" && <TrendingDown className="h-4 w-4 text-destructive" />}
                      {engine.trend === "flat" && <Minus className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{engine.provider}</p>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${engine.score}%` }} />
                    </div>
                    <p className="mt-2 text-sm tabular-nums text-muted-foreground">{engine.score}% visibility</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border/60 py-24">
          <div className="container grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">This is a preview, not the full report</h2>
              <p className="mt-4 text-muted-foreground">
                We generate a starter estimate for {companyName} from its name and category so you can see the
                report format before signing up. Claim the report to unlock the real thing.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  `A real prompt set generated from ${companyName}'s actual website and category`,
                  "Competitors you choose, tracked on the same prompts",
                  "Citation analysis — which domains AI models cite when talking about you",
                  "Weekly alerts the moment your visibility changes",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <Card>
              <CardContent className="p-8">
                <h3 className="text-sm font-medium text-muted-foreground">Preview vs. claimed report</h3>
                <div className="mt-6 space-y-4 text-sm">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <span className="text-muted-foreground">Score source</span>
                    <span className="font-medium">Preview estimate</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <span className="text-muted-foreground">Refresh cadence</span>
                    <span className="font-medium">Static</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <span className="text-muted-foreground">Competitors tracked</span>
                    <span className="font-medium">None yet</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Alerts</span>
                    <span className="font-medium">Off</span>
                  </div>
                </div>
                <Button className="mt-8 w-full" asChild>
                  <Link href="/sign-up">
                    Claim {companyName}'s report <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="py-24">
          <div className="container flex flex-col items-center rounded-2xl border border-border/60 bg-card px-8 py-16 text-center">
            <Badge variant="outline" className="mb-6 gap-1.5">
              <Sparkles className="h-3 w-3" /> Free 3-day trial
            </Badge>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Own {companyName}? Claim this report.
            </h2>
            <p className="mt-4 max-w-lg text-muted-foreground">
              Turn this preview into a live, tracked AI Visibility Score with real competitors and weekly alerts —
              in minutes.
            </p>
            <Button size="lg" className="mt-8" asChild>
              <Link href="/sign-up">
                Claim &amp; track {companyName} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
