import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { isClerkConfigured } from "@/lib/clerk-configured";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AgentRank.ai — Track your brand's AI search visibility",
    template: "%s · AgentRank.ai",
  },
  description:
    "AgentRank tracks how often ChatGPT, Claude, Gemini, and Perplexity recommend your company vs. competitors — and tells you what content to publish to win.",
  metadataBase: new URL("https://agentrank.ai"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const body = (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans">{children}</body>
    </html>
  );

  // Renders without Clerk in local dev until real keys are added to .env —
  // see lib/clerk-configured.ts.
  return isClerkConfigured ? <ClerkProvider>{body}</ClerkProvider> : body;
}
