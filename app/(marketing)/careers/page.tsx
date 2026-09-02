import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Careers",
  description: "Open roles at AgentRank.",
};

export default function CareersPage() {
  return (
    <div className="container max-w-2xl py-24">
      <h1 className="text-4xl font-semibold tracking-tight">Careers</h1>
      <p className="mt-4 text-muted-foreground">
        We're not hiring yet — AgentRank is early and the team is small. That'll change as we grow, and we'll post
        roles here when it does.
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        Want to get ahead of it? Send us a note at{" "}
        <a href="mailto:hello@agentrank.ai" className="text-foreground underline underline-offset-4">
          hello@agentrank.ai
        </a>
        .
      </p>
    </div>
  );
}
