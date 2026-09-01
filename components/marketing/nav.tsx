import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { isClerkConfigured } from "@/lib/clerk-configured";

const LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/ai-search-seo", label: "AI SEO" },
  { href: "/chatgpt-ranking-checker", label: "Ranking Checker" },
];

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-primary text-xs font-bold text-primary-foreground">
            A
          </span>
          AgentRank
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {isClerkConfigured ? (
            <>
              <SignedOut>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/sign-in">Log in</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/sign-up">Start free trial</Link>
                </Button>
              </SignedOut>
              <SignedIn>
                <Button size="sm" asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              </SignedIn>
            </>
          ) : (
            <Button size="sm" asChild>
              <Link href="/dashboard">View demo dashboard</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
