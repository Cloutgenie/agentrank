"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { isClerkConfigured } from "@/lib/clerk-configured";
import { LogoMark } from "@/components/brand/logo-mark";

const LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/ai-search-seo", label: "AI SEO" },
  { href: "/chatgpt-ranking-checker", label: "Ranking Checker" },
];

export function MarketingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <LogoMark className="h-6 w-6" />
          Agent Rank Radar
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-3 md:flex">
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
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
              </>
            ) : (
              <Button size="sm" asChild>
                <Link href="/dashboard">View demo dashboard</Link>
              </Button>
            )}
          </div>

          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            className="flex h-9 w-9 items-center justify-center rounded-md text-foreground md:hidden"
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border/60 bg-background md:hidden">
          <nav className="container flex flex-col gap-1 py-4 text-sm">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-2 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-border/60 pt-3">
              {isClerkConfigured ? (
                <>
                  <SignedOut>
                    <Button variant="ghost" size="sm" asChild className="justify-start">
                      <Link href="/sign-in" onClick={() => setMobileOpen(false)}>
                        Log in
                      </Link>
                    </Button>
                    <Button size="sm" asChild>
                      <Link href="/sign-up" onClick={() => setMobileOpen(false)}>
                        Start free trial
                      </Link>
                    </Button>
                  </SignedOut>
                  <SignedIn>
                    <Button size="sm" asChild>
                      <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                        Dashboard
                      </Link>
                    </Button>
                  </SignedIn>
                </>
              ) : (
                <Button size="sm" asChild>
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                    View demo dashboard
                  </Link>
                </Button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
