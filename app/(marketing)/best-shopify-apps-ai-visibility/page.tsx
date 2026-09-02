import Link from "next/link";
import { ArrowRight, ShoppingBag, TrendingUp, TrendingDown, Minus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { pageMetadata } from "@/lib/seo";
import { FaqJsonLd } from "@/components/seo/json-ld";

export const metadata = pageMetadata({
  title: "Best Shopify Apps for AI Visibility (2026 Leaderboard)",
  description:
    "Which Shopify apps get recommended most often by ChatGPT, Claude, Gemini, and Perplexity? An illustrative AI visibility leaderboard for the Shopify app ecosystem, tracked by AgentRank Radar.",
  path: "/best-shopify-apps-ai-visibility",
});

const LEADERBOARD = [
  { rank: 1, name: "CartLift", category: "Cart recovery & upsells", score: 61, trend: "up" as const, chatgpt: 64, claude: 58, perplexity: 66 },
  { rank: 2, name: "ReviewForge", category: "Reviews & UGC", score: 54, trend: "up" as const, chatgpt: 52, claude: 55, perplexity: 57 },
  { rank: 3, name: "StitchSync", category: "Inventory sync", score: 47, trend: "flat" as const, chatgpt: 45, claude: 44, perplexity: 51 },
  { rank: 4, name: "LoopReturns Pro", category: "Returns management", score: 42, trend: "down" as const, chatgpt: 40, claude: 41, perplexity: 44 },
  { rank: 5, name: "PixelBloom", category: "Product photography AI", score: 38, trend: "up" as const, chatgpt: 36, claude: 33, perplexity: 45 },
  { rank: 6, name: "ShipCrate", category: "Shipping rates", score: 33, trend: "flat" as const, chatgpt: 31, claude: 30, perplexity: 38 },
  { rank: 7, name: "Boostly SMS", category: "SMS marketing", score: 29, trend: "down" as const, chatgpt: 27, claude: 26, perplexity: 33 },
];

const WHY_IT_MATTERS = [
  {
    title: "Merchants are asking AI, not just browsing the app store",
    description:
      "\"Best Shopify app for abandoned cart recovery\" is now a prompt, not just a search query — and the app store's own ranking algorithm has no influence over what ChatGPT or Perplexity says back.",
  },
  {
    title: "Review volume on the app store doesn't guarantee an AI mention",
    description:
      "AI models weigh independent citations — Reddit threads in r/shopify, review roundups, comparison blogs — more heavily than the star rating shown inside Shopify's own listing page.",
  },
  {
    title: "One category, many close competitors",
    description:
      "Most Shopify app categories have five or more credible options. A few extra points of AI Visibility Score is often the difference between being the default recommendation and being invisible.",
  },
];

const FAQ = [
  {
    q: "Is this leaderboard live data?",
    a: "This page shows an illustrative example of the leaderboard format AgentRank Radar produces — the app names and scores above are for demonstration. Track your own Shopify app's real AI Visibility Score by creating a project.",
  },
  {
    q: "How would AgentRank Radar track a real Shopify app category?",
    a: "We'd generate the buyer-intent prompts merchants actually type — \"best app for X\", \"X vs Y for Shopify\", \"top rated Y app\" — run them against ChatGPT, Claude, Gemini, and Perplexity, and score every app in the category on the same prompt set.",
  },
  {
    q: "Can I track my Shopify app against a custom competitor list?",
    a: "Yes. Add any competitor app names when you set up a project, and AgentRank Radar tracks their mentions across the exact same prompts as yours, so the comparison is apples-to-apples.",
  },
  {
    q: "Does a higher Shopify App Store rating help my AI visibility?",
    a: "It can indirectly — reviews often get quoted or summarized on third-party sites AI models cite — but the App Store rating itself isn't a direct input into most models' answers. Independent citations matter more than the in-store score.",
  },
];

const TREND_ICON = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
};

