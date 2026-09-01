# AgentRank.ai — Screen Wireframes

**Status:** Living document, v1.0
**Last updated:** 2026-09-01
**Purpose:** Textual/ASCII wireframes documenting the intent behind screens that already exist as real components in `app/` and `components/dashboard/`, plus one screen (§9, Agency client-switcher) that does not exist yet and is documented here as a near-term addition per `PRD.md` §4.10 and `ROADMAP.md`.

Legend: `[ ]` = interactive control, `▓▓▓` = chart/data-viz region, `···` = repeating list row.

---

## 1. Marketing Homepage — `app/(marketing)/page.tsx`

```
┌──────────────────────────────────────────────────────────────┐
│ MarketingNav (components/marketing/nav.tsx)                   │
│ [A] AgentRank    Features  Pricing  AI SEO  Ranking Checker    │
│                                    [Log in]  [Start free trial]│
├──────────────────────────────────────────────────────────────┤
│                         HERO (bg-grid + gradient)              │
│         [Badge: ✦ Now tracking ChatGPT, Claude, Gemini &      │
│                   Perplexity]                                  │
│   H1: Does ChatGPT recommend YOUR COMPANY — or your            │
│       competitor's?                                            │
│   Sub: AgentRank is Ahrefs for ChatGPT...                      │
│   [Check my AI visibility →]   [See pricing]                   │
│   No credit card required · Free 14-day trial                  │
│   Tracked across: ChatGPT · Claude · Gemini · Perplexity       │
├──────────────────────────────────────────────────────────────┤
│                    LIVE SCOREBOARD PROOF CARD                  │
│  "AI Visibility Score — best project management software"      │
│  Your Company  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░  43%  ↑                │
│  Competitor A  ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░  31%  ↓                │
│  Competitor B  ▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░  18%                    │
├──────────────────────────────────────────────────────────────┤
│                    FEATURES (3-col card grid)                  │
│  6 cards: AI Visibility Tracker · Competitor Intelligence ·    │
│  Citation Analysis · AI SEO Recommendations · Weekly Alerts ·  │
│  Agency Mode  (each: title + 1-2 sentence description)         │
├──────────────────────────────────────────────────────────────┤
│              PERSONA / TRUST SPLIT (2-col)                     │
│  Left: "Built for teams who already won Google" + 4-item       │
│        checklist (SaaS founders, Shopify devs, agencies, SEO   │
│        consultants)                                            │
│  Right: Quote card — pull-quote testimonial + attribution       │
├──────────────────────────────────────────────────────────────┤
│                    FINAL CTA BAND (bordered card)               │
│   "Find out where you stand today"                             │
│   [Start free trial →]                                         │
├──────────────────────────────────────────────────────────────┤
│ MarketingFooter (components/marketing/footer.tsx)              │
│ Product | AI SEO tools | Company | Legal  (4-col link grid)    │
│ © AgentRank.ai. All rights reserved.                            │
└──────────────────────────────────────────────────────────────┘
```

**Data:** the hero scoreboard and features grid are currently static arrays (`SCOREBOARD`, `FEATURES`) in the component itself. Post-MVP, the scoreboard card should pull from the same **Live Scoreboard** data module defined in `SEO_PLAN.md` §2, making the homepage's proof point literally the same live query that powers `/best-project-management-software-ai-visibility`.

---

## 2. Pricing Page — `app/(marketing)/pricing/page.tsx`

