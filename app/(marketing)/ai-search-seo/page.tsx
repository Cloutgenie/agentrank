import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, BookOpen, Sparkles, MessageSquare, Star, Users2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "AI Search SEO — A Practical Guide to AEO & GEO",
  description:
    "What AI search SEO (AEO/GEO) actually means, how it differs from traditional SEO, why citation sources like Reddit and G2 matter, and how to start optimizing for ChatGPT, Claude, Gemini, and Perplexity.",
};

const COMPARISON_ROWS = [
  { dimension: "What you're optimizing for", seo: "Ranking position in a list of 10 blue links", aeo: "Being named inside a single generated answer" },
  { dimension: "Primary signal", seo: "Backlinks, keyword density, page authority", aeo: "Third-party mentions, citations, structured clarity" },
  { dimension: "Where citations come from", seo: "Mostly your own site and press", aeo: "Reddit, G2, Trustpilot, forums, comparison sites" },
  { dimension: "How you measure success", seo: "SERP rank, organic traffic, CTR", aeo: "Mention frequency, share of voice, answer position" },
  { dimension: "Update cycle", seo: "Google re-crawls and re-ranks over weeks", aeo: "Answers can shift with every model update or new citation" },
  { dimension: "Who reads the result", seo: "A human scanning search results", aeo: "An AI model synthesizing one answer for a human" },
];

const CITATION_SOURCES = [
  { icon: MessageSquare, name: "Reddit", note: "Threads are treated as unfiltered, first-person opinion — heavily cited for comparison and recommendation prompts." },
  { icon: Star, name: "G2 & Capterra", note: "Structured review data with ratings gives models a fast way to rank options by category." },
  { icon: Users2, name: "Trustpilot", note: "Aggregate sentiment signals models use to hedge or reinforce a recommendation." },
  { icon: BookOpen, name: "Independent blogs & comparison sites", note: "Long-form 'X vs Y' and 'best tools for Z' posts are exactly the shape of content models quote from." },
];

const STEPS = [
  {
    title: "Find out where you stand",
    description: "Run a ChatGPT and Claude ranking check to see your current mention frequency and position against named competitors.",
  },
  {
    title: "Identify your citation gaps",
    description: "See which domains AI models cite when they recommend a competitor over you — usually Reddit, G2, or a comparison blog you're absent from.",
  },
  {
    title: "Publish the content that closes the gap",
    description: "Comparison pages, integration pages, and definitional glossary pages are the formats models quote most often — because they answer one question clearly.",
  },
  {
    title: "Earn third-party mentions",
    description: "Engage authentically in the Reddit threads and review sites your buyers already read; models weight independent voices heavily.",
  },
  {
    title: "Monitor, don't guess",
    description: "Re-run your tracked prompts weekly so you know the moment a competitor's new content shifts an answer back in their favor.",
  },
];

const FAQ = [
  {
    q: "What do AEO and GEO actually stand for?",
    a: "AEO is Answer Engine Optimization — optimizing for being cited inside a generated answer instead of ranking a page. GEO, Generative Engine Optimization, is used interchangeably in most of the industry. Both describe the same discipline: earning a mention inside ChatGPT, Claude, Gemini, and Perplexity's answers.",
  },
  {
    q: "Does traditional SEO still matter if I do AI search SEO?",
    a: "Yes. Your own site is still one of the sources models pull from, and strong traditional SEO — clear structure, authoritative content, fast pages — makes your content easier for a model to find and cite in the first place. AI search SEO adds a second layer on top: earning mentions on the third-party sites models trust most.",
  },
  {
    q: "Why do Reddit and G2 matter more than my own website?",
    a: "AI models are trained to treat first-person, independent commentary as a stronger signal than brand-authored copy, since it's harder to game. A glowing G2 review or a genuine Reddit recommendation carries more weight in a generated answer than the same claim on your homepage.",
  },
  {
    q: "How long does it take to see a ranking change?",
    a: "It varies by engine. Perplexity and ChatGPT's search-enabled models can reflect new citations within days to weeks since they pull live web results; the underlying training data behind base model knowledge updates far less frequently. That's why monitoring, not a one-time push, is the practical approach.",
  },
];

export default function AiSearchSeoPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border/60 bg-grid">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-background" />
        <div className="container relative flex flex-col items-center py-24 text-center md:py-32">
          <Badge variant="outline" className="mb-6 gap-1.5">
            <BookOpen className="h-3 w-3" /> The AI search SEO guide
          </Badge>

          <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight md:text-6xl">
            SEO got you onto Google. <span className="text-primary">This gets you into the answer.</span>
          </h1>

          <p className="mt-6 max-w-xl text-balance text-lg text-muted-foreground">
            AI search SEO — also called AEO or GEO — is the practice of earning a mention inside ChatGPT, Claude,
            Gemini, and Perplexity's answers, not just a spot in a list of ten blue links.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/sign-up">
                Check my AI visibility <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/chatgpt-ranking-checker">Try the ChatGPT ranking checker</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">What is AI search SEO?</h2>
            <p className="mt-4 text-muted-foreground">
              Every day, more buyers skip the search results page entirely and ask an AI model directly: "what's the
              best CRM for a five-person sales team," "AgentRank vs Profound," "how do I track my brand in ChatGPT."
              The model synthesizes one answer from what it knows and, increasingly, from a live web search. AI
              search SEO is the discipline of making sure your company is one of the names that answer includes —
              by understanding what the model reads, who it trusts, and how it decides who to mention first.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              How AI search SEO differs from traditional SEO
            </h2>
            <p className="mt-4 text-muted-foreground">
              Same goal — get found by buyers — very different mechanics.
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-4xl overflow-x-auto">
            <table className="w-full border-collapse overflow-hidden rounded-lg border border-border text-sm">
              <thead>
                <tr className="bg-secondary text-left">
                  <th className="p-4 font-medium">Dimension</th>
                  <th className="p-4 font-medium">Traditional SEO</th>
                  <th className="p-4 font-medium">AI search SEO (AEO/GEO)</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.dimension} className="border-t border-border align-top">
                    <td className="p-4 font-medium">{row.dimension}</td>
                    <td className="p-4 text-muted-foreground">{row.seo}</td>
                    <td className="p-4 text-muted-foreground">{row.aeo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Why citation sources matter more than your homepage
            </h2>
            <p className="mt-4 text-muted-foreground">
              These are the domains AgentRank sees cited most often when AI models justify a recommendation.
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-2">
            {CITATION_SOURCES.map((source) => (
              <Card key={source.name}>
                <CardContent className="flex items-start gap-4 p-6">
                  <source.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <h3 className="font-medium">{source.name}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{source.note}</p>
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
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Where to start</h2>
          </div>

          <div className="mx-auto mt-12 max-w-2xl space-y-4">
            {STEPS.map((step, i) => (
              <div key={step.title} className="flex items-start gap-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-medium">{step.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-12 flex max-w-2xl flex-wrap justify-center gap-3">
            <Button variant="outline" asChild>
              <Link href="/chatgpt-ranking-checker">ChatGPT ranking checker</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/claude-ranking-checker">Claude ranking checker</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/monitor-chatgpt-mentions">Monitor mentions weekly</Link>
            </Button>
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
            <Sparkles className="h-3 w-3" /> Free 3-day trial
          </Badge>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">See your AI search SEO baseline</h2>
          <p className="mt-4 max-w-lg text-muted-foreground">
            Enter your company and competitors. AgentRank shows your current AI Visibility Score and exactly which
            content to publish next.
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
