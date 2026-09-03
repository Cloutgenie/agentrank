import Link from "next/link";
import { Check, FileBarChart, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Agency Mode",
  description: "Manage AI search visibility for every client from one dashboard, with white-label reports.",
  path: "/agency",
});

const FEATURES = [
  {
    icon: Building2,
    title: "Unlimited client projects",
    body: "Add every client as its own project — separate competitors, prompts, and tracking — without juggling separate accounts.",
  },
  {
    icon: FileBarChart,
    title: "White-label reports",
    body: "Export reports with your agency's branding, not ours. Clients see a report you built, not a tool they've never heard of.",
  },
];

export default function AgencyPage() {
  return (
    <div className="container max-w-3xl py-24">
      <div className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight">Run AI visibility tracking for every client</h1>
        <p className="mt-4 text-muted-foreground">
          Agency Mode turns Agent Rank Radar into your client-reporting layer for AI search — one dashboard, unlimited
          projects, reports with your name on them.
        </p>
        <Button className="mt-8" size="lg" asChild>
          <Link href="/pricing">See Agency plan pricing</Link>
        </Button>
      </div>

      <div className="mt-20 space-y-10">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="flex gap-4">
            <feature.icon className="mt-1 h-5 w-5 shrink-0 text-primary" />
            <div>
              <h2 className="font-medium">{feature.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{feature.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-20 rounded-lg border border-border p-8">
        <h2 className="font-medium">What's included on the Agency plan</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {[
            "Unlimited client projects",
            "2,500 tracked prompts",
            "White-label reports",
            "Monthly automated reports",
            "Priority support",
            "Custom onboarding",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              {item}
            </li>
          ))}
        </ul>
        <Button className="mt-6" variant="outline" asChild>
          <Link href="/pricing">View full pricing</Link>
        </Button>
      </div>
    </div>
  );
}
