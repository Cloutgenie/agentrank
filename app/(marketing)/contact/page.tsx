import type { Metadata } from "next";
import { Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the AgentRank team.",
};

export default function ContactPage() {
  return (
    <div className="container max-w-2xl py-24">
      <h1 className="text-4xl font-semibold tracking-tight">Contact us</h1>
      <p className="mt-4 text-muted-foreground">
        Questions, feedback, or need help with your account? Send us a message and we'll get back to you.
      </p>

      <div className="mt-10 flex items-center gap-3 rounded-lg border border-border p-4">
        <Mail className="h-5 w-5 text-primary" />
        <a href="mailto:hello@agentrank.ai" className="font-medium underline underline-offset-4">
          hello@agentrank.ai
        </a>
      </div>

      <div className="mt-6 text-sm text-muted-foreground">
        <p>
          Security issue instead?{" "}
          <a href="mailto:security@agentrank.ai" className="text-foreground underline underline-offset-4">
            security@agentrank.ai
          </a>
        </p>
      </div>
    </div>
  );
}
