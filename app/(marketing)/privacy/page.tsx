import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description: "How Agent Rank Radar collects, uses, and protects your data.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <div className="container max-w-2xl py-24">
      <h1 className="text-4xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated September 2, 2026</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-base font-medium text-foreground">What we collect</h2>
          <p className="mt-2">
            When you create an account, we collect your name and email address through Clerk, our authentication
            provider. When you set up a project, we store the company name, website, industry, and competitor names
            you provide, along with the prompts we generate and the tracking results we produce from them. If you
            subscribe to a paid plan, billing is handled by Stripe — we never see or store your card details.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-foreground">How we use it</h2>
          <p className="mt-2">
            We use your project data to run scheduled queries against AI providers (OpenAI, Anthropic, Google, and
            Perplexity) on your behalf, score the results, and show them on your dashboard. We use your email to send
            account notifications, visibility alerts you've opted into, and billing receipts. We don't sell your data
            or share it with third parties for advertising.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-foreground">Where it's stored</h2>
          <p className="mt-2">
            Your data lives in a Postgres database managed by Supabase, with row-level security policies that scope
            every query to your own organization. Authentication is handled by Clerk. Both providers encrypt data at
            rest and in transit.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-foreground">Third-party AI providers</h2>
          <p className="mt-2">
            To measure your AI visibility, we send the prompts we generate for your project to OpenAI, Anthropic,
            Google, and Perplexity, and store their responses. We don't send your account credentials or billing
            information to these providers — only the prompt text needed to run the query.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-foreground">Your rights</h2>
          <p className="mt-2">
            You can request a copy of your data or ask us to delete your account and associated data at any time by
            contacting us. Deleting your account removes your projects, tracked prompts, and results from our
            database.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-foreground">Questions</h2>
          <p className="mt-2">
            Reach us at{" "}
            <a href="mailto:hello@agentrankradar.com" className="text-foreground underline underline-offset-4">
              hello@agentrankradar.com
            </a>{" "}
            with any privacy questions.
          </p>
        </section>
      </div>
    </div>
  );
}
