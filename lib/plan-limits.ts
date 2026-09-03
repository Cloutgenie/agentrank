import type { PlanTier } from "@/lib/types";

export interface PlanLimits {
  /** null means unlimited. */
  projects: number | null;
  prompts: number | null;
}

// subscriptions.projects_limit/prompts_limit are `not null` columns, so
// "unlimited" is stored as this sentinel rather than null. Anything at or
// above it should be treated as unlimited when read back.
export const UNLIMITED_SENTINEL = 999999;

export function limitOrSentinel(limit: number | null): number {
  return limit ?? UNLIMITED_SENTINEL;
}

export function isUnlimited(limit: number): boolean {
  return limit >= UNLIMITED_SENTINEL;
}

// Mirrors the numbers on the pricing page (app/(marketing)/pricing/page.tsx)
// — the only place these are ever assigned is the Stripe webhook, when a
// subscription's plan_tier changes, so this map is the single source of
// truth for what each tier's subscriptions.projects_limit/prompts_limit
// should be set to.
export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  starter: { projects: 1, prompts: 100 },
  growth: { projects: 3, prompts: 500 },
  agency: { projects: null, prompts: 2500 },
  enterprise: { projects: null, prompts: null },
};

// Slack alerts are Growth+ per the pricing page ("Slack + email alerts").
// Shared between the Settings UI gate and lib/alerts.ts's delivery check so
// the two can't drift out of sync.
export const SLACK_ELIGIBLE_TIERS: ReadonlySet<PlanTier> = new Set(["growth", "agency", "enterprise"]);