```
┌──────────────────────────────────────────────────────────────┐
│ MarketingNav                                                    │
├──────────────────────────────────────────────────────────────┤
│         H1: Simple pricing that scales with your visibility    │
│         14-day free trial on every plan. Cancel anytime.       │
├──────────────────────────────────────────────────────────────┤
│   ┌───────────┐   ┌───────────────┐   ┌───────────┐          │
│   │  Starter  │   │ [Most popular]│   │  Agency   │          │
│   │   $29/mo  │   │    Growth     │   │  $299/mo  │          │
│   │           │   │   $99/mo      │   │           │          │
│   │ 6 feature │   │ 8 feature     │   │ 7 feature │          │
│   │ checkmarks│   │ checkmarks    │   │ checkmarks│          │
│   │ [Start    │   │ [Start free   │   │ [Talk to  │          │
│   │  free     │   │  trial]       │   │  sales]   │          │
│   │  trial]   │   │ (highlighted, │   │           │          │
│   │           │   │  bordered)    │   │           │          │
│   └───────────┘   └───────────────┘   └───────────┘          │
├──────────────────────────────────────────────────────────────┤
│                    FAQ (4 Q&A pairs, stacked)                  │
│   How do you generate prompts? / How is the score calculated? │
│   Can I track non-customer competitors? / Annual discount?    │
├──────────────────────────────────────────────────────────────┤
│ MarketingFooter                                                 │
└──────────────────────────────────────────────────────────────┘
```

**Data:** `PLANS` and `FAQ` are static arrays in the component. Note the CTA inconsistency flagged in `ROADMAP.md` §1: Agency reads "Talk to sales" while its checkout is otherwise designed to be self-serve like the other two tiers — a real Enterprise tier (`GROWTH_PLAN.md` §6) should inherit the "Talk to sales" motion instead.

---

## 3. Onboarding Flow — `app/dashboard/onboarding/page.tsx`

Single-page, two-state form (pre-submit / post-submit), not a multi-step wizard — deliberately low-friction given this is the activation-critical screen (`GROWTH_PLAN.md` §1).

```
┌──────────────────────────────────────────────────────────────┐
│  H1: Track a new company                                       │
│  Sub: We'll generate hundreds of buyer-intent prompts...       │
├──────────────────────────────────────────────────────────────┤
│  CARD: Company details                                         │
│   Company name     [___________________________]               │
│   Website URL      [___________________________]               │
│   Industry         [___________________________]               │
│   Competitors       [_____________] [+]                        │
│     [Badge: Competitor A ×] [Badge: Competitor B ×] ···         │
│   (error text if submission fails)                              │
│   [⟳ Generate visibility prompts]  (spinner while loading)      │
├──────────────────────────────────────────────────────────────┤
│  CARD (appears after generation): N prompts generated           │
│   · best {industry} software              [category]           │
│   · {brand} vs {competitor}                [comparison]  ···    │
│   (scrollable list, max-height)                                 │
│   caption: "Set your AI provider keys in .env to start          │
│             pulling live results instead of mocked ones"        │
│   [Go to dashboard →]                                            │
└──────────────────────────────────────────────────────────────┘
```

**Data flow:** form submit → `POST /api/prompts/generate` (`app/api/prompts/generate/route.ts`, zod-validated) → `generateBuyerIntentPrompts()` (`lib/prompts/generator.ts`) → rendered inline. Currently the generated list is a **preview only** — it is not yet persisted to `prompts` or followed by an immediate first engine run; per `ROADMAP.md` §2 (MVP gate 5) closing that gap (persist + trigger first run + redirect to a populating dashboard, not a static list) is required before this screen is launch-ready.

---

## 4. Dashboard Overview — `app/dashboard/page.tsx`

