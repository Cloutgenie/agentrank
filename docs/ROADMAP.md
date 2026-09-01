# AgentRank.ai — MVP Definition & 90-Day Launch Roadmap

**Status:** Living document, v1.0
**Last updated:** 2026-09-01
**Related:** `PRD.md` §5 (non-functional requirements this roadmap exists to satisfy), `GROWTH_PLAN.md`, `SEO_PLAN.md`

---

## 1. What Already Exists (Scaffold Inventory)

Before defining "done," it's worth being precise about what's already real vs. what's demo-only, because the gap is smaller than it looks:

**Genuinely functional, not just scaffolded:**
- Full Postgres schema with RLS (`supabase/migrations/0001_init.sql`, `0002_rls.sql`) — organizations, projects, competitors, prompts, prompt_results, visibility_scores, citations, recommendations, reports, subscriptions, alerts, referrals, all org-scoped.
- Working prompt generator (`lib/prompts/generator.ts`) — deterministic, template-based, already wired to a real API route (`app/api/prompts/generate/route.ts`) and the onboarding UI (`app/dashboard/onboarding/page.tsx`).
- **All four engine providers are already implemented against real provider APIs**, not stubbed: `lib/engines/openai.ts`, `anthropic.ts`, `google.ts`, `perplexity.ts` each make a real HTTP call to their respective provider when an API key is present in `.env`, and each transparently falls back to `lib/engines/mock.ts` when it isn't. This means "wire up real LLM integration" is largely an **operational task (obtain and set 4 API keys, verify each response shape)**, not a from-scratch engineering task.
- A real entity-extraction pipeline (`lib/engines/extract.ts`) and scoring function (`lib/scoring.ts`) with the actual weighted formula.
- A real (if not-yet-scheduled) end-to-end runner (`lib/runner.ts`) that ties generation → query → extraction → persistence → scoring together correctly against Supabase.
- Clerk auth wired with a graceful no-keys-configured fallback (`middleware.ts`, `lib/clerk-configured.ts`) so the app doesn't hard-fail in local dev without credentials.
- Nine dashboard pages and the marketing site (`app/(marketing)/`, `app/dashboard/*`) fully built in the UI layer, currently reading from `lib/demo-data.ts`.

**Explicitly demo/placeholder, and the actual gap to close:**
- Every dashboard page imports directly from `lib/demo-data.ts` rather than querying Supabase. The file's own header comment says pages read "via `lib/queries.ts`... replace the demo-data calls in `lib/queries.ts` with the commented Supabase queries left alongside each function" — **`lib/queries.ts` does not exist yet.** This data-access layer is the single largest concrete engineering gap between the current scaffold and a real product.
- The runner (`lib/runner.ts`) is not invoked by anything — no cron, no Edge Function, no button. It's correct code with no trigger.
- No Stripe checkout, webhook handler, or `subscriptions` table writer exists yet (`stripe` is a dependency in `package.json`, but there's no `app/api/webhooks/stripe` or checkout route in the current file tree, and `middleware.ts` already carves out a `webhooks` route-matcher exception for one that doesn't exist yet).
- No Resend-triggered emails exist yet (`resend` is a dependency, no usage found).
- The engine `query()` methods throw immediately on any non-2xx response with no retry/backoff — fine for a demo, not safe to run against a paying customer's full prompt set without hardening (`PRD.md` §5.1).
- Marketing nav/footer already link to pSEO routes that don't exist as pages yet (`/chatgpt-ranking-checker`, `/claude-ranking-checker`, `/monitor-chatgpt-mentions`, `/ai-search-seo`, `/agency`, `/changelog`) — these are dead links in the current build.
- No agency client-switcher UI (`PRD.md` §4.10, `WIREFRAMES.md` §9).
- Pricing page CTA inconsistency: Agency tier says "Talk to sales" but the checkout flow implied by the rest of the page is self-serve (`GROWTH_PLAN.md` §6) — needs a decision, not just code.

---

## 2. MVP Definition: What "Done" Looks Like for the Leanest Sellable Version

The MVP is not "build everything in the PRD." It's the smallest slice that lets a real customer pay $29–$299/month and get genuine, non-mocked value on day one. Given the scaffold inventory above, the MVP gate list is:

