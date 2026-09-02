import Link from "next/link";
import { ArrowRight, Search, Bot, Quote as QuoteMark, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { pageMetadata } from "@/lib/seo";
import { FaqJsonLd } from "@/components/seo/json-ld";

export const metadata = pageMetadata({
  title: "ChatGPT Ranking Checker — See If ChatGPT Recommends Your Company",
  description:
    "Check whether ChatGPT mentions your company for the searches that matter, benchmark your position against competitors, and track it automatically with Agent Rank Radar's ChatGPT ranking checker.",
  path: "/chatgpt-ranking-checker",
});

const EXAMPLE_PROMPTS = [
  "best project management software for remote teams",
  "what's a good Ahrefs alternative for AI search",
  "top CRM tools for small agencies",
  "recommend a tool to track brand mentions in ChatGPT",
  "Agent Rank Radar vs Profound vs Otterly.AI",
];

const SCOREBOARD = [
  { name: "Your Company", score: 43 },
  { name: "Competitor A", score: 31 },
  { name: "Competitor B", score: 18 },
];

const STEPS = [
  {
    title: "We generate buyer-intent prompts",
    description:
      "Starting from your industry, website, and competitor list, Agent Rank Radar builds a set of category, comparison, and use-case prompts — the same phrasing real buyers type into ChatGPT.",
  },
  {
    title: "We query the ChatGPT search model directly",
    description:
      "Every prompt is sent to OpenAI's gpt-4o-search-preview model — the same web-connected model that powers ChatGPT's live answers — so results reflect what a real user would see today, not a cached snapshot.",
  },
  {
    title: "We parse the answer for mentions and citations",
    description:
      "Each response is scanned for your brand name, your competitors' names, the order they appear in, and every domain ChatGPT cited to back up its answer.",
  },
  {
    title: "We score and track it over time",
    description:
      "Mentions become an AI Visibility Score you can compare week over week and against every competitor you're tracking.",
  },
];

const COMPARISON_ROWS = [
  { capability: "Checks the live, web-connected ChatGPT model", manual: false, agentrank: true },
  { capability: "Runs hundreds of prompts, not one at a time", manual: false, agentrank: true },
  { capability: "Tracks competitor mentions automatically", manual: false, agentrank: true },
  { capability: "Records position and citation sources", manual: false, agentrank: true },
  { capability: "Alerts you when your ranking changes", manual: false, agentrank: true },
  { capability: "Costs nothing but your time", manual: true, agentrank: false },
];

const FAQ = [
  {
    q: "Does asking ChatGPT myself give the same result as a ranking checker?",
    a: "Not reliably. ChatGPT's answers vary by phrasing, account history, and the day you ask, and a single manual check only tells you about one prompt at one moment. Agent Rank Radar runs the same broad set of prompts on a schedule so you see a real trend instead of one noisy data point.",
  },
  {
    q: "Which ChatGPT model does Agent Rank Radar actually query?",
    a: "We query OpenAI's gpt-4o-search-preview model, the web-search-enabled model behind ChatGPT's live answers, so the mentions and citations we record match what a prospect asking ChatGPT right now would actually see.",
  },
  {
    q: "What counts as a 'mention'?",
    a: "Any time your company name (or a close variant) appears in ChatGPT's answer to a tracked prompt. We also record the position it appeared in relative to competitors and whether it was framed as a top recommendation, an also-mentioned option, or not mentioned at all.",
  },
  {
    q: "Can I check a specific competitor's ChatGPT ranking too?",
    a: "Yes. Add any competitor's name when you set up a project and Agent Rank Radar tracks their mentions across the exact same prompt set, so every comparison is apples-to-apples.",
  },
];

export default function ChatGptRankingCheckerPage() {
  return (
    <>
      <FaqJsonLd faq={FAQ} />
      <section className="relative overflow-hidden border-b border-border/60 bg-grid">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-background" />
        <div className="container relative flex flex-col items-center py-24 text-center md:py-32">
          <Badge variant="outline" className="mb-6 gap-1.5">
            <Bot className="h-3 w-3" /> ChatGPT ranking checker
          </Badge>

          <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight md:text-6xl">
            Is <span className="text-primary">ChatGPT recommending you</span> — or your competitor?
          </h1>

          <p className="mt-6 max-w-xl text-balance text-lg text-muted-foreground">
            Agent Rank Radar's ChatGPT ranking checker runs your category's real buyer-intent prompts against ChatGPT's live
            search model and shows you exactly where you stand, mention by mention.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/sign-up">
                Check my ChatGPT ranking <ArrowRight className="h-4 w-4" />
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
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              What is a ChatGPT ranking checker?
            </h2>
            <p className="mt-4 text-muted-foreground">
              A ChatGPT ranking checker is a tool that repeatedly asks ChatGPT the questions your buyers actually ask
              — "best [category] for [use case]", "[you] vs [competitor]", "top tools for [problem]" — and records
              whether your company shows up in the answer, in what position, and alongside which competitors.
              It does for ChatGPT what a rank tracker does for Google: turn an invisible, constantly shifting answer
              into a number you can watch move.
            </p>
          </div>

          <Card className="mx-auto mt-12 max-w-2xl">
            <CardContent className="p-8">
              <h3 className="text-sm font-medium text-muted-foreground">
                AI Visibility Score — "best project management software"
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
              How Agent Rank Radar checks your ChatGPT ranking
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
              Manually asking ChatGPT vs. a real ranking checker
            </h2>
          </div>

          <div className="mx-auto mt-12 max-w-2xl overflow-x-auto">
            <table className="w-full border-collapse overflow-hidden rounded-lg border border-border text-sm">
              <thead>
                <tr className="bg-secondary text-left">
                  <th className="p-4 font-medium">Capability</th>
                  <th className="p-4 text-center font-medium">Asking ChatGPT yourself</th>
                  <th className="p-4 text-center font-medium">Agent Rank Radar</th>
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
                "We were checking ChatGPT by hand every Monday morning. Agent Rank Radar replaced that with a real trend
                line and told us the exact prompts we were losing."
              </p>
              <p className="mt-4 text-sm text-muted-foreground">Founder, B2B SaaS company</p>
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
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Find out your ChatGPT ranking today</h2>
          <p className="mt-4 max-w-lg text-muted-foreground">
            Enter your company and three competitors. We'll run your first ChatGPT visibility report in minutes —
            then keep watching it for you.
          </p>
          <Button size="lg" className="mt-8" asChild>
            <Link href="/sign-up">
              Check my ChatGPT ranking <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
