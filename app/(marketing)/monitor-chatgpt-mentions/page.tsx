import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Bell, TrendingUp, TrendingDown, Sparkles, Mail, Slack } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Monitor ChatGPT Mentions — Weekly AI Visibility Alerts",
  description:
    "Stop checking ChatGPT by hand. AgentRank monitors your ChatGPT mentions continuously and sends weekly alerts the moment you lose visibility or a competitor overtakes you.",
};

const ALERTS = [
  {
    type: "visibility_lost" as const,
    title: "You lost visibility in Gemini",
    body: "Mention frequency dropped from 46% to 41% this week.",
    date: "Aug 29",
  },
  {
    type: "competitor_overtook" as const,
    title: "A competitor overtook you in Claude",
    body: 'For "best AI visibility tool for agencies", they now rank above you.',
    date: "Aug 27",
  },
  {
    type: "visibility_gained" as const,
    title: "You gained visibility in Perplexity",
    body: "Mention frequency rose from 58% to 66% this week.",
    date: "Aug 25",
  },
];

const WHY = [
  {
    title: "A one-off check expires the moment you close the tab",
    description:
      "ChatGPT's answers change as models update, as competitors publish new content, and as citation sources shift. A snapshot from last month tells you nothing about this week.",
  },
  {
    title: "Visibility loss is silent",
    description:
      "There's no notification when ChatGPT quietly stops recommending you. By the time you notice a drop in trial signups, you've likely been invisible for weeks.",
  },
  {
    title: "Competitors are actively working the same prompts",
    description:
      "Every comparison page and Reddit thread a competitor publishes can shift the exact prompts you're being tracked on. Monitoring catches the overtake the week it happens, not the quarter you finally check again.",
  },
];

const HOW_IT_WORKS = [
  {
    title: "Continuous prompt runs",
    description: "AgentRank re-runs your full prompt set on a daily or weekly cadence, every engine, automatically.",
  },
  {
    title: "Change detection",
    description:
      "We diff this run against the last one — new mentions, lost mentions, position shifts, and any competitor that jumped ahead of you.",
  },
  {
    title: "Alerts where you already work",
    description: "Weekly digest by email, or real-time pings in Slack the moment something material changes.",
  },
];

const FAQ = [
  {
    q: "How often does AgentRank check my ChatGPT mentions?",
    a: "Starter plans refresh weekly; Growth and Agency plans refresh daily across all four engines, so you catch changes within a day instead of finding out at the end of the month.",
  },
  {
    q: "What triggers an alert?",
    a: "Three things: your mention frequency drops on a tracked prompt, a competitor's mention frequency overtakes yours on a prompt you were previously winning, or your overall AI Visibility Score moves more than a few points week over week.",
  },
  {
    q: "Can I get alerts in Slack instead of email?",
    a: "Yes, on the Growth and Agency plans. Connect Slack once and every alert posts to the channel of your choice, alongside the weekly email digest.",
  },
  {
    q: "Will this replace my team manually checking ChatGPT every week?",
    a: "That's the point. Monitoring exists so nobody on your team has to remember to open ChatGPT on a Monday morning — the alert finds you instead.",
  },
];

export default function MonitorChatGptMentionsPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border/60 bg-grid">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-background" />
        <div className="container relative flex flex-col items-center py-24 text-center md:py-32">
          <Badge variant="outline" className="mb-6 gap-1.5">
            <Bell className="h-3 w-3" /> Continuous monitoring, not a one-off check
          </Badge>

          <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight md:text-6xl">
            Don't check ChatGPT once. <span className="text-primary">Monitor it every week.</span>
          </h1>

          <p className="mt-6 max-w-xl text-balance text-lg text-muted-foreground">
            AgentRank watches your ChatGPT mentions continuously and tells you the moment you lose visibility or a
            competitor overtakes you — before it shows up in your pipeline numbers.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/sign-up">
                Set up monitoring <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/chatgpt-ranking-checker">Just run a one-off check first</Link>
            </Button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">No credit card required · Free 14-day trial</p>
        </div>
      </section>

      <section className="border-b border-border/60 py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Your weekly visibility digest</h2>
            <p className="mt-4 text-muted-foreground">
              Every alert is scoped to exactly what changed — no dashboard spelunking required.
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-2xl space-y-4">
            {ALERTS.map((alert) => (
              <Card key={alert.title}>
                <CardContent className="flex items-start gap-4 p-6">
                  {alert.type === "visibility_lost" && (
                    <TrendingDown className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                  )}
                  {alert.type === "competitor_overtook" && (
                    <TrendingDown className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                  )}
                  {alert.type === "visibility_gained" && (
                    <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="font-medium">{alert.title}</h3>
                      <span className="shrink-0 text-xs text-muted-foreground">{alert.date}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{alert.body}</p>
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
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Why a one-off ChatGPT check isn't enough
            </h2>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {WHY.map((item) => (
              <Card key={item.title}>
                <CardContent className="p-6">
                  <h3 className="font-medium">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 py-24">
        <div className="container grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">How monitoring works</h2>
            <p className="mt-4 text-muted-foreground">
              Set it up once during onboarding. From then on, AgentRank does the checking — you just read the
              alerts.
            </p>
            <ul className="mt-6 space-y-4">
              {HOW_IT_WORKS.map((item) => (
                <li key={item.title} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                    ✓
                  </span>
                  <div>
                    <span className="font-medium text-foreground">{item.title}.</span>{" "}
                    <span className="text-muted-foreground">{item.description}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <Card>
            <CardContent className="flex flex-col gap-6 p-8">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Weekly email digest</p>
                  <p className="text-xs text-muted-foreground">Every Monday, straight to your inbox</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Slack className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Real-time Slack alerts</p>
                  <p className="text-xs text-muted-foreground">Growth &amp; Agency plans</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">In-dashboard alert feed</p>
                  <p className="text-xs text-muted-foreground">Full history, filterable by engine</p>
                </div>
              </div>
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
            <Sparkles className="h-3 w-3" /> Free 14-day trial
          </Badge>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Never miss a visibility change again</h2>
          <p className="mt-4 max-w-lg text-muted-foreground">
            Set up monitoring in minutes. We'll send your first weekly digest after your next scheduled run.
          </p>
          <Button size="lg" className="mt-8" asChild>
            <Link href="/sign-up">
              Set up monitoring <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