export default function BestShopifyAppsAiVisibilityPage() {
  return (
    <>
      <FaqJsonLd faq={FAQ} />
      <section className="relative overflow-hidden border-b border-border/60 bg-grid">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-background" />
        <div className="container relative flex flex-col items-center py-24 text-center md:py-32">
          <Badge variant="outline" className="mb-6 gap-1.5">
            <ShoppingBag className="h-3 w-3" /> AI visibility leaderboard
          </Badge>

          <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight md:text-6xl">
            Which <span className="text-primary">Shopify apps</span> does AI actually recommend?
          </h1>

          <p className="mt-6 max-w-xl text-balance text-lg text-muted-foreground">
            Merchants ask ChatGPT and Perplexity for app recommendations every day. Here's an illustrative look at
            how AgentRank Radar scores a Shopify app category for AI visibility — and how your app would stack up.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/sign-up">
                Track my Shopify app <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/ai-search-seo">What is AI search SEO?</Link>
            </Button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">Illustrative example · No credit card required</p>
        </div>
      </section>

      <section className="border-b border-border/60 py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Cart recovery &amp; upsell apps — AI Visibility Score
            </h2>
            <p className="mt-4 text-muted-foreground">
              Illustrative example. Scores blend mention frequency and average position across ChatGPT, Claude, and
              Perplexity for prompts like "best Shopify app for abandoned cart recovery."
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-4xl overflow-x-auto">
            <table className="w-full border-collapse overflow-hidden rounded-lg border border-border text-sm">
              <thead>
                <tr className="bg-secondary text-left">
                  <th className="p-4 font-medium">#</th>
                  <th className="p-4 font-medium">App</th>
                  <th className="p-4 font-medium">Category</th>
                  <th className="p-4 text-center font-medium">ChatGPT</th>
                  <th className="p-4 text-center font-medium">Claude</th>
                  <th className="p-4 text-center font-medium">Perplexity</th>
                  <th className="p-4 text-center font-medium">Score</th>
                  <th className="p-4 text-center font-medium">Trend</th>
                </tr>
              </thead>
              <tbody>
                {LEADERBOARD.map((app) => {
                  const TrendIcon = TREND_ICON[app.trend];
                  return (
                    <tr key={app.name} className="border-t border-border">
                      <td className="p-4 text-muted-foreground">{app.rank}</td>
                      <td className="p-4 font-medium">{app.name}</td>
                      <td className="p-4 text-muted-foreground">{app.category}</td>
                      <td className="p-4 text-center tabular-nums text-muted-foreground">{app.chatgpt}%</td>
                      <td className="p-4 text-center tabular-nums text-muted-foreground">{app.claude}%</td>
                      <td className="p-4 text-center tabular-nums text-muted-foreground">{app.perplexity}%</td>
                      <td className="p-4 text-center">
                        <Badge variant={app.rank <= 2 ? "success" : "secondary"}>{app.score}</Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center">
                          <TrendIcon
                            className={`h-4 w-4 ${
                              app.trend === "up"
                                ? "text-success"
                                : app.trend === "down"
                                  ? "text-destructive"
                                  : "text-muted-foreground"
                            }`}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mx-auto mt-4 max-w-4xl text-xs text-muted-foreground">
            App names and scores are illustrative examples of AgentRank Radar's output format, not real measurements of
            existing Shopify apps.
          </p>
        </div>
      </section>

      <section className="border-b border-border/60 py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Why AI visibility matters for Shopify apps
            </h2>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {WHY_IT_MATTERS.map((item) => (
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
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Build your own category leaderboard</h2>
            <p className="mt-4 text-muted-foreground">
              AgentRank Radar can generate this same view for any Shopify app category — or any SaaS category at all.
              Add your app and up to ten competitors, and we'll score every one of them against the same prompt
              set, refreshed automatically.
            </p>
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
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">See where your app ranks</h2>
          <p className="mt-4 max-w-lg text-muted-foreground">
            Enter your Shopify app and a few competitors. We'll build your first AI visibility leaderboard in
            minutes.
          </p>
          <Button size="lg" className="mt-8" asChild>
            <Link href="/sign-up">
              Track my Shopify app <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
