import Stripe from "stripe";
import type { PlanTier } from "@/lib/types";

export const isStripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);

// The Stripe constructor throws on a falsy key, which would crash any
// module that imports this file before STRIPE_SECRET_KEY is set — pass a
// non-empty placeholder so import-time construction always succeeds; actual
// API calls still fail loudly (as they should) if this client is ever used
// unconfigured.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_not_configured", {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
});

// Populated from the live Products/Prices created for this account — see
// docs/ROADMAP.md for the price IDs if these ever need recreating.
export const PLAN_PRICE_IDS: Partial<Record<PlanTier, string>> = {
  starter: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER,
  growth: process.env.NEXT_PUBLIC_STRIPE_PRICE_GROWTH,
  agency: process.env.NEXT_PUBLIC_STRIPE_PRICE_AGENCY,
};

export function planTierForPrice(priceId: string): PlanTier | null {
  const entry = Object.entries(PLAN_PRICE_IDS).find(([, id]) => id === priceId);
  return (entry?.[0] as PlanTier) ?? null;
}
