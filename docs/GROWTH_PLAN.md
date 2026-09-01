# AgentRank.ai — Growth & Monetization Plan

**Status:** Living document, v1.0
**Last updated:** 2026-09-01
**Related:** `PRD.md` (pricing/plan detail), `supabase/migrations/0001_init.sql` (schema referenced throughout)

---

## 1. Trial-to-Paid Conversion Strategy

All three plans (Starter $29, Growth $99, Agency $299) ship with a 14-day free trial, tracked via `subscriptions.status = 'trialing'` and `subscriptions.trial_ends_at`. No credit card is required to start (per the homepage: "No credit card required · Free 14-day trial") — this maximizes top-of-funnel volume at the cost of needing a stronger activation-to-conversion motion, since there's no sunk-cost card already on file pulling people through.

**The core conversion thesis:** a trial converts when the user has seen a *specific, named gap* between themselves and a competitor before day 14 — not when they've merely seen their own score. A visibility score in isolation ("you're at 40/100") is hard to act on; "Profound outranks you in Claude for 'best AI visibility tool for agencies'" is a story a founder repeats to their team, and that repetition is what drives conversion.

**Mechanics:**
- **Day 0 activation target:** first prompt run completed and dashboard populated with real (not demo) data within minutes of finishing onboarding — the existing onboarding flow (`app/dashboard/onboarding/page.tsx`) already generates prompts synchronously; the trial-critical gap is making the *first engine run* feel similarly instant rather than waiting for the next scheduled batch (see `ROADMAP.md` for the on-demand first-run requirement).
- **Day 3–5 nudge:** if `recommendations` has ≥1 `high` impact_estimate row and the user hasn't viewed the Recommendations page, trigger an email ("We found 3 things costing you visibility in ChatGPT") — this is the single highest-leverage lifecycle email, because it's the first moment the product argues for itself with specifics instead of asking the user to interpret a chart.
- **Day 7 mid-trial check-in:** if `visibility_scores` shows any negative trend vs. the trial-start baseline, or any `competitor_overtook`-type gap, surface it via email + in-app banner. Loss framing ("you're losing ground to X") converts at a meaningfully higher rate than parity framing in this category, because the entire premise of the product is that invisibility is happening whether or not the customer is watching.
- **Day 12 trial-ending:** standard urgency email + in-app banner, but personalized with the specific score delta observed over the trial window ("in your 14-day trial, your Perplexity visibility rose from 31 to 44 — keep the momentum going") so the CTA is evidence-based, not generic.
- **Post-trial grace, not hard cutoff:** on `trial_ends_at`, downgrade access to a read-only "last snapshot" state for 3 days (data visible, no new runs, no export) rather than an immediate lockout — this recovers a meaningful share of people who intended to convert but missed the exact expiration moment, without giving away ongoing value for free.
- **No-card trials require a Stripe SetupIntent captured before trial end**, not at trial start, to avoid the friction cost of asking for a card during signup while still ensuring the day-14 transition to `active`/`past_due` is a real Stripe event rather than a silent expiration.

---

## 2. Upsell Paths

### 2.1 The core ladder: Starter → Growth → Agency

Mapped directly to `subscriptions.projects_limit` and `subscriptions.prompts_limit`, which already exist as hard caps in the schema:

| Tier | Projects | Prompts | Refresh | The upsell trigger |
|---|---|---|---|---|
| Starter → Growth | 1 → 3 | 100 → 500 | weekly → daily | User hits the 100-prompt cap (a near-certainty once a project has 3+ competitors, since `generateBuyerIntentPrompts` produces 25-40+ prompts *per project* before a user adds any manual prompts) or wants a second project (e.g., a second Shopify app, a second brand) |
| Growth → Agency | 3 → unlimited | 500 → 2,500 | daily → daily + on-demand | User is an agency managing multiple clients and hits the 3-project ceiling, or wants white-label reports for client delivery |