```
┌───────┬────────────────────────────────────────────────────────┐
│       │ DashboardTopbar: "Overview"      [+ New project] [🔔3] [●]│
│ Sidebar├───────────────────────────────────────────────────────┤
│ (60px │  ┌──────────┬──────────┬──────────┬──────────┐          │
│ wide) │  │ AI Vis.  │ Mention  │ Share of │ Avg.     │          │
│       │  │ Score    │ Freq.    │ Voice    │ Position │          │
│ [A]   │  │  40/100  │  53.5%   │   31%    │   2.1    │          │
│Agent  │  │  ↑ +3.5pt│          │          │          │          │
│Rank   │  └──────────┴──────────┴──────────┴──────────┘          │
│       ├───────────────────────────────────────┬──────────────────┤
│Overview│  Visibility trend                     │ By engine        │
│Compet- │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ (line     │ ChatGPT   43 ↑4  │
│ itors  │  chart, 90-day, recharts)              │ Claude    37 ↓2  │
│Prompts │                                        │ Gemini    29 ↑1  │
│Citations│                                       │ Perplexity 51 ↑7 │
│Recomm- │                                        │                  │
│ endat- ├───────────────────────────────────────┼──────────────────┤
│ ions   │  Competitor comparison (bar chart)     │ Recent alerts    │
│Reports │  You ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 40                │ [visibility_lost]│
│Alerts  │  Profound ▓▓▓▓▓▓▓▓▓▓▓▓▓ 34               │ You lost vis...  │
│Settings│  Otterly ▓▓▓▓▓▓▓▓ 22                     │ [competitor_...] │
│        │  Peec AI ▓▓▓▓▓ 16                        │ Profound over... │
└───────┴───────────────────────────────────────┴──────────────────┘
```

**Components:** `DashboardTopbar` (`components/dashboard/topbar.tsx`), `VisibilityTrendChart` and `CompetitorBarChart` (`components/dashboard/charts/`). **Data:** currently `demoOverallScore`, `demoEngineScores`, `demoTrend`, `demoCompetitorComparison`, `demoAlerts` from `lib/demo-data.ts` — the exact shape a real `lib/queries.ts` (`ROADMAP.md` §1) needs to replicate from `visibility_scores` and `alerts`.

---

## 5. Competitors Page — `app/dashboard/competitors/page.tsx`

```
┌───────┬────────────────────────────────────────────────────────┐
│Sidebar│ Topbar: "Competitors"                                   │
│       ├───────────────────────────────────────────────────────┤
│       │ "Track how each competitor performs..."   [+ Add competitor]│
│       ├───────────────────────────────────────────────────────┤
│       │ TABLE                                                   │
│       │  Competitor          Visibility score    Status         │
│       │  ──────────────────────────────────────────────────    │
│       │  Profound            34                  [Primary]      │
│       │  tryprofound.com                                        │
│       │  ──────────────────────────────────────────────────    │
│       │  Otterly.AI          22                  [Tracked]      │
│       │  otterly.ai                                             │
│       │  ──────────────────────────────────────────────────    │
│       │  Peec AI             16                  [Tracked]      │
│       │  peec.ai                                                │
└───────┴───────────────────────────────────────────────────────┘
```

**Data:** `demoCompetitors` joined against `demoCompetitorComparison` by name. Maps directly to the `competitors` table (`project_id`, `name`, `website_url`, `is_primary`) joined against `visibility_scores` — a real implementation needs a per-competitor score, which the current schema doesn't store directly (`visibility_scores.project_id` is scoped to the tracked project, not its competitors) — computing a competitor's own score requires running `computeVisibilityScore()` with the competitor treated as "the project" for that calculation, a detail worth flagging for whoever builds the real query.

---

## 6. Prompts Page — `app/dashboard/prompts/page.tsx`

```
┌───────┬────────────────────────────────────────────────────────┐
│Sidebar│ Topbar: "Prompts"                                       │
│       ├───────────────────────────────────────────────────────┤
│       │ "N buyer-intent prompts generated... re-run daily       │
│       │  across all four engines."                              │
│       ├───────────────────────────────────────────────────────┤
│       │ TABLE                                                   │
│       │  Prompt              Category  Engine     Pos  Result   │
│       │  ─────────────────────────────────────────────────────  │
│       │  best AI search      category  perplexity  1  [Top pick]│
│       │  visibility tracking                                    │
│       │  tool                                                   │
│       │  ─────────────────────────────────────────────────────  │
│       │  how do I track if   brand_mon chatgpt      3  [Mentioned]│
│       │  ChatGPT recommends  itoring                             │
│       │  my company                                              │
│       │  ─────────────────────────────────────────────────────  │
│       │  tools to monitor    category  gemini      —  [Not      │
│       │  brand mentions in                              mentioned]│
│       │  AI answers                                              │
└───────┴───────────────────────────────────────────────────────┘
```

