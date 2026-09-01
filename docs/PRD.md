# AgentRank.ai — Product Requirements Document

**Status:** Living document, v1.0
**Owner:** Founder / Product
**Last updated:** 2026-09-01
**Codebase:** `/Users/cloutgenie/CloutGenie/agentrank` (Next.js 15, TypeScript, Tailwind, shadcn-style components, Supabase/Postgres, Clerk, Stripe, Resend, Vercel)

---

## 1. Problem Statement

Search is splitting in two. Buyers still type into Google, but an increasing share of high-intent research now happens as a conversation with ChatGPT, Claude, Gemini, or Perplexity: "what's the best project management software for a 10-person agency," "is Notion or ClickUp better for a marketing team," "what's a good Ahrefs alternative for AI search." The answer a model gives — which companies it names, in what order, with what framing — now functions the way page-one Google rankings did for the last two decades. Unlike a Google SERP, that answer is invisible to the company being discussed. There is no Search Console for ChatGPT.

Two things make this urgent instead of theoretical:

- **The channel is opaque by construction.** LLM outputs are generated, not indexed. A brand can't view its own "AI rank" the way it views its Google rank, because there is no fixed rank — the same prompt asked twice can return a different order, a different competitor set, or a different answer altogether (see §5.3, Accuracy Caveats). Marketers are flying blind on a channel that is already influencing purchase decisions.
- **Winning it requires different inputs than classic SEO.** LLMs weight things classic SEO under-weights — third-party sentiment on Reddit and G2, structured comparison content, citation-worthy factual claims — and under-weight things classic SEO over-indexes on, like backlink volume and keyword density. A team optimized for Google has no reason to already be doing the right things here.

AgentRank closes both gaps. It is the measurement layer (how visible is my brand across ChatGPT, Claude, Gemini, and Perplexity, compared to my named competitors, and is that changing week over week) and the action layer (what specific content or citation-building work would move that number) for a category we're calling **AI search visibility** — the same relationship Ahrefs has to Google SEO.

### Why now

- AI answer engines have crossed the threshold from novelty to daily-use research tool for B2B and consumer buyers.
- No incumbent SEO tool (Ahrefs, Semrush, Moz) has built AI-engine-native tracking as a first-class product; a handful of venture-backed point solutions (Profound, Otterly.AI, Peec AI) have validated the category but none has won it outright, and none serves the self-serve SMB/agency end of the market AgentRank targets.
- The four LLM providers all now expose retrieval/search-augmented modes (ChatGPT search, Gemini grounding, Perplexity's native answer engine, Claude's web search tool), which is what makes systematic, repeatable prompt-based measurement possible in the first place.

---

## 2. Target Users & Personas

| Persona | Who they are | Job to be done | Primary plan |
|---|---|---|---|
| **SaaS founder / marketer** | Seed-to-Series B B2B SaaS, 1–3 person marketing team, already does SEO/content | "Tell me if I'm losing deals because ChatGPT recommends my competitor instead of me, and what to do about it." | Growth |
| **Shopify app developer** | Small team shipping an app in a crowded Shopify App Store category (email, upsell, reviews, etc.) | "Buyers ask ChatGPT to compare Shopify apps before installing — am I even in the answer?" | Starter → Growth |
| **Agency / SEO consultant** | Runs SEO or growth retainers for 5–50 clients, needs a new deliverable to justify retainer value in an AI-search world | "Give me a dashboard I can white-label and show clients every month to prove I'm managing their AI visibility, not just their Google rank." | Agency |
| **Ecommerce brand** | DTC or multi-brand ecommerce, competitive category (skincare, supplements, home goods) | "Perplexity and ChatGPT are doing product research and comparison shopping for people now — am I recommended?" | Growth |
| **Startup founder (pre-PMF to Series A)** | Small team, limited marketing budget, needs to prioritize a handful of high-leverage content bets | "I can't do everything Ahrefs tells me to do for Google AND figure out AI search from scratch — give me the three things that matter most." | Starter |

