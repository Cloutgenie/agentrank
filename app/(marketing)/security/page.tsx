import { ShieldCheck, Lock, Database, KeyRound } from "lucide-react";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Security",
  description: "How AgentRank Radar protects your account and data.",
  path: "/security",
});

const PRACTICES = [
  {
    icon: KeyRound,
    title: "Authentication",
    body: "Sign-in is handled by Clerk, with support for email/password and Google OAuth. We never store your password ourselves.",
  },
  {
    icon: Database,
    title: "Data isolation",
    body: "Every organization's data is scoped by row-level security policies in our Postgres database, and every dashboard action is checked server-side against your own organization before it can read or modify anything.",
  },
  {
    icon: Lock,
    title: "Encryption",
    body: "Data is encrypted in transit (TLS) and at rest, using the same infrastructure providers (Supabase, Vercel) that host the rest of the app.",
  },
  {
    icon: ShieldCheck,
    title: "Payments",
    body: "Billing is handled entirely by Stripe. Card numbers are never sent to or stored on our servers.",
  },
];

export default function SecurityPage() {
  return (
    <div className="container max-w-2xl py-24">
      <h1 className="text-4xl font-semibold tracking-tight">Security</h1>
      <p className="mt-4 text-muted-foreground">
        A straightforward look at how we protect your account and your data.
      </p>

      <div className="mt-12 space-y-8">
        {PRACTICES.map((item) => (
          <div key={item.title} className="flex gap-4">
            <item.icon className="mt-1 h-5 w-5 shrink-0 text-primary" />
            <div>
              <h2 className="font-medium">{item.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 border-t border-border/60 pt-8 text-sm text-muted-foreground">
        <h2 className="font-medium text-foreground">Found a vulnerability?</h2>
        <p className="mt-2">
          We take security reports seriously. Email{" "}
          <a href="mailto:security@agentrankradar.com" className="text-foreground underline underline-offset-4">
            security@agentrankradar.com
          </a>{" "}
          with details and we'll respond as quickly as we can.
        </p>
      </div>
    </div>
  );
}