**Data:** `demoPrompts` — one row per (prompt, engine) combination, matching the real `prompts` × `prompt_results` join. `MENTION_STYLE` maps `mention_type` (`top_pick`/`mentioned`/`not_mentioned`; note the demo data doesn't currently exercise `recommended`, the fourth enum value) to badge variants. A real build should add filtering by engine/category and pagination, since a Growth-tier project can have 500 tracked prompts × 4 engines = 2,000 rows.

---

## 7. Citations Page — `app/dashboard/citations/page.tsx`

```
┌───────┬────────────────────────────────────────────────────────┐
│Sidebar│ Topbar: "Citations"                                     │
│       ├───────────────────────────────────────────────────────┤
│       │ "Domains AI engines cited while answering your tracked  │
│       │  prompts, ranked by frequency."                          │
│       ├───────────────────────────────────────────────────────┤
│       │ CARD (horizontal bar list)                               │
│       │  reddit.com      ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░  14 cites        │
│       │  g2.com          ▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░   9 cites         │
│       │  trustpilot.com  ▓▓▓▓▓▓▓░░░░░░░░░░░░░░░   6 cites         │
│       │  techcrunch.com  ▓▓▓▓▓░░░░░░░░░░░░░░░░░   4 cites         │
│       │  github.com      ▓▓▓░░░░░░░░░░░░░░░░░░░   3 cites         │
│       ├───────────────────────────────────────────────────────┤
│       │ CARD: "What this means"                                  │
│       │  "Reddit and G2 dominate your category's citations —     │
│       │   prioritize earning mentions there... See Recommend-    │
│       │   ations tab for specific actions."                      │
└───────┴───────────────────────────────────────────────────────┘
```

**Data:** `demoCitations`, bar widths computed relative to `maxMentions`. Maps to `citations` grouped by `domain`, filtered by `project_id`. This is also the exact **Citation Leaderboard** data module reused on pSEO pages (`SEO_PLAN.md` §2) — worth building as one shared component/query used by both the dashboard and the public category pages, not two separate implementations.

---

## 8. Recommendations Page — `app/dashboard/recommendations/page.tsx`

```
┌───────┬────────────────────────────────────────────────────────┐
│Sidebar│ Topbar: "Recommendations"                                │
│       ├───────────────────────────────────────────────────────┤
│       │ "Generated from gaps between you and competitors..."     │
│       ├───────────────────────────────────────────────────────┤
│       │ CARD                                                     │
│       │  [high impact] [comparison page]                         │
│       │  Publish "AgentRank vs Profound" comparison page          │
│       │  You're mentioned alongside Profound in 12 prompts        │
│       │  but don't have a page targeting that comparison.         │
│       │                              [Mark in progress]           │
│       ├───────────────────────────────────────────────────────┤
│       │ CARD                                                     │
│       │  [high impact] [reddit presence]                          │
│       │  Earn 5 more Reddit mentions in r/SaaS and r/marketing    │
│       │  Reddit is cited in 34% of answers where a competitor     │
│       │  is recommended over you.                                 │
│       │                              [Mark in progress]           │
│       ├───────────────────────────────────────────────────────┤
│       │ CARD (medium impact, glossary) ···                        │
└───────┴───────────────────────────────────────────────────────┘
```

**Data:** `demoRecommendations` → `recommendations` table (`title`, `description`, `category`, `impact_estimate`, `status`). Note `status` supports `in_progress`/`done`/`dismissed` beyond `open` — the UI currently only exposes the "Mark in progress" transition; a real build should let a user cycle through all four states (e.g., a status dropdown or additional actions) and should link `related_prompt_ids` back to the filtered Prompts page for evidence.

---

## Reference: Settings, Reports, Alerts (brief)

Not detailed as full wireframes since they're simpler, but included for completeness against `app/dashboard/`:

- **`app/dashboard/settings/page.tsx`** — two stacked cards: "Project details" (editable name/URL/industry form) and "Billing" (current plan + price, "Manage billing in Stripe" button). Per `GROWTH_PLAN.md` §3.3, this is also the intended home for the future "Refer a colleague" card.
- **`app/dashboard/reports/page.tsx`** — a list of generated reports (label + type badge + "Export PDF" action) with a "Generate report now" button in the header.
- **`app/dashboard/alerts/page.tsx`** — a stacked feed of alert cards (type badge, title, body, relative date), styled by `alert_type` → color mapping (`visibility_gained`/`new_ranking` = success, `visibility_lost`/`competitor_overtook`/`lost_ranking` = destructive, `weekly_summary` = outline).

---

## 9. Agency Client-Switcher (Future Addition — Not Yet in the Codebase)

Unlike every screen above, this one does not exist as a component or route today. It's documented here because `PRD.md` §4.10 and `ROADMAP.md` both scope it as the primary remaining gap in Agency Mode: currently, an agency org with multiple client `projects` has no dedicated UI for moving between them — the dashboard implicitly renders one project's data (via `lib/demo-data.ts` today, and a single-project assumption baked into every current page).

**Intended design**, extending the existing `DashboardSidebar` (`components/dashboard/sidebar.tsx`) and `DashboardTopbar` (`components/dashboard/topbar.tsx`) rather than replacing them:

```
┌───────┬────────────────────────────────────────────────────────┐
│Sidebar│ Topbar                                                   │
│       │  ┌──────────────────────┐                                │
│ [A]   │  │ ▼ Acme Corp (client)  │  [+ New project] [🔔3] [●]     │
│Agent  │  └──────────────────────┘                                │
│Rank   │  ┌──────────────────────────────┐  ← dropdown, open state │
│       │  │ 🔍 Search clients...          │                        │
│AGENCY │  ├──────────────────────────────┤                        │
│CLIENTS│  │ ★ Acme Corp          40/100   │ (current, checked)     │
│(new   │  │   Widget Co           58/100   │                        │
│section│  │   Northwind Traders   22/100   │                        │
│above  │  │   ...                          │                        │
│the    │  ├──────────────────────────────┤                        │
│existing│ │ [+ Add new client project]     │                        │
│NAV    │  └──────────────────────────────┘                        │
│list)  │                                                            │
│       │  Rest of page renders exactly like today's dashboard,     │
│       │  scoped to whichever project is selected.                 │
└───────┴───────────────────────────────────────────────────────┘
```

**Layout regions:**
- **Switcher control**, placed at the top of `DashboardSidebar` above the existing `NAV` list (Overview/Competitors/Prompts/etc.), which stays project-scoped and unchanged beneath it — the switcher changes *which* project's data those nav links point to, not the nav structure itself.
- **Dropdown panel**: search-filterable list of every `projects` row under the agency's `organization_id`, each row showing the client name and its current blended `visibility_score` inline (so an agency user can spot a client that needs attention without opening it) — this reuses the same query already needed for the Competitors page's per-project scoring.
- **"Add new client project"** row at the bottom of the dropdown, routing to the existing onboarding flow (`app/dashboard/onboarding/page.tsx`) — no new onboarding UI needed, just a new entry point that pre-associates the resulting project with the agency org rather than creating a new org.
- **Persistence**: selected project should persist across navigation (URL param, e.g. `?project=acme-corp`, or a cookie) so switching clients and then clicking "Competitors" doesn't reset back to a default project.

**Access control implication:** per `PRD.md` §4.10, an agency inviting a client stakeholder as `organization_members.role = 'viewer'` should see a *locked* switcher (their own project only, no dropdown) even though the underlying agency org has many projects — the switcher UI itself needs to read the requesting user's role, not just their org membership, before rendering the multi-client list.

**Why this is the right shape given the existing code:** it's additive to `DashboardSidebar` and requires no change to any of the 8 existing dashboard pages' internal layout — each page already renders "the current project's data," so introducing a project-selection mechanism above the nav, rather than re-architecting each page, is the smallest change that unlocks Agency Mode's core promise.