1. **`lib/queries.ts` exists and every dashboard page reads through it**, hitting real Supabase tables instead of `lib/demo-data.ts`, scoped by the signed-in user's `organization_id` via RLS.
2. **At least one, ideally all four, engine API keys are live** in production `.env` — a paying customer must never unknowingly receive mock data (`PRD.md` §5.3). If budget requires launching with fewer than four engines live, the product must clearly label which engines are "coming soon" rather than silently mocking them.
3. **The runner executes on a schedule**, not manually — a Vercel Cron job (or Supabase Edge Function on a `pg_cron` trigger) invoking `runProjectPrompts()` for every active project, at minimum once daily to satisfy the Growth-tier refresh promise.
4. **Stripe is fully wired**: checkout for all three public tiers, a webhook handler that writes `subscriptions` rows and flips `organizations.plan_tier`, and trial-to-paid transition logic (`subscriptions.status` moving `trialing → active` or `→ past_due`/`canceled`). Nobody should be chargeable, or actually charged, before this exists.
5. **Onboarding → first run → populated dashboard works end-to-end with live data**, including a way to trigger an immediate first run rather than waiting for the next scheduled batch (see §3, Phase 1) — this is the activation moment the entire trial-conversion strategy in `GROWTH_PLAN.md` §1 depends on.
6. **At least one alert channel (email) fires on a real trigger**, using Resend, even if Slack alerts and fine-grained threshold tuning ship later.
7. **Recommendations are generated from real gap analysis**, not hardcoded — even a simple first-pass rule set (e.g., "competitor is mentioned in a prompt you aren't, and that prompt maps to a comparison-page-shaped gap → emit a `comparison_page` recommendation") is enough for MVP; the sophisticated version can follow.
8. **The four pSEO engine ranking-checker pages exist and function** (they're already linked from nav/footer, so shipping without them means live 404s at launch) — the rest of the ~105-page pSEO plan in `SEO_PLAN.md` can roll out post-launch.

Everything else in the PRD — agency client-switcher, white-label reports, the referral program, the embeddable badge, the other ~100 pSEO pages, Enterprise tier — is real, roadmapped, and valuable, but is explicitly **not** required to sell the first dollar.

---

## 3. 90-Day Launch Plan

Three phases, engineering / content-SEO / go-to-market tracks running in parallel within each phase. Sequencing logic: **real LLM integration and real data access must land before anything else is meaningfully testable; Stripe must land before any charge; public launch (and the marketing push that drives traffic to it) must not happen before both are solid**, since the worst possible first impression for this specific product is a customer discovering their "AI visibility score" was secretly mocked.

### Phase 1 — Weeks 1–4: Make the core loop real

**Engineering**
- Build `lib/queries.ts`; migrate every dashboard page off `lib/demo-data.ts` onto real Supabase reads.
- Obtain and set all four provider API keys in the Vercel production environment; smoke-test each provider's real response shape against `lib/engines/extract.ts` (real LLM prose will not match the mock's clean structure — expect to harden extraction here).
- Add retry/backoff to each engine provider's `query()` method; add basic per-provider rate-limit handling.
- Stand up the scheduled runner (Vercel Cron → API route → `runProjectPrompts()`), starting with a manual "run now" trigger callable from onboarding before the cron path exists, so Phase 1 can be tested without waiting on a daily schedule.
- Wire Stripe: Price objects for all three tiers, Checkout session creation from the pricing page CTAs, webhook handler for `checkout.session.completed`, `customer.subscription.updated/deleted` → writes to `subscriptions` + `organizations.plan_tier`.
- Basic Resend integration: at minimum, the day-3 "3 things costing you visibility" activation email (`GROWTH_PLAN.md` §5, email #3) and the day-12 trial-ending email, since these bracket the highest-leverage conversion window.

**Content/SEO**
- Build the four `/[engine]-ranking-checker` pages for real (currently dead links) — this closes the most embarrassing pre-launch gap and is also the highest-intent pSEO category (`SEO_PLAN.md` §3.1).
- Draft the `/ai-search-seo` pillar page (also currently a dead nav/footer link).
- Set up the segmented sitemap structure and Search Console property, even before most pSEO pages exist, so indexing has a head start once content ships in Phase 2.

**Go-to-market**
- Recruit 10–20 design-partner users (warm network, not paid acquisition) to run the real pipeline against their actual companies before any public claim is made about accuracy.
- Use design-partner runs to validate the extraction/scoring pipeline qualitatively — does a 40/100 score "feel right" to someone who knows their own market? This is the closest thing to a ground-truth check available before launch.
- No paid spend, no public launch yet.

**Phase 1 exit criteria:** a design partner can sign up, complete onboarding, get a real (non-mock) first run within minutes, see it on a dashboard reading live data, and — if they choose to convert — be charged correctly through Stripe.

### Phase 2 — Weeks 5–8: Harden, expand content, soft-launch

**Engineering**
- Build the recommendation-generation rule set (gap analysis from Phase 1's now-real data) — this was mocked in demo data and needs its first real implementation.
- Add alert-threshold logic requiring sustained (2+ run) change before firing `visibility_lost`/`competitor_overtook` (`PRD.md` §5.3) — real data will make single-run noise visible for the first time in Phase 2, so this is the phase where it becomes an obvious, urgent fix rather than a theoretical concern.
- Add Slack as a second alert channel for Growth+.
- Ship the trial-lifecycle email sequence in full (all 5 emails from `GROWTH_PLAN.md` §5), triggered off real lifecycle events rather than the two emails shipped in Phase 1.
- Resolve the Agency pricing-page CTA inconsistency (§1) — decide self-serve vs. sales-assisted and make the code match.
- Begin the referral system: `referral_code` generation on org creation, the Settings-page referral card, and webhook-driven `reward_granted` logic (`GROWTH_PLAN.md` §3).

**Content/SEO**
- Ship the 25 `/best-[category]-ai-visibility` pages and the 20 `/company/[brand]-ai-visibility-report` pages (`SEO_PLAN.md` §3.2–3.3) — these depend on having enough real tracked-project data across enough industries to populate the Live Scoreboard and Engine Breakdown modules credibly, which is why they follow (not precede) Phase 1's real-data cutover.
- Ship the 10 `/vs/` comparison pages (§3.4) and the first 10 glossary terms (§3.5).
- Publish 3–5 of the 15 `/guides/` pieces (§3.6) — hand-authored, so pace realistically against actual writing capacity rather than batch-publishing all 15 at once.

**Go-to-market**
- Soft launch: remove "invite only" framing, open signups publicly, but hold major public announcement (Product Hunt, press, paid channels) until Phase 3.
- Begin light organic distribution — founder's own network, relevant subreddits/communities where posting genuine findings ("we checked how ChatGPT talks about 50 SaaS categories") is native content, not an ad.
- Start collecting the first real customer testimonials/case studies from Phase 1 design partners who converted, to have real (not placeholder) social proof ready for Phase 3's public push — the current homepage testimonial is illustrative copy, not a real quote, and should be replaced before a real public launch.

**Phase 2 exit criteria:** the product has real paying customers acquired through soft-launch channels, the recommendation and alert systems are running on real data without embarrassing noise, and the pSEO footprint is large enough (~55 of ~105 planned pages) to be indexing and gaining early impressions in Search Console.

### Phase 3 — Weeks 9–12: Public launch

**Engineering**
- Performance pass on the runner for scale: concurrency/worker-pool execution (`PRD.md` §5.1) sized for the actual paying-customer volume observed in Phase 2, not just Phase 1's design-partner scale.
- Ship the embeddable AI Visibility Score badge/widget (`GROWTH_PLAN.md` §4) — timed for launch since it's the strongest organic-acquisition lever available and benefits from being live when launch traffic (and launch-driven signups who might embed it) arrives.
- Address any Phase 2 bug backlog from real customer usage before the traffic spike a public launch brings.
- Ship remaining alert/report polish (on-demand "generate report now" actually calling the runner + PDF export, not just a UI button).

**Content/SEO**
- Finish the remaining pSEO inventory: remaining glossary terms, remaining guides, integration pages, alternative pages (`SEO_PLAN.md` §3.5–3.7) — targeting the full ~105-page footprint live by end of Phase 3.
- Publish a launch-week piece using the product on itself (per `SEO_PLAN.md` §1's thesis) — e.g., "we tracked AI visibility across 25 SaaS categories, here's what we found" as the flagship distribution asset for the public launch.

**Go-to-market**
- Public launch: Product Hunt / relevant launch communities, press outreach framed around the "AI search is the new SEO battleground" narrative, founder content on LinkedIn/X timed to launch day.
- Paid acquisition test budget (small, e.g., Google/LinkedIn ads on high-intent terms like "chatgpt seo," "ai visibility tracker") to validate CAC before committing meaningfully — this should not start earlier than Phase 3, since spending on paid acquisition into an unproven trial-to-paid funnel (before Phase 1–2 have validated it with organic/warm-network signups) risks buying expensive, low-quality data about a funnel that isn't representative of the eventual mix.
- Activate the referral program's post-conversion prompt (`GROWTH_PLAN.md` §3.3) now that there's a large enough paying base for it to compound meaningfully.

**Phase 3 exit criteria:** public launch executed, ~105-page pSEO footprint live and indexing, paid-acquisition CAC data collected for the first time, referral loop active. This is the end of the 90-day window, not the end of the roadmap — Agency client-switcher UI, Enterprise tier, and additional engines remain committed post-90-day work (`PRD.md` §6, `GROWTH_PLAN.md` §6).

---

## 4. Explicit Sequencing Dependencies (Why This Order)

- **Real LLM integration before public launch, non-negotiable.** A customer paying to learn "how ChatGPT talks about my company" who later discovers their dashboard was mocked is not a recoverable trust failure for this specific product category — the entire value proposition is truthful measurement.
- **Stripe before charging anyone, non-negotiable.** Obvious, but worth stating: no manual invoicing workaround should substitute for real billing infrastructure even for early design partners, because retrofitting billing onto already-active accounts is more error-prone than building it first.
- **`lib/queries.ts` before pSEO pages that read real data.** Category and company-report pSEO pages (`SEO_PLAN.md` §3.2–3.3) are only as credible as the data behind them — shipping them against `lib/demo-data.ts` would mean publishing fabricated-looking public claims about real named companies (§3.3's brand report pages), which is both a credibility risk and arguably a factual-accuracy problem the moment a real company's name is attached to a number that was never actually computed from their real mentions.
- **A representative volume of real tracked projects before the Live Scoreboard/category pages.** An aggregate "best CRM software by AI visibility" page built from 2 tracked projects is not meaningfully different from noise; Phase 2's timing (after Phase 1 has onboarded design partners across a spread of industries) is deliberate.
- **Paid acquisition after organic/warm-network validation, not before.** Spending to fill a funnel whose conversion mechanics (§ trial-to-paid strategy in `GROWTH_PLAN.md`) haven't been observed with real users risks optimizing against the wrong signal.
