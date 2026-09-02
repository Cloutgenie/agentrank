import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { isClerkConfigured } from "@/lib/clerk-configured";
import { OrganizationJsonLd } from "@/components/seo/json-ld";
import { SITE_NAME, SITE_URL, SITE_TAGLINE } from "@/lib/seo";
import "./globals.css";

const DEFAULT_TITLE = `${SITE_NAME} — ${SITE_TAGLINE}`;
const DEFAULT_DESCRIPTION =
  "AgentRank Radar continuously scans ChatGPT, Claude, Gemini, and Perplexity for how often they recommend you vs. your competitors — and tells you what content to publish to win.";

export const metadata: Metadata = {
  title: {
    default: DEFAULT_TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const body = (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans">
        <OrganizationJsonLd />
        {children}
      </body>
    </html>
  );

  // Renders without Clerk in local dev until real keys are added to .env —
  // see lib/clerk-configured.ts.
  return isClerkConfigured ? <ClerkProvider>{body}</ClerkProvider> : body;
}
