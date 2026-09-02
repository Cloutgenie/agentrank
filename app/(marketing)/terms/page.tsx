import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of AgentRank.",
};

export default function TermsPage() {
  return (
    <div className="container max-w-2xl py-24">
      <h1 className="text-4xl font-semibold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated September 2, 2026</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-base font-medium text-foreground">Using AgentRank</h2>
          <p className="mt-2">
            AgentRank tracks how often ChatGPT, Claude, Gemini, and Perplexity mention your company and its
            competitors, and generates content recommendations based on that data. By creating an account, you agree
            to these terms.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-foreground">Accounts and trials</h2>
          <p className="mt-2">
            New accounts get a free trial with no card required. After the trial period, continued access requires an
            active subscription. You're responsible for keeping your login credentials secure and for all activity
            under your account.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-foreground">Billing</h2>
          <p className="mt-2">
            Subscriptions are billed monthly through Stripe. You can cancel at any time from your account settings;
            cancellation takes effect at the end of the current billing period. We don't offer prorated refunds for
            partial months.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-foreground">Accuracy of AI visibility data</h2>
          <p className="mt-2">
            AgentRank reports what AI models actually returned when we queried them at a point in time. AI models are
            non-deterministic and can change their answers between queries or update their underlying versions
            without notice. We do our best to track these changes, but we don't guarantee that any single result
            reflects what an end user would see at the exact moment they ask the same question.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-foreground">Acceptable use</h2>
          <p className="mt-2">
            Don't use AgentRank to track prompts unrelated to evaluating AI search visibility, to abuse the
            underlying AI providers' terms of service, or to attempt to access another organization's data.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-foreground">Changes</h2>
          <p className="mt-2">
            We may update these terms as the product evolves. We'll post the updated date at the top of this page
            when we do.
          </p>
        </section>

        <section>
          <h2 className="text-base font-medium text-foreground">Contact</h2>
          <p className="mt-2">
            Questions about these terms? Reach us at{" "}
            <a href="mailto:hello@agentrank.ai" className="text-foreground underline underline-offset-4">
              hello@agentrank.ai
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
