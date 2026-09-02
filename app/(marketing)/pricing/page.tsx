import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { pageMetadata } from "@/lib/seo";
import { FaqJsonLd, SoftwareApplicationJsonLd } from "@/components/seo/json-ld";

export const metadata = pageMetadata({
  title: "Pricing",
  description:
    "Simple pricing that scales with your visibility. Starter, Growth, and Agency plans, each with a 3-day free trial and no credit card required.",
  path: "/pricing",
});

const PLANS = [
  {
    name: "Starter",
    price: 29,
    description: "For indie founders tracking one product against a few competitors.",
    cta: "Start free trial",
    highlighted: false,
    features: [
      "1 project",
      "100 tracked prompts",
      "4 AI engines (ChatGPT, Claude, Gemini, Perplexity)",
      "Weekly visibility reports",
      "3 competitors tracked",
      "Email alerts",
    ],
  },
  {
    name: "Growth",
    price: 99,
    description: "For SaaS and ecommerce teams that need daily tracking and content recommendations.",
    cta: "Start free trial",
    highlighted: true,
    features: [
      "3 projects",
      "500 tracked prompts",
      "4 AI engines, daily refresh",
      "Citation analysis",
      "AI SEO recommendations",
      "10 competitors tracked",
      "Slack + email alerts",
      "API access",
    ],
  },
  {
    name: "Agency",
    price: 299,
    description: "For agencies and consultants managing AI visibility across every client.",
    cta: "Talk to sales",
    highlighted: false,
    features: [
      "Unlimited client projects",
      "2,500 tracked prompts",
      "White-label reports",
      "Client dashboard access",
      "Monthly automated reports",
      "Priority support",
      "Custom onboarding",
    ],
  },
];

const FAQ = [
  {
    q: "How do you generate the prompts you track?",
    a: "We use your industry, website, and competitor list to generate hundreds of real buyer-intent prompts — category questions, comparisons, and use-case questions — the same shapes of question real buyers type into ChatGPT and Perplexity.",
  },
  {
    q: "How is the AI Visibility Score calculated?",
    a: "It blends mention frequency, share of voice against tracked competitors, and average position when you're mentioned, so a brand mentioned first in half its prompts scores higher than one buried 6th in all of them.",
  },
  {
    q: "Can I track competitors who aren't customers of AgentRank Radar?",
    a: "Yes. You add competitor names and we track their visibility across the same prompt set — no cooperation from them required.",
  },
  {
    q: "Do you offer an annual discount?",
    a: "Yes, annual billing saves 20% on any plan. Toggle it at checkout.",
  },
];

export default function PricingPage() {
  return (
    <div className="container py-24">
      <SoftwareApplicationJsonLd />
      <FaqJsonLd faq={FAQ} />

      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-semibold tracking-tight">Simple pricing that scales with your visibility</h1>
        <p className="mt-4 text-muted-foreground">3-day free trial on every plan. Cancel anytime.</p>
      </div>

      <div className="mt-16 grid gap-6 md:grid-cols-3">
        {PLANS.map((plan) => (
          <Card key={plan.name} className={cn("relative flex flex-col", plan.highlighted && "border-primary shadow-lg shadow-primary/10")}>
            {plan.highlighted && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                Most popular
              </span>
            )}
            <CardHeader>
              <CardTitle className="text-base text-foreground">{plan.name}</CardTitle>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight">${plan.price}</span>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <ul className="flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button className="mt-8" variant={plan.highlighted ? "default" : "outline"} asChild>
                <Link href="/sign-up">{plan.cta}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mx-auto mt-24 max-w-2xl">
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
  );
}