### Non-goals for personas
AgentRank v1 is not built for enterprise brand/PR teams doing reputation monitoring at Fortune 500 scale, and not built for consumer-facing local businesses (restaurants, services) — the prompt-generation model (`lib/prompts/generator.ts`) is tuned for buyer-intent, comparison-shopping categories (software, ecommerce products), not local/navigational intent.

---

## 3. How the Product Works (Grounding in the Codebase)

1. **Onboarding** (`app/dashboard/onboarding/page.tsx`) — a user enters company name, website URL, industry, and a list of named competitors.
2. **Prompt generation** (`lib/prompts/generator.ts`, called via `app/api/prompts/generate/route.ts`) — deterministically expands that input into dozens of buyer-intent prompts across three shapes: category ("best {industry} software"), use-case ("best {industry} tool for agencies"), and comparison ("{brand} vs {competitor}", "{competitor} alternative"). These are persisted to the `prompts` table.
3. **Engine runner** (`lib/runner.ts`) — on a schedule, every active prompt is run against every configured engine provider (`lib/engines/openai.ts`, `anthropic.ts`, `google.ts`, `perplexity.ts`). Each provider calls the real provider API if an API key is present in `.env` (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_AI_API_KEY`, `PERPLEXITY_API_KEY`) and transparently falls back to `lib/engines/mock.ts` (a seeded, deterministic pseudo-random mock) if it isn't — this is what lets the app run and demo convincingly with zero provider keys configured.
4. **Entity extraction** (`lib/engines/extract.ts`) — the raw LLM response text is scanned for the project name and each competitor name; first-occurrence order is used as a rank proxy, and nearby language ("best," "top," "avoid," "however") drives a coarse sentiment heuristic. Cited domains are extracted from URLs in the response (or, for Perplexity, taken directly from the API's native `citations` field).
5. **Persistence** — one row per (prompt, engine, day) lands in `prompt_results`, with `mentioned_entities` as a JSONB array (`[{name, is_project, rank_position, sentiment}]`) and any cited domains written to `citations`.
6. **Scoring** (`lib/scoring.ts`) — `computeVisibilityScore()` rolls a batch of `prompt_results` into a 0–100 **AI Visibility Score**, blending mention frequency (40%), share of voice (35%), and a position-quality term that decays exponentially as rank position increases (25%) — being cited first is worth far more than being mentioned sixth. Scores are written to `visibility_scores` once per project per day (blended, `engine_id = null`) and once per project per engine.
7. **Dashboard** (`app/dashboard/*`) — reads roll up into the overview, competitors, prompts, citations, and recommendations screens (see `WIREFRAMES.md`).
8. **Recommendations** (`recommendations` table) — gap analysis between the project's and competitors' presence across prompts/citations produces prioritized content actions (category values: `comparison_page`, `integration_page`, `reddit_presence`, `glossary`, `directory`, `citation_building`).

---

## 4. Core Features

Each feature below maps to schema objects already in `supabase/migrations/0001_init.sql` and to scaffolded UI in `app/` / `components/dashboard/`.

### 4.1 AI Visibility Tracker
Tracks whether, where, and how a project is mentioned across ChatGPT, Claude, Gemini, and Perplexity for a generated set of buyer-intent prompts.

**User stories**
- As a SaaS marketer, I want AgentRank to automatically generate the prompts a buyer would actually type, so I don't have to guess what to track.
- As a user, I want to see, per prompt, whether I was mentioned, recommended, or the top pick, and in which engine.

**Acceptance criteria**
- Onboarding produces ≥40 unique prompts for a project with 3 competitors (verified against `generateBuyerIntentPrompts` — 8 category + 5 use-case + `3 competitors × 5 comparison templates` = 28, minus dedup; actual count varies by dedup collisions).
- Every active prompt (`prompts.status = 'active'`) is run against every enabled engine (`engines.is_enabled = true`) on the plan's refresh cadence (§5.2).
- Each run persists exactly one `prompt_results` row per (prompt, engine, day) — enforced by the `unique (prompt_id, engine_id, run_date)` constraint, so re-runs on the same day upsert rather than duplicate.
- The Prompts page (`app/dashboard/prompts/page.tsx`) renders `mention_type` (`not_mentioned` / `mentioned` / `recommended` / `top_pick`) as a colored badge per prompt/engine row.

### 4.2 AI Search Share Metrics
Mention frequency and share of voice, the two inputs (besides position) that make up the Visibility Score.

**User stories**
- As a user, I want to know what percentage of my tracked prompts mention me at all (mention frequency), separate from how I stack up against competitors when I am mentioned (share of voice).

**Acceptance criteria**
- `visibility_scores.mention_frequency` = % of tracked prompts where the project appears in `mentioned_entities` at all.
- `visibility_scores.share_of_voice` = project's mentions ÷ total mentions across project + all tracked competitors, across the scored batch.
- Both metrics are shown per-engine (`components/dashboard/charts/visibility-trend-chart.tsx`, the "By engine" card on `app/dashboard/page.tsx`) and blended.

### 4.3 Competitor Intelligence
Side-by-side visibility comparison against named competitors.

**User stories**
- As a user, I want to add competitors by name (no cooperation from them required) and see their visibility score next to mine.
- As a user, I want to know the moment a competitor overtakes me for a specific prompt.

**Acceptance criteria**
- Competitors are added via `competitors` table (`project_id`, `name`, `website_url`, `is_primary`); the Competitors page (`app/dashboard/competitors/page.tsx`) lists each with its own rolled-up visibility score.
- `components/dashboard/charts/competitor-bar-chart.tsx` renders project vs. every tracked competitor on one chart.
- A `competitor_overtook` alert fires (see 4.8) when a competitor's `rank_position` for a shared prompt improves past the project's for two consecutive runs (prevents single-run noise from firing an alert — see §5.3).

### 4.4 Citation Analysis
Surfaces which third-party domains AI engines actually cite when answering tracked prompts.

**User stories**
- As a user, I want to know that Reddit and G2 are cited in a third of my category's answers, so I know where to invest in third-party presence instead of guessing.

**Acceptance criteria**
- Every `prompt_results` row that includes cited URLs writes one `citations` row per domain, tagged with a `citation_source_type` (`reddit`, `g2`, `trustpilot`, `blog`, `news`, `github`, `docs`, `forum`, `other`) and whether that citation co-occurred with a project or competitor mention (`mentions_project`, `mentions_competitor_id`).
- The Citations page (`app/dashboard/citations/page.tsx`) ranks domains by citation count with a horizontal bar visualization and a plain-language "what this means" takeaway.
- Citation source-type classification is derived from domain pattern-matching (reddit.com → reddit, g2.com → g2, etc.) at write time.

### 4.5 AI SEO Recommendations
Turns visibility/citation gaps into a prioritized, actionable content plan.

**User stories**
- As a user with limited content budget, I want to be told the 3–5 highest-impact actions, not a generic 50-item checklist.
- As a user, I want each recommendation tied back to the specific prompts or citation gaps that produced it.

**Acceptance criteria**
- Each `recommendations` row has a `title`, `description`, `category`, `impact_estimate` (`high`/`medium`/`low`), `status` (`open`/`in_progress`/`done`/`dismissed`), and `related_prompt_ids` linking back to the `prompts` that justify it.
- The Recommendations page (`app/dashboard/recommendations/page.tsx`) lets a user mark a recommendation in progress; impact is shown as a badge, category as a secondary badge.
- Recommendation categories map 1:1 to the pSEO content categories in `SEO_PLAN.md` (comparison pages, integration pages, Reddit presence, glossary, directory, citation building) — the product's own recommendation engine and its content-marketing engine are the same taxonomy by design.

### 4.6 Programmatic SEO Engine
Auto-generates and serves indexable marketing pages from the product's own tracked data (ranking-checker tools, category pages, competitor brand-visibility reports, comparison pages, glossary, guides). Full spec in `SEO_PLAN.md`.

**User stories**
- As the AgentRank marketing team, I want the product's own database of prompts, mentions, and citations to generate hundreds of SEO-indexable pages with zero manual content production per page.
- As a prospect who searches "chatgpt ranking checker," I want to land on a working, self-serve tool, not a lead-gen form.

**Acceptance criteria**
- At minimum, the four engine-specific ranking-checker tools referenced in existing nav/footer components (`/chatgpt-ranking-checker`, `/claude-ranking-checker` appear in `components/marketing/nav.tsx` and `components/marketing/footer.tsx` today as placeholder links with no route yet) resolve to real, functioning pages before public launch.
- Category, comparison, and glossary page templates pull structured data (aggregate, anonymized `visibility_scores` by industry; named competitor comparisons from `demoCompetitors`-equivalent real data) rather than hand-written per-page copy.
- Pages are server-rendered (Next.js App Router) for crawlability, include per-page `<title>`/meta description generated from the template + slug variables, and are enumerated in a segmented XML sitemap.

### 4.7 AI Visibility Score (0–100)
The single blended number representing overall AI search visibility for a project.

**User stories**
- As a user, I want one number I can track over time and put in a board deck, the way I'd cite Domain Rating or a Google Search Console impression count.

**Acceptance criteria**
- Computed exactly per `computeVisibilityScore()` in `lib/scoring.ts`: `0.40 × mention_frequency + 0.35 × share_of_voice + 0.25 × position_quality`, where `position_quality = 100 × e^(-(avg_position - 1)/3)`, clamped to 0 when there's no mention.
- Persisted daily to `visibility_scores` with `engine_id = null` for the blended score and one row per enabled engine for the per-engine breakdown.
- Displayed with a trend delta (vs. prior period) on the dashboard overview (`TrendBadge` component in `app/dashboard/page.tsx`).
- The scoring methodology is publicly documented (pricing page FAQ already states the plain-language version; a fuller methodology page is required before the score is used in any public-facing badge, per §5.3).

### 4.8 Alerts
Proactive notification when visibility changes materially.

**User stories**
- As a busy founder, I don't want to check a dashboard weekly — tell me when something changes that I need to act on.

**Acceptance criteria**
- `alert_type` enum covers `visibility_lost`, `visibility_gained`, `competitor_overtook`, `new_ranking`, `lost_ranking`, `weekly_summary`.
- Alerts are deliverable via `alert_channel` (`email`, `in_app`, `slack`); email uses Resend, in-app renders via the bell icon + unread badge in `components/dashboard/topbar.tsx` and lists on `app/dashboard/alerts/page.tsx`.
- Starter includes email alerts only; Growth and above add Slack (per `pricing/page.tsx` feature lists).
- Alert-worthy thresholds (e.g., what magnitude of score change triggers `visibility_lost`) must be tunable per project to avoid alert fatigue from LLM output noise (§5.3) — a single-run swing should not, by itself, trigger an alert.

### 4.9 Reporting
Scheduled and on-demand exportable reports, including white-label for agencies.

**User stories**
- As an agency, I want to hand a client a branded PDF every month that proves the value of the retainer.
- As a self-serve user, I want a weekly email digest, not to have to log in to check my score.

**Acceptance criteria**
- `reports` table supports `report_type` (`weekly`, `monthly`, `on_demand`, `white_label`), a `period_start`/`period_end` range, a `summary` JSONB payload, and an optional `pdf_url`.
- `is_white_label` reports omit AgentRank branding and use the organization's `logo_url` (only available when `organizations.white_label_enabled = true`, an Agency-tier feature).
- Reports page (`app/dashboard/reports/page.tsx`) lists generated reports with a PDF export action and a "generate now" on-demand trigger.
- Refresh cadence maps to plan tier per §5.2.

### 4.10 Agency Mode
Multi-client management with white-label reporting for agencies and consultants.

**User stories**
- As an agency, I want unlimited client projects under one organization, one login, and the ability to switch between clients without re-authenticating.
- As an agency, I want my client-facing reports and dashboard to look like my agency built it, not like a tool I resell.

**Acceptance criteria**
- Enabled via `organizations.is_agency = true`; unlocked at the Agency plan tier (`subscriptions.plan_tier = 'agency'`).
- `organizations.white_label_enabled` gates white-label reports and, when built, a white-labeled client-facing dashboard.
- A **client-switcher** UI (an org-scoped project switcher in the dashboard chrome) does not yet exist in the codebase — see `WIREFRAMES.md` §9 for its intended design and `ROADMAP.md` for sequencing; today the dashboard renders a single implicit project via `lib/demo-data.ts`.
- `organization_members.role` (`owner`/`admin`/`member`/`viewer`) supports agencies inviting client-side stakeholders as read-only `viewer`s without giving them billing or settings access — enforced at the RLS layer in `supabase/migrations/0002_rls.sql`.

---

## 5. Non-Functional Requirements

### 5.1 Performance
- **Dashboard load:** Overview and all sub-pages should render meaningful content (not spinners) within 1.5s server-rendered, matching the current static-import pattern (`lib/demo-data.ts`) — once live Supabase queries replace demo data, per-page data fetches must stay server-side and cached/ISR'd where the data doesn't need to be real-time (e.g., a 5-minute revalidation window is acceptable for visibility scores, which change at most daily).
- **Prompt runner throughput:** `runProjectPrompts()` in `lib/runner.ts` currently loops sequentially through prompts within each engine provider (see the nested `for` loop). At Growth-tier volume (500 prompts × 4 engines = 2,000 calls/day) this is too slow to run synchronously in a request — it must run as a background job (Vercel Cron invoking an API route, or a Supabase Edge Function) with **concurrency** (e.g., a worker pool of 5–10 parallel requests per engine, respecting each provider's rate limits) rather than the current fully-sequential loop, or a full run will take hours instead of minutes.
- **Rate limits:** each engine provider must respect its own API rate limits (OpenAI, Anthropic, Google, Perplexity all differ); the runner needs backoff/retry logic before it's safe to run against paying customers' full prompt sets, which `lib/engines/*.ts` does not yet implement (a non-2xx response currently throws immediately with no retry).
- **pSEO page render:** programmatic pages must be static or ISR'd (not runtime-DB-queried on every request) at scale — hundreds to low thousands of pages hitting Postgres per-request on every crawl is both slow and needlessly expensive.

### 5.2 Data Freshness / Refresh Cadence by Plan Tier
| Tier | Refresh cadence | Rationale |
|---|---|---|
| Starter ($29/mo) | Weekly | Matches "Weekly visibility reports" in the pricing page feature list; keeps LLM API spend proportional to a $29 price point. |
| Growth ($99/mo) | Daily | Matches "4 AI engines, daily refresh" in the pricing page; the primary differentiator that justifies the 3.4x price step from Starter. |
| Agency ($299/mo) | Daily per client project, plus on-demand re-run | Agencies need to re-run a specific client on demand before a client call — an on-demand trigger (already stubbed as "Generate report now" on the Reports page) must call the runner directly rather than waiting for the schedule. |
| Enterprise (custom) | Configurable, up to real-time/on-demand per prompt | See `GROWTH_PLAN.md` §6 for the enterprise sketch. |

Refresh cadence is enforced by which prompts get included in a given day's scheduled runner invocation, keyed off `organizations.plan_tier` → `subscriptions.plan_tier`, not a per-prompt setting.

### 5.3 Accuracy Caveats (LLM Non-Determinism)
This is the most important non-functional requirement in the document, because it's the thing that makes this product category fundamentally different from classical rank tracking.

- **LLM outputs are not deterministic.** The same prompt sent to the same model twice can return a different set of mentioned brands, a different order, or omit a brand entirely, even with no underlying change in the world. AgentRank must never present a single day's `prompt_results` row as ground truth — the UI and methodology docs must communicate that the Visibility Score is a **statistical estimate from repeated sampling**, not a fixed rank.
- **Mitigation: repeated sampling.** Wherever budget allows, a prompt should be run more than once per period and results averaged, rather than relying on a single call per (prompt, engine, day). This is not yet implemented (`runProjectPrompts` does one call per prompt per engine per day) and should be prioritized before the Visibility Score is marketed as authoritative (see `ROADMAP.md`).
- **Entity extraction is heuristic, not exact.** `lib/engines/extract.ts` finds brand names via case-insensitive substring match and infers rank position from first-occurrence order, with sentiment from a small keyword list. This will misfire on brand names that are also common words, on responses that discuss a competitor negatively before recommending the project, and on multi-brand product families. This is an acceptable v1 approach but must be disclosed as "AI-estimated" wherever scores derived from it are shown, and improving extraction accuracy (e.g., a second LLM-based classification pass instead of regex/substring matching) is a strong post-MVP investment.
- **Provider/model drift.** Each provider's underlying model (`engines.model_id`, e.g. `gpt-4o-search-preview`, `claude-sonnet-5`, `gemini-2.5-pro`, `sonar-pro`) will change over time outside AgentRank's control. A visible score change coinciding with a known provider model update should be annotated, not presented as an organic visibility swing.
- **Mock vs. live data must never be ambiguous to the customer.** `lib/engines/mock.ts` exists so the product works without provider keys configured, but a paying customer must never see mock-derived scores presented as real without a clear indicator — see `ROADMAP.md` MVP-readiness gate on wiring real provider keys before any paid customer's project runs.
- **Alert thresholds must account for noise.** Because a single day's result can swing from sampling variance alone, `competitor_overtook` and `visibility_lost` alerts should require a sustained change across 2+ runs before firing (see §4.8), not a single-run delta.

### 5.4 Security & Data Isolation
- Every customer-facing table is RLS-protected per `supabase/migrations/0002_rls.sql`, scoped through `organization_members` — a user can only read/write rows belonging to organizations they're a member of.
- Background jobs (the prompt runner, scoring rollups, alert generation) must use the Supabase **service-role** key (`createServiceClient()` in `lib/supabase/server.ts`), which bypasses RLS by design — this key must never be exposed to the browser or used inside a request handler that echoes arbitrary user input back through it without an explicit organization check.
- Clerk session JWTs are forwarded to Supabase as the access token (`createClient()` in `lib/supabase/server.ts`) so Postgres RLS can read `request.jwt.claims ->> 'sub'` — this requires Supabase's third-party JWT (Clerk) integration to be configured in the Supabase dashboard, which is an infra step, not a code change.

### 5.5 Availability
- Target 99.5% uptime for the dashboard and marketing site (standard Vercel deployment SLA territory); the prompt runner is a background job and can tolerate brief delay/retry without violating this, since it's not in the customer's synchronous request path.

---

## 6. Out of Scope for v1

- **Additional AI engines beyond the initial four** (e.g., Grok/xAI, Microsoft Copilot, Meta AI, DeepSeek). The `engine_slug` enum and `engines` table are designed to make adding a fifth engine straightforward, but it is not committed for v1.
- **Non-English prompt generation and tracking.** `lib/prompts/generator.ts` templates are English-only; internationalization of prompt templates, entity extraction, and UI copy is a post-v1 investment.
- **A fine-tuned or ML-based sentiment/entity classifier.** v1 ships with the heuristic substring-match + keyword-window approach in `lib/engines/extract.ts`; a proper classification model is a known upgrade path, not a v1 requirement.
- **Real-time/streaming visibility tracking.** All tracking is batch (scheduled runs per §5.2), not continuous polling.
- **A native mobile app.** Dashboard is responsive web only.
- **Direct CMS/publishing integrations** (e.g., one-click "publish this recommended comparison page to my WordPress/Webflow site"). Recommendations tell the user what to build; v1 does not build or publish it for them.
- **Enterprise SSO/SAML.** Clerk supports it, but it is not wired or tested in v1; see the Enterprise sketch in `GROWTH_PLAN.md` for when it's expected.
- **Usage-based/metered billing.** v1 billing is flat-tier subscription only (`subscriptions.plan_tier`, `projects_limit`, `prompts_limit` as hard caps, not metered overage billing) — see `GROWTH_PLAN.md` for how overages are proposed to work as fixed add-on SKUs instead.
- **The agency client-switcher UI** described in §4.10 and `WIREFRAMES.md` §9 is explicitly a near-term roadmap item, not a v1 UI requirement — Agency-tier customers in v1 use one organization with multiple `projects`, navigated via the existing "New project" action in `DashboardTopbar`, without a dedicated switcher component.
- **Public AI Visibility Score badge/widget** (described in `GROWTH_PLAN.md` §5) is a growth-loop feature, not core product; it depends on the scoring methodology being public and stable first.
- **A11y and full WCAG audit.** Components are built on Radix primitives (accessible by default for keyboard/ARIA), but a formal audit is out of scope for v1.