**In-product upsell surfaces:**
- **Soft paywall at the cap, not a hard block.** When a user hits `prompts_limit`, new prompts are generated and shown but marked `status = 'paused'` (already a valid enum value) with an inline "upgrade to track all N prompts" banner — they see what they're missing rather than hitting an opaque error.
- **The Settings → Billing card** (`app/dashboard/settings/page.tsx`) already renders "Current plan: Growth — $99/month" with a "Manage billing in Stripe" button; this is the natural home for an in-place upgrade CTA rather than routing back to the public `/pricing` page mid-session.
- **Project-limit modal on "New project."** The `DashboardTopbar`'s existing "New project" button (`showNewProject` prop, linking to `/dashboard/onboarding`) should check `projects_limit` before navigating and show an upgrade modal instead of a blocked form if the org is at its cap.

### 2.2 Overage & add-on ideas (beyond the tier ladder)

The schema's flat `plan_tier` model doesn't natively support metered overage, so these are proposed as fixed-price add-on SKUs (separate Stripe Price objects attached to the same subscription), not usage-based billing:

- **Extra prompts pack** — +100 tracked prompts for $15/mo, stackable, for a user who's otherwise happy on Starter/Growth but has one category with unusually high comparison-prompt volume (many named competitors).
- **Extra project slot** — +1 project for $20/mo on Starter (where the 1-project cap is the single most common upgrade trigger for anyone running more than one brand) without forcing a full jump to Growth.
- **Extra competitor tracking** — Starter's "3 competitors tracked" cap is likely to be the second most common friction point after prompt volume; a +5 competitors add-on for $10/mo lets a Starter user go deeper without upgrading tiers.
- **Slack alerts add-on for Starter** — Slack alerts are currently a Growth+ feature; offering it standalone for $10/mo captures willingness-to-pay from Starter users who specifically want it without the rest of the Growth bundle.
- **White-label reports add-on for Growth** — currently Agency-exclusive; a $49/mo add-on lets a single-brand Growth customer (not an agency, but perhaps presenting to a board or investor) get branded PDF exports without buying unlimited projects they don't need.
- **Additional seats** (`subscriptions.seats`) — priced per seat beyond a tier's included baseline, standard SaaS seat-expansion motion, most relevant to Agency accounts adding team members.

Pricing note: every add-on should map to a real column already in `subscriptions` (`projects_limit`, `prompts_limit`, `seats`) or a real boolean already in `organizations` (`white_label_enabled`) — this keeps the billing logic additive on existing schema rather than requiring new entitlement infrastructure before any add-on can ship.

---

## 3. Viral Referral System

The `referrals` table already exists in the schema (`referrer_org_id`, `referral_code`, `referred_email`, `referred_org_id`, `reward_granted`) — this section specs the product mechanic it's designed to support.

