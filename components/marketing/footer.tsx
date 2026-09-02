import Link from "next/link";
import { LogoMark } from "@/components/brand/logo-mark";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/#features", label: "Features" },
      { href: "/pricing", label: "Pricing" },
      { href: "/agency", label: "Agency mode" },
      { href: "/changelog", label: "Changelog" },
    ],
  },
  {
    title: "AI SEO tools",
    links: [
      { href: "/chatgpt-ranking-checker", label: "ChatGPT ranking checker" },
      { href: "/claude-ranking-checker", label: "Claude ranking checker" },
      { href: "/monitor-chatgpt-mentions", label: "Monitor ChatGPT mentions" },
      { href: "/ai-search-seo", label: "AI search SEO guide" },
      { href: "/best-shopify-apps-ai-visibility", label: "Best Shopify apps (AI visibility)" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/blog", label: "Blog" },
      { href: "/careers", label: "Careers" },
      { href: "/contact", label: "Contact" },
      { href: "https://trustmrr.com/?ref=jay-gauthier-the-m-78c3bb", label: "Buy/sell your SaaS", external: true },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/security", label: "Security" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="container grid gap-10 py-16 md:grid-cols-5">
        <div className="md:col-span-1">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <LogoMark className="h-6 w-6" />
            Agent Rank Radar
          </Link>
          <p className="mt-3 text-sm text-muted-foreground">The 24/7 radar for your AI answer visibility.</p>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="text-sm font-medium">{col.title}</h4>
            <ul className="mt-3 space-y-2">
              {col.links.map((link) =>
                "external" in link && link.external ? (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  </li>
                ) : (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </div>
        ))}
      </div>

      <div className="container flex flex-col items-center justify-between gap-2 border-t border-border/60 py-6 text-xs text-muted-foreground md:flex-row">
        <span>© {new Date().getFullYear()} Agent Rank Radar. All rights reserved.</span>
        <span>Made for teams who want to win the AI answer.</span>
      </div>
    </footer>
  );
}
