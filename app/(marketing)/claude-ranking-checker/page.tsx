import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Search, Bot, Quote as QuoteMark, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Claude Ranking Checker — See If Claude Recommends Your Company",
  description:
    "Check whether Anthropic's Claude mentions your company for the questions your buyers ask, benchmark it against competitors, and track it automatically with AgentRank's Claude ranking checker.",
};

const EXAMPLE_PROMPTS = [
  "best AI visibility tracking tool for SaaS teams",
  "what should I use instead of Ahrefs for AI search",
  "top help desk software for startups",
  "how do I know if Claude recommends my product",
  "AgentRank vs Otterly.AI vs Peec AI",
];

const SCOREBOARD = [
  { name: "Your Company", score: 37 },
  { name: "Competitor A", score: 29 },
  { name: "Competitor B", score: 22 },
];

const STEPS = [
  {
    title: "We generate buyer-intent prompts",
    description:
      "From your industry, website, and competitor list, AgentRank builds category, comparison, and use-case prompts — the same phrasing real buyers type when they ask Claude for a recommendation.",
  },
  {
    title: "We query the Claude API directly",
    description:
      "Every prompt is sent to Anthropic's Messages API against the current Claude Sonnet model, so the answer reflects what a real user asking Claude today would see, not a stale sample.",
  },
  {
    title: "We parse the answer for mentions and citations",
    description:
      "Each response is scanned for your brand name, competitor names, the order they're presented in, and any domains Claude references to support its answer.",
  },
  {
    title: "We score and track it over time",
    description:
      "Mentions roll up into an AI Visibility Score you can compare week over week — and against ChatGPT, Gemini, and Perplexity in the same dashboard.",
  },
];

const COMPARISON_ROWS = [
  { capability: "Queries the current Claude model via API", manual: false, agentrank: true },
  { capability: "Runs hundreds of prompts on a schedule", manual: false, agentrank: true },
  { capability: "Tracks competitor mentions automatically", manual: false, agentrank: true },
  { capability: "Records position and cited sources", manual: false, agentrank: true },
  { capability: "Alerts you when your ranking changes", manual: false, agentrank: true },
  { capability: "Costs nothing but your time", manual: true, agentrank: false },
];

const FAQ = [
  {
    q: "Is Claude's answer about my company the same every time I ask?",
    a: "No. Claude's answers vary with phrasing and context, so a single manual chat only captures one data point. AgentRank runs a broad, consistent prompt set on a schedule so you see a trend, not a fluke.",
  },
  {
    q: "Which Claude model does AgentRank query?",
    a: "We call Anthropic's Messages API against the current Claude Sonnet model, the same family of model most Claude.ai users are talking to, so the mentions we record match what a real prospect would see.",
  },
  {
    q: "How is a 'mention' defined for Claude?",
    a: "Any time your company name (or a close variant) appears in Claude's answer to a tracked prompt. We also capture where it appeared relative to competitors and whether Claude framed it as a top pick, an also-mentioned option, or left it out.",
  },
  {
    q: "Does this replace tracking ChatGPT, Gemini, and Perplexity?",
    a: "No — it complements them. AgentRank tracks all four engines from the same prompt set and project, so you get one AI Visibility Score plus a per-engine breakdown instead of four separate tools.",
  },
];

export default function ClaudeRankingCheckerPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border/60 bg-grid">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-background" />
        <div className="container relative flex flex-col items-center py-24 text-center md:py-32">
          <Badge variant="outline" className="mb-6 gap-1.5">
            <Bot className="h-3 w-3" /> Claude ranking checker
          </Badge>

          <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight md:text-6xl">
            Is <span className="text-primary">Claude recommending you</span> — or your competitor?
          </h1>

          <p className="mt-6 max-w-xl text-balance text-lg text-muted-foreground">
            AgentRank's Claude ranking checker runs your category's real buyer-intent prompts against Anthropic's
            Claude and shows you exactly where you stand, mention by mention.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/sign-up">
                Check my Claude ranking <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/ai-search-seo">What is AI search SEO?</Link>
            </Button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">No credit card required · Free 3-day trial</p>
        </div>
      </section>

      <section className="border-b border-border/60 py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">What is a Claude ranking checker?</h2>
            <p className="mt-4 text-muted-foreground">
              A Claude ranking checker repeatedly asks Claude the questions your buyers actually ask — "best
              [category] for [use case]", "[you] vs [competitor]", "top tools for [problem]" — and records whether
              your company shows up in the answer, in what position, and alongside which competitors. It does for
              Claude what a rank tracker does for Google: turn an invisible, constantly shifting answer into a
              number you can watch move.
            </p>
          </div>

          <Card className="mx-auto mt-12 max-w-2xl">
            <CardContent className="p-8">
              <h3 className="text-sm font-medium text-muted-foreground">
                AI Visibility Score — "best help desk software for startups"
              </h3>
              <div className="mt-6 space-y-4">
                {SCOREBOARD.map((row) => (
                  <div key={row.name} className="flex items-center gap-4">
                    <span className="w-32 shrink-0 text-sm font-medium">{row.name}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${row.score}%` }} />
                    </div>
                    <span className="w-10 shrink-0 text-right text-sm tabular-nums">{row.score}%</span>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-xs text-muted-foreground">
                Illustrative example — your real report is generated from your own prompt set.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="border-b border-border/60 py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              How AgentRank checks your Claude ranking
            </h2>
            <p className="mt-4 text-muted-foreground">
              We don't scrape screenshots or guess from cached data — we query the model itself.
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-2">
            {STEPS.map((step, i) => (
              <Card key={step.title}>
                <CardContent className="p-6">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 font-medium">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Example prompts we'd track for you</h2>
            <p className="mt-4 text-muted-foreground">
              A real project tracks hundreds of these, generated from your category and competitor list.
            </p>
          </div>

          <div className="mx-auto mt-10 flex max-w-2xl flex-wrap justify-center gap-2">
            {EXAMPLE_PROMPTS.map((prompt) => (
              <Badge key={prompt} variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm font-normal">
                <Search className="h-3 w-3" /> {prompt}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Manually asking Claude vs. a real ranking checker
            </h2>
          </div>

          <div className="mx-auto mt-12 max-w-2xl overflow-x-auto">
            <table className="w-full border-collapse overflow-hidden rounded-lg border border-border text-sm">
              <thead>
                <tr className="bg-secondary text-left">
                  <th className="p-4 font-medium">Capability</th>
                  <th className="p-4 text-center font-medium">Asking Claude yourself</th>
                  <th className="p-4 text-center font-medium">AgentRank</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.capability} className="border-t border-border">
                    <td className="p-4">{row.capability}</td>
                    <td className="p-4 text-center">
                      {row.manual ? (
                        <Badge variant="success">Yes</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {row.agentrank ? (
                        <Badge variant="success">Yes</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 py-24">
        <div className="container">
          <Card className="mx-auto max-w-2xl">
            <CardContent className="p-8">
              <QuoteMark className="h-6 w-6 text-primary" />
              <p className="mt-4 text-lg">
                "Claude was quietly recommending a competitor for our best comparison keyword. We wouldn't have
                caught it without a weekly, automated check."
              </p>
              <p className="mt-4 text-sm text-muted-foreground">Head of Marketing, DevTools startup</p>
            </CardContent>
          </Card>
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
            <Sparkles className="h-3 w-3" /> Free 3-day trial
          </Badge>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Find out your Claude ranking today</h2>
          <p className="mt-4 max-w-lg text-muted-foreground">
            Enter your company and three competitors. We'll run your first Claude visibility report in minutes —
            then keep watching it for you.
          </p>
          <Button size="lg" className="mt-8" asChild>
            <Link href="/sign-up">
              Check my Claude ranking <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