### 3.1 Mechanic
1. Every organization gets one persistent, unique `referral_code` (generated on org creation, short and shareable — e.g. `agentrank.ai/r/acme7x`).
2. The referring org shares their link or invites by email (writing `referred_email` at send time, before the invitee has even signed up, so the loop can be tracked and re-prompted even if the invitee doesn't convert immediately).
3. When someone signs up via that code, their new `organizations.id` is written to `referrals.referred_org_id` at signup — establishing attribution immediately, before any payment event.
4. `reward_granted` flips to `true` only when the referred org's Stripe subscription transitions to `active` (i.e., converts from trial to paid) — rewarding the referrer for *paid* referrals only, not signups, to keep the loop economically sound and resistant to spam/gaming.

### 3.2 Reward structure
- **Referrer reward:** one free month at their current plan tier, applied as a Stripe coupon/credit on their next invoice, triggered by the `reward_granted` webhook-driven flip. Capped at, e.g., 12 free months/year per org to bound downside on a viral hit, but otherwise uncapped in count — the more paid referrals, the more free months, which is the entire point of a PLG loop.
- **Referred reward:** an extended trial (21 days instead of 14) or a first-month discount (e.g., 20% off month one) rather than mirroring the referrer's free month — asymmetric rewards keep the loop cash-flow-positive (the referrer's "cost" is a month of gross-margin-heavy SaaS revenue already collected from other customers; the referred party's cost is a smaller, one-time discount) while still giving both sides a real reason to act.
- **Agency-specific variant:** an agency referring another agency (common in this vertical — agencies talk to each other) earns a larger reward (e.g., 2 free months) given the higher LTV of an Agency-tier conversion.

### 3.3 Where it surfaces in-product
- **Settings page**, as a new card alongside the existing "Project details" and "Billing" cards in `app/dashboard/settings/page.tsx` — "Refer a colleague" with the org's referral link, a copy-to-clipboard action, and a running count of successful referrals + free months earned.
- **Post-conversion moment** — immediately after a trial converts to paid (the single highest-goodwill moment in the customer lifecycle), a one-time in-app modal invites sharing the referral link, framed around the specific win that just happened ("Just found out you outrank 2 competitors in Perplexity? Know another founder fighting the same battle?").
- **Weekly/monthly report emails** — a small, consistent footer CTA on every scheduled report email (`reports.report_type = 'weekly'`), since these are already being opened regularly and are a natural, low-friction share surface.
- **Dashboard sidebar or topbar badge** once an org has an unclaimed reward pending (`reward_granted` about to flip) — a light "you have 1 free month coming" notification keeps the loop visible without being a permanent nag.

---

## 4. Public AI Visibility Score Badge/Widget

A classic PLG embed loop: give customers a reason to put AgentRank's mark on *their own* site, which drives both backlinks (SEO value, reinforcing `SEO_PLAN.md`) and warm referral traffic (visitors who click through to check their own score).

**What it is:** a small, embeddable badge — e.g. "AI Visibility Score: 78/100 · Verified by AgentRank" with a trend arrow — that a customer places on their homepage, pricing page, or "as seen in" section, similar in spirit to a Trustpilot or G2 review-count badge.

**Mechanic:**
1. Available starting at Growth tier (a Starter-tier badge risks showing an unflattering low score before the customer has had time to act on recommendations — badge eligibility should require either a minimum score threshold or a minimum tracking history, TBD by growth team, to avoid the badge working against adoption).
2. Customer opts in from Settings; opting in makes that org's `visibility_score` (and only that number — not competitor comparisons, not raw prompt data) part of a public, cacheable JSON/JS embed endpoint plus a `<script>` snippet, styled to inherit light/dark automatically.
3. The badge links back to a public **`/company/[brand]-ai-visibility-report`** page (see `SEO_PLAN.md` §3.3) for that brand — meaning opting into the badge is also what upgrades that brand's programmatic report page from an AgentRank-tracked-but-unclaimed profile to a claimed, richer, customer-endorsed one. This is the single clearest bridge between the growth loop and the pSEO moat: the badge is the acquisition mechanism that gets a company's real page linked from real external sites, compounding the SEO value of the report page itself.
4. Every badge impression is a live, real-time proof point that the number behind it is not static marketing copy — the JS embed should fetch current data (with reasonable caching, e.g., hourly) rather than baking in a snapshot at embed time, since a badge that visibly updates over time is more credible than one that looks like a fixed graphic.

**Why this works as a loop specifically for this product category:** most SaaS embeddable badges ("we're on Product Hunt," "rated 4.8 on G2") are static social proof. This one is different — it's dynamic, self-updating proof of the exact thing the product measures, displayed on the exact audience (website visitors comparison-shopping) that the underlying AI-visibility problem is about. A visitor who sees the badge and clicks through is, definitionally, in-market for exactly what AgentRank sells.

---

## 5. Five-Email Onboarding Sequence

Purpose and key CTA per email — not full copy, to leave room for brand voice/copywriting to be done separately.

| # | Send timing | Subject line | Purpose | Key CTA |
|---|---|---|---|---|
| 1 | Immediately after signup | "Your first AI visibility scan is running" | Confirm signup succeeded, set expectation for when first real data will be ready, reduce anxiety during the runner's first execution window. | "Watch it populate" → dashboard |
| 2 | ~2 hours after first run completes | "You're mentioned in {N}% of buyer prompts — here's the gap" | First real-data touchpoint; lead with the single most notable finding (best or worst score, whichever is more attention-grabbing) rather than a generic "here's your dashboard" email. | "See your full report" → dashboard overview |
| 3 | Day 3 | "3 things costing you visibility in ChatGPT" | Surface top `recommendations` rows directly in the email body — this is the activation email described in §1; the goal is to get the user to act on at least one recommendation before day 7. | "View your recommendations" → Recommendations page |
| 4 | Day 7 | "How you stack up against {top competitor}" | Competitive framing email — pulls the single sharpest competitor-comparison data point (a prompt the competitor wins that the customer doesn't) to reinforce the core value prop mid-trial. | "Compare head-to-head" → Competitors page |
| 5 | Day 12 | "Your trial ends in 2 days — here's what changed" | Trial-ending urgency, personalized with the customer's actual score delta over the trial window (see §1) rather than generic urgency copy. | "Keep tracking — upgrade now" → billing/checkout |

**Delivery:** all five via Resend, triggered by lifecycle events (signup, first-run-complete, recommendation-generated, day-N-since-trial-start) rather than a rigid send-at-fixed-time drip, so email 2 in particular only sends once there's real data to show rather than on a fixed clock that might fire before the first run finishes.

---

## 6. Enterprise Plan Sketch

Not in the current `plan_tier` enum's public pricing (`starter | growth | agency`), but the enum already includes `'enterprise'` as a fourth value in the schema (`create type plan_tier as enum ('starter', 'growth', 'agency', 'enterprise')`) — confirming this was designed in from day one as a custom, sales-assisted tier rather than a self-serve price point.

**What's different from Agency ($299/mo):**

| Dimension | Agency | Enterprise |
|---|---|---|
| Pricing | Fixed $299/mo, self-serve checkout | Custom annual contract, sales-negotiated |
| Projects | Unlimited | Unlimited, with dedicated capacity guarantees (no noisy-neighbor throttling on the shared runner infrastructure) |
| Prompts | 2,500 | Custom, typically 10,000+ across a large multi-brand or multi-region portfolio |
| Refresh cadence | Daily + on-demand | Configurable up to real-time/on-demand per prompt (relevant for enterprise brand-monitoring use cases where a PR team needs same-hour visibility during a launch or crisis) |
| Engines | The standard 4 | The standard 4, plus priority access to any newly added engine (e.g., a future Grok or Copilot provider) before general availability |
| Auth | Standard Clerk org accounts | SSO/SAML via Clerk's enterprise connections, enforced org-wide |
| Access control | `organization_members.role` (owner/admin/member/viewer) | Same roles, plus audit logs of who viewed/exported what — relevant for regulated or public-company customers |
| Support | Priority support (ticket queue) | Dedicated CSM, onboarding, and a Slack Connect channel |
| Reporting | White-label PDF/monthly reports | White-label reports plus a dedicated API rate limit tier and/or a data warehouse export (e.g., scheduled `visibility_scores`/`citations` sync to the customer's own BigQuery/Snowflake) for BI teams who want to blend AI-visibility data with other marketing analytics |
| Contract terms | Month-to-month, cancel anytime | Annual, with a security review / procurement support process (SOC 2 report sharing, DPA, etc.) |
| Multi-workspace | N/A (one org = one workspace) | Supports a holding-company structure — multiple `organizations` rows linked under one billing entity for a company with genuinely separate brands/subsidiaries, rather than everything forced into one org's `projects` list |

**Go-to-market implication:** Enterprise should never be a self-serve Stripe checkout button — it should route to a "Talk to sales" form, consistent with how the current Agency tier's CTA is already labeled ("Talk to sales" in `PLANS` within `app/(marketing)/pricing/page.tsx`) even though Agency itself is actually self-serve checkout today. That mismatch (Agency says "Talk to sales" but is self-serve) is worth resolving before launch — see `ROADMAP.md` — with Enterprise inheriting the true sales-assisted motion the Agency CTA copy currently implies.
