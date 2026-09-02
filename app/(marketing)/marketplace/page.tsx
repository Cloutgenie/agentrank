import Link from "next/link";
import { ArrowUpRight, TrendingUp, TrendingDown, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { pageMetadata } from "@/lib/seo";
import { getStartupsForSale, affiliateUrl, isTrustMrrConfigured } from "@/lib/trustmrr";

export const metadata = pageMetadata({
  title: "SaaS Startups for Sale",
  description:
    "Real, verified SaaS and digital businesses currently for sale, sourced from TrustMRR's database of payment-provider-backed revenue. Buying a startup? Check its AI visibility before you close.",
  path: "/marketplace",
});

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1000)}k`;
  return `$${Math.round(value)}`;
}

export default async function MarketplacePage() {
  const startups = await getStartupsForSale(12);

  return (
    <div className="container max-w-4xl py-24">
      <div className="text-center">
        <Badge variant="outline" className="mb-4 gap-1.5">
          Powered by TrustMRR
        </Badge>
        <h1 className="text-4xl font-semibold tracking-tight">SaaS startups for sale</h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Real, verified revenue — backed by each startup's actual payment provider, not screenshots or self-reported
          numbers. Sourced from{" "}
          <a
            href={`https://trustmrr.com/?ref=jay-gauthier-the-m-78c3bb`}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="text-foreground underline underline-offset-4"
          >
            TrustMRR
          </a>
          , the marketplace for verified startup revenue.
        </p>
      </div>

      {!isTrustMrrConfigured || startups.length === 0 ? (
        <Card className="mx-auto mt-16 max-w-md">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Listings are temporarily unavailable.{" "}
            <a
              href="https://trustmrr.com/acquire?ref=jay-gauthier-the-m-78c3bb"
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="text-foreground underline underline-offset-4"
            >
              Browse the full marketplace on TrustMRR
            </a>
            {" "}instead.
          </CardContent>
        </Card>
      ) : (
        <div className="mt-16 grid gap-4 sm:grid-cols-2">
          {startups.map((startup) => (
            <Card key={startup.slug}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-medium">{startup.name}</h3>
                    {startup.category && <p className="text-xs text-muted-foreground">{startup.category}</p>}
                  </div>
                  {startup.askingPrice != null && (
                    <Badge variant="secondary" className="shrink-0">
                      {formatCurrency(startup.askingPrice)}
                    </Badge>
                  )}
                </div>

                {startup.description && (
                  <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{startup.description}</p>
                )}

                <div className="mt-4 flex items-center gap-4 border-t border-border pt-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Revenue (30d)</p>
                    <p className="font-medium tabular-nums">{formatCurrency(startup.revenue.last30Days)}</p>
                  </div>
                  {startup.growth30d != null && (
                    <div
                      className={`flex items-center gap-1 text-xs font-medium ${
                        startup.growth30d >= 0 ? "text-success" : "text-destructive"
                      }`}
                    >
                      {startup.growth30d >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {startup.growth30d > 0 ? "+" : ""}
                      {startup.growth30d.toFixed(0)}%
                    </div>
                  )}
                </div>

                <Button size="sm" variant="outline" className="mt-4 w-full" asChild>
                  <a href={affiliateUrl(startup.url)} target="_blank" rel="noopener noreferrer sponsored">
                    View listing <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-16 text-center">
        <p className="text-sm text-muted-foreground">
          Considering an acquisition? Check the target's AI answer visibility before you close.
        </p>
        <Button className="mt-4" asChild>
          <Link href="/sign-up">
            Check AI visibility <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
