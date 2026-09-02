import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Check, Minus, Scale, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VisibilityTrendChart } from "@/components/dashboard/charts/visibility-trend-chart";
import { getScoreTrend, getCompetitorComparison, getPromptResults } from "@/lib/queries";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Profound vs AgentRank: Which AI Visibility Tracker?",
  description:
    "Compare Profound and AgentRank on pricing, engines tracked, refresh cadence, recommendations, and agency mode. See which AI visibility tracker fits your team.",
  alternates: { canonical: "/vs/profound-vs-agentrank" },
};

const COMPARISON_ROWS = [
  { dimension: "Best for", profound: "Enterprise AEO teams and well-funded brands", agentrank: "SaaS founders, Shopify apps, and agencies" },
  { dimension: "Starting price", profound: "$99/mo (Starter)", agentrank: "$29/mo (Starter)" },
  { dimension: "Mid-tier price", profound: "$399/mo (Growth)", agentrank: "$99/mo (Growth)" },
  { dimension: "Agency plan", profound: "Agency Growth, billed per client workspace", agentrank: "$299/mo, unlimited clients + white-label" },
  { dimension: "Billing", profound: "Published self-serve plans billed yearly", agentrank: "Month-to-month; 20% off annual" },
  { dimension: "Free trial", profound: "Growth trial — confirm on their pricing page", agentrank: "14 days, no credit card" },
  { dimension: "Engines on entry plan", profound: "ChatGPT", agentrank: "ChatGPT, Claude, Gemini, Perplexity" },
  { dimension: "Engines on mid-tier", profound: "ChatGPT, Perplexity, Google AI Overviews", agentrank: "Same 4 engines, daily refresh" },
  { dimension: "Max engine coverage", profound: "Up to 9 on Enterprise (incl. Copilot, Grok, DeepSeek)", agentrank: "4: ChatGPT, Claude, Gemini, Perplexity" },
  { dimension: "Tracked prompts", profound: "50 (Starter) / 100 (Growth)", agentrank: "100 (Starter) / 500 (Growth) / 2,500 (Agency)" },
  { dimension: "Refresh cadence", profound: "Daily", agentrank: "Weekly on Starter, daily on Growth+" },
  { dimension: "Recommendations", profound: "Weekly opportunities + credit-based Agents", agentrank: "Prioritized content plan: comparison pages, citations, Reddit, glossary" },
  { dimension: "Prompt Volumes (AI keyword research)", profound: "Yes — distinctive panel dataset", agentrank: "No" },
  { dimension: "Content agents", profound: "Yes, credit-based", agentrank: "No — we tell you what to publish, you write it" },
  { dimension: "Agency / white-label", profound: "Per-workspace Agency Growth", agentrank: "Unlimited projects, white-label reports, client viewers" },
  { dimension: "SSO / SOC 2", profound: "Enterprise", agentrank: "Not in v1" },
];

const SWITCH_REASONS = [
  {
    title: "Four engines from day one",
    description:
      "Profound's Starter plan tracks ChatGPT only. AgentRank queries ChatGPT, Claude, Gemini, and Perplexity on every plan — including the $29 Starter tier.",
  },
  {
    title: "More prompts, lower price",
    description:
      "AgentRank Growth tracks 500 prompts for $99/mo. Profound Growth tracks 100 prompts for $399/mo. If you need breadth across buyer-intent queries, the math is not close.",
  },
  {
    title: "A content plan, not just a dashboard",
    description:
      "AgentRank turns mention gaps into a ranked list of pages to publish — comparison pages, glossary terms, citation targets. This page exists because that engine flagged it on our own project.",
  },
  {
    title: "Built for agencies without per-client enterprise pricing",
    description:
      "White-label reports and unlimited client projects ship on AgentRank Agency at $299/mo. Profound's agency motion is a Growth-priced workspace per client.",
  },
];

const PROFOUND_WINS = [
  {
    title: "You need Prompt Volumes",
    description:
      "Profound's panel data on what people actually type into AI engines is unique. AgentRank generates buyer-intent prompts from your category and competitors; it does not estimate query volume.",
  },
  {
    title: "You need 5–9 answer engines",
    description:
      "If Copilot, Grok, DeepSeek, or Google AI Mode/Overviews are in scope, Profound's Enterprise plan covers them. AgentRank's v1 set is ChatGPT, Claude, Gemini, and Perplexity.",
  },
  {
    title: "You want agents that draft AEO content",
    description:
      "Profound Agents generate and optimize content on a credit model. AgentRank stops at the brief: what to publish and why, not the draft itself.",
  },
  {
    title: "You need SSO, SOC 2, and a named specialist",
    description:
      "Enterprise procurement, SAML, and a 24-hour Slack SLA are Profound's home turf. AgentRank is self-serve SaaS aimed at SMB and agency teams.",
  },
];

const RELATED = [
  { href: "/pricing", label: "AgentRank pricing" },
  { href: "/chatgpt-ranking-checker", label: "ChatGPT ranking checker" },
  { href: "/claude-ranking-checker", label: "Claude ranking checker" },
  { href: "/monitor-chatgpt-mentions", label: "Monitor ChatGPT mentions" },
  { href: "/ai-search-seo", label: "What is AI search SEO?" },
];

const FAQ = [
  {
    q: "What's the difference between Profound and AgentRank?",
    a: "Both track how often AI answer engines mention a brand. Profound is an enterprise AEO platform with Prompt Volumes, content agents, and up to nine engines on custom plans. AgentRank is a self-serve AI visibility tracker for SMB and agency teams: four engines on every plan, a prioritized content plan, and pricing that starts at $29/month.",
  },
  {
    q: "Is AgentRank cheaper than Profound?",
    a: "Yes on published self-serve tiers. AgentRank starts at $29/month (100 prompts, four engines) and Growth is $99/month (500 prompts). Profound's published Starter is $99/month (ChatGPT, 50 prompts) and Growth is $399/month (three engines, 100 prompts), billed yearly. Profound Enterprise is custom. Always confirm current numbers on each company's pricing page.",
  },
  {
    q: "Does AgentRank track the same AI engines as Profound?",
    a: "Overlap, not a match. AgentRank tracks ChatGPT, Claude, Gemini, and Perplexity on every plan. Profound's Starter is ChatGPT-only; Growth adds Perplexity and Google AI Overviews; Enterprise can add Claude, Gemini, Copilot, Grok, DeepSeek, and Google AI Mode. If you need Claude and Gemini without an enterprise contract, AgentRank includes them immediately. If you need nine engines, Profound's Enterprise plan is the wider net.",
  },
  {
    q: "Who should choose Profound instead of AgentRank?",
    a: "Choose Profound if you need Prompt Volumes, credit-based content agents, nine-engine coverage, ChatGPT Shopping visibility, or SSO/SOC 2 for procurement. Those are real capabilities AgentRank does not ship in v1. Choose AgentRank if you want self-serve tracking, four engines from $29, a recommendation engine that tells you which pages to publish, or white-label agency reporting at a flat $299/month.",
  },
  {
    q: "How current is this Profound vs AgentRank comparison?",
    a: "Feature and pricing rows reflect public pages as of September 2026. Profound's published prices and engine lists can change — check tryprofound.com/pricing before you buy. AgentRank pricing is listed on our pricing page and can be started on a 14-day trial with no credit card.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

export default async function ProfoundVsAgentRankPage() {
  const [trend, competitorComparison, promptResults] = await Promise.all([
    getScoreTrend(),
    getCompetitorComparison(),
    getPromptResults(),
  ]);
  const trackedPrompts = Array.from(new Set(promptResults.map((r) => r.text))).slice(0, 8);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <section className="relative overflow-hidden border-b border-border/60 bg-grid">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-background" />
        <div className="container relative flex flex-col items-center py-24 text-center md:py-32">
          <Badge variant="outline" className="mb-6 gap-1.5">
            <Scale className="h-3 w-3" /> Comparison · updated daily
          </Badge>

          <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight md:text-6xl">
            Profound vs AgentRank: <span className="text-primary">which AI visibility tracker should you use?</span>
          </h1>

          <p className="mt-6 max-w-xl text-balance text-lg text-muted-foreground">
            Side-by-side on pricing, engines, refresh cadence, recommendations, and agency mode — backed by AgentRank
            tracking real buyer-intent and comparison prompts across the same four engines we run for customers.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/sign-up">
                Try AgentRank free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/pricing">See AgentRank pricing</Link>
            </Button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            No credit card required · Free 14-day trial · Profound pricing as of September 2026
          </p>
        </div>
      </section>

      <section className="border-b border-border/60 py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Feature-by-feature comparison</h2>
            <p className="mt-4 text-muted-foreground">
              Profound is the enterprise AEO suite. AgentRank is Ahrefs-for-ChatGPT for teams who want to start this
              week, not after a sales cycle.
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-4xl overflow-x-auto">
            <table className="w-full border-collapse overflow-hidden rounded-lg border border-border text-sm">
              <thead>
                <tr className="bg-secondary text-left">
                  <th className="p-4 font-medium">Dimension</th>
                  <th className="p-4 font-medium">Profound</th>
                  <th className="p-4 font-medium">AgentRank</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.dimension} className="border-t border-border align-top">
                    <td className="p-4 font-medium">{row.dimension}</td>
                    <td className="p-4 text-muted-foreground">{row.profound}</td>
                    <td className="p-4 text-muted-foreground">{row.agentrank}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mx-auto mt-4 max-w-4xl text-xs text-muted-foreground">
            Profound figures are from their public pricing page as of September 2026. Confirm current engines, prompt
            limits, and billing on{" "}
            <a
              href="https://www.tryprofound.com/pricing"
              className="underline underline-offset-2 hover:text-foreground"
              rel="noopener noreferrer"
              target="_blank"
            >
              tryprofound.com/pricing
            </a>
            . AgentRank figures match our{" "}
            <Link href="/pricing" className="underline underline-offset-2 hover:text-foreground">
              pricing page
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="border-b border-border/60 py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              How AI currently talks about AgentRank vs Profound
            </h2>
            <p className="mt-4 text-muted-foreground">
              Live from AgentRank&apos;s own tracker — the same visibility scores and prompt set we use internally.
              Refreshes daily.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardContent className="p-6">
                <h3 className="text-sm font-medium text-muted-foreground">AI Visibility Score trend</h3>
                <div className="mt-4 h-64">
                  <VisibilityTrendChart data={trend} />
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardContent className="p-6">
                <h3 className="text-sm font-medium text-muted-foreground">Share of tracked mentions</h3>
                <div className="mt-6 space-y-4">
                  {competitorComparison.map((row) => (
                    <div key={row.name} className="flex items-center gap-3">
                      <span className="w-28 shrink-0 text-sm font-medium">{row.isYou ? "AgentRank" : row.name}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                        <div
                          className={`h-full rounded-full ${row.isYou ? "bg-primary" : "bg-muted-foreground/40"}`}
                          style={{ width: `${row.score}%` }}
                        />
                      </div>
                      <span className="w-8 shrink-0 text-right text-sm tabular-nums">{row.score}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-6 text-xs text-muted-foreground">
                  Blended 0–100 score across ChatGPT, Claude, Gemini, and Perplexity.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Prompts this comparison actually ranks for</h2>
            <p className="mt-4 text-muted-foreground">
              Pulled straight from AgentRank&apos;s tracked prompt set — the reason a dedicated comparison URL matters
              for AI citations, not just Google.
            </p>
          </div>

          <div className="mx-auto mt-10 flex max-w-2xl flex-wrap justify-center gap-2">
            {trackedPrompts.map((text) => (
              <Badge key={text} variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm font-normal">
                <Search className="h-3 w-3" /> {text}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Why teams pick AgentRank</h2>
            <p className="mt-4 text-muted-foreground">
              The same recommendation engine that told us to publish this page is what customers use to close their
              own citation gaps.
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-2">
            {SWITCH_REASONS.map((item) => (
              <Card key={item.title}>
                <CardContent className="flex items-start gap-4 p-6">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                  <div>
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">When Profound is the better fit</h2>
            <p className="mt-4 text-muted-foreground">
              A comparison page that pretends Profound has no advantages is not useful — and not what models cite.
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-2">
            {PROFOUND_WINS.map((item) => (
              <Card key={item.title}>
                <CardContent className="flex items-start gap-4 p-6">
                  <Minus className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                  <div>
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 py-24">
        <div className="container">
          <Card className="mx-auto max-w-2xl">
            <CardContent className="p-8">
              <Badge variant="outline" className="mb-4">
                Recommendation preview
              </Badge>
              <h2 className="text-2xl font-semibold tracking-tight">This page is the product, used on itself</h2>
              <p className="mt-4 text-sm text-muted-foreground">
                AgentRank&apos;s tracker saw us mentioned alongside Profound across comparison prompts, then the
                recommendation engine queued a high-impact action: publish a page that targets &quot;AgentRank vs
                Profound.&quot; That is the loop we sell — measure the gap, get a specific URL to ship, watch the
                mention rate move.
              </p>
              <Button className="mt-6" asChild>
                <Link href="/sign-up">
                  See your own gaps <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="border-b border-border/60 py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-semibold tracking-tight">Related pages</h2>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {RELATED.map((link) => (
                <Button key={link.href} variant="outline" asChild>
                  <Link href={link.href}>{link.label}</Link>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight">Frequently asked questions</h2>
            <div className="mt-8 space-y-6">
              {FAQ.map((item) => (
                <div key={item.q}>
                  <h3 className="font-medium">{item.q}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container flex flex-col items-center rounded-2xl border border-border/60 bg-card px-8 py-16 text-center">
          <Badge variant="outline" className="mb-6 gap-1.5">
            <Sparkles className="h-3 w-3" /> Free 14-day trial
          </Badge>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Check your AI visibility against Profound</h2>
          <p className="mt-4 max-w-lg text-muted-foreground">
            Enter your company and competitors. We&apos;ll score ChatGPT, Claude, Gemini, and Perplexity and tell you
            which comparison pages to publish next.
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
