# AgentRank.ai — Programmatic SEO Plan

**Status:** Living document, v1.0
**Last updated:** 2026-09-01
**Related:** `PRD.md` §4.6 (Programmatic SEO Engine feature spec), `WIREFRAMES.md`

---

## 1. The pSEO Moat Thesis

AgentRank sells visibility into how AI answer engines talk about a company. The single most credible way to prove that product works is to **run it on ourselves, in public, at scale** — and the pages that result from doing so are also, independently, the highest-intent SEO content we could write by hand.

This isn't a metaphor. It's a literal data pipeline:

```
prompts (buyer-intent queries) ─┐
prompt_results (per engine/day) ─┼──▶ visibility_scores ──▶ auto-generated pSEO pages
citations (cited domains)       ─┘         │
                                            └──▶ recommendations (content gaps)
```

Every table already in `supabase/migrations/0001_init.sql` that powers the product dashboard is the same table that powers a public page. A competitor's `visibility_score` isn't a marketing claim we write once and let go stale — it's a live number the same runner (`lib/runner.ts`) refreshes on the same cadence as a paying customer's dashboard. That's the moat: a competitor SEO tool would have to build the entire tracking product just to credibly copy the content strategy, and by the time they did, our page count and data history would have compounded for months.

**Why this is defensible in a way generic content marketing isn't:**
1. **Data-driven pages don't go stale the way editorial content does.** A `/company/[brand]-ai-visibility-report` page updates itself every time the runner executes — no editor has to remember to refresh it.
2. **The category itself is nascent, so the SEO opportunity is uncontested.** "AI visibility," "AEO," and "ChatGPT SEO" have a fraction of the search volume "SEO software" has today — but that volume is growing fast, and being the page Google (and, recursively, the AI engines themselves) already trusts for those terms when volume matures is worth far more than fighting for share in a mature category.
3. **It's recursive.** Ranking checker tools and glossary pages are exactly the kind of citable, structured, factual content that LLMs themselves prefer to cite (see `PRD.md` §4.4, Citation Analysis) — so AgentRank's own pSEO pages should, over time, show up as citations inside the very AI answers the product tracks. A tool that ranks well in AI search for "AI search visibility" is the best possible advertisement for itself.

**What "practicing what it sells" means concretely for this plan:** every page category below is populated primarily by querying AgentRank's own product database (aggregated/anonymized where the underlying data is customer-specific), not by manually written claims about competitors or categories.

---

## 2. Data Modules (what actually populates a pSEO page)

These are the reusable data components auto-generated pages assemble from. Building these as shared components once means every one of the ~100 pages below is a template + slug variables, not hand-written HTML.

| Module | Source | Used on |
|---|---|---|
| **Live Scoreboard** | Aggregated `visibility_scores` (blended, `engine_id = null`) grouped by `projects.industry`, anonymized to "Company A / Company B" unless the company has opted into a public profile | `/best-[category]-ai-visibility`, homepage |
| **Engine Breakdown** | `visibility_scores` where `engine_id` is set, joined to `engines.display_name` | `/[engine]-ranking-checker`, `/company/[brand]-ai-visibility-report` |
| **Citation Leaderboard** | `citations` grouped by `domain` and `source_type`, filtered by industry or project | `/best-[category]-ai-visibility`, `/guides/how-to-rank-in-*` |
| **Interactive Ranking Checker** | Live call through `lib/prompts/generator.ts` + `lib/engines/*` for a user-submitted brand/category, same code path as onboarding | `/[engine]-ranking-checker`, `/google-ai-overviews-ranking-checker` |
| **Sample Prompt List** | A representative slice of `prompts.text` for the relevant category/template type | `/best-[category]-ai-visibility`, `/guides/*` |
| **Trend Sparkline** | `visibility_scores` time series (last 90 days) | `/company/[brand]-ai-visibility-report`, `/vs/*` |
| **Recommendation Preview** | 1–2 anonymized/generalized rows from `recommendations.category` for the relevant vertical, teasing the paid product | `/best-[category]-ai-visibility`, `/guides/*` |
| **Glossary Cross-Reference** | Static editorial + auto-linked to any glossary term mentioned | All pages (internal linking layer) |

---

## 3. Page Inventory by Category

Seven categories, ~105 total URLs. URL pattern, search intent, content template, and example slugs for each.

### 3.1 Engine Ranking Checkers — `/[engine]-ranking-checker` (5 pages)

**Intent:** Transactional/tool intent — "let me check this myself right now," typically from someone who has already heard the concept and wants to self-serve before talking to sales. High conversion-to-trial intent.

**Template:** Interactive form (brand name + up to 3 competitors + industry) that runs the same generation-and-query pipeline as onboarding (`app/api/prompts/generate/route.ts` → `lib/engines/*`), returns a free, capped result (e.g., top 5 prompts, one engine) inline, then gates the full multi-engine report behind signup. Populated with the **Interactive Ranking Checker** and **Engine Breakdown** modules. This is the same page already referenced (but not yet built) from `components/marketing/nav.tsx` and `components/marketing/footer.tsx`.

Example slugs:
1. `/chatgpt-ranking-checker`
2. `/claude-ranking-checker`
3. `/gemini-ranking-checker`
4. `/perplexity-ranking-checker`
5. `/google-ai-overviews-ranking-checker`

### 3.2 Category Visibility Pages — `/best-[category]-ai-visibility` (25 pages)

**Intent:** Research/comparison intent from someone evaluating tools in a category who has started to notice AI-answer inconsistency — adjacent to "best X software" searches but specific to the AI-visibility angle, which no incumbent SEO tool currently targets.

**Template:** Anonymized **Live Scoreboard** for the category (which companies AI engines currently favor, aggregated across all AgentRank-tracked projects in that vertical), **Citation Leaderboard** for the category (which third-party domains get cited most when AI engines discuss it), a **Sample Prompt List**, and a **Recommendation Preview** ("companies in this category are winning citations by doing X — see your own gaps with a free scan").

Example slugs (25 real SaaS/ecommerce categories):
6. `/best-project-management-software-ai-visibility`
7. `/best-crm-software-ai-visibility`
8. `/best-email-marketing-software-ai-visibility`
9. `/best-accounting-software-ai-visibility`
10. `/best-hr-software-ai-visibility`
11. `/best-applicant-tracking-system-ai-visibility`
12. `/best-help-desk-software-ai-visibility`
13. `/best-live-chat-software-ai-visibility`
14. `/best-ecommerce-platform-ai-visibility`
15. `/best-headless-commerce-platform-ai-visibility`
16. `/best-subscription-billing-software-ai-visibility`
17. `/best-inventory-management-software-ai-visibility`
18. `/best-pos-software-ai-visibility`
19. `/best-marketing-automation-software-ai-visibility`
20. `/best-seo-software-ai-visibility`
21. `/best-social-media-management-software-ai-visibility`
22. `/best-video-conferencing-software-ai-visibility`
23. `/best-password-manager-ai-visibility`
24. `/best-website-builder-ai-visibility`
25. `/best-form-builder-ai-visibility`
26. `/best-survey-software-ai-visibility`
27. `/best-appointment-scheduling-software-ai-visibility`
28. `/best-contract-management-software-ai-visibility`
29. `/best-expense-management-software-ai-visibility`
30. `/best-payroll-software-ai-visibility`

### 3.3 Company AI Visibility Reports — `/company/[brand]-ai-visibility-report` (20 pages)

**Intent:** Navigational/curiosity intent — someone (often the company itself, its competitors, or its investors) searching the brand name plus "AI" or "ChatGPT." This is the category-defining page type: a free, always-current visibility snapshot for a named company, generated the same way a customer's own dashboard is, just published publicly and less detailed. Directly analogous to how BuiltWith or Crunchbase publish free public profile pages for companies as an acquisition funnel — no claims are fabricated, every number is a live read of AgentRank's own tracked data for that brand.

**Template:** **Engine Breakdown**, **Trend Sparkline**, top 3 prompts where the brand is/isn't mentioned, and a CTA to "claim and expand this report" (signup flow that seeds onboarding with the brand pre-filled). Each page also cross-links to any `/vs/` page involving that brand and any `/best-[category]-ai-visibility` page for its industry.

Example slugs (20 real, recognizable SaaS/ecommerce brands used purely as report subjects, not as endorsed or disparaged parties — content is generated from tracked model outputs, never editorialized):
31. `/company/hubspot-ai-visibility-report`
32. `/company/salesforce-ai-visibility-report`
33. `/company/notion-ai-visibility-report`
34. `/company/asana-ai-visibility-report`
35. `/company/monday-ai-visibility-report`
36. `/company/clickup-ai-visibility-report`
37. `/company/shopify-ai-visibility-report`
38. `/company/bigcommerce-ai-visibility-report`
39. `/company/klaviyo-ai-visibility-report`
40. `/company/mailchimp-ai-visibility-report`
41. `/company/intercom-ai-visibility-report`
42. `/company/zendesk-ai-visibility-report`
43. `/company/gorgias-ai-visibility-report`
44. `/company/freshdesk-ai-visibility-report`
45. `/company/airtable-ai-visibility-report`
46. `/company/zapier-ai-visibility-report`
47. `/company/calendly-ai-visibility-report`
48. `/company/typeform-ai-visibility-report`
49. `/company/gusto-ai-visibility-report`
50. `/company/quickbooks-ai-visibility-report`

### 3.4 Comparison ("vs") Pages — `/vs/[tool]-vs-agentrank` (10 pages)

**Intent:** Bottom-of-funnel comparison intent from someone already evaluating AI-visibility tools specifically — the highest-conversion-rate page category, competing directly for the exact prompts AgentRank's own tracker is built to monitor.

**Template:** Feature-by-feature comparison table (pricing, engines tracked, refresh cadence, pSEO/recommendation engine, agency mode), a "why teams switch" section, and — where the other tool doesn't publish detailed pricing — an honest "as of [date], see their pricing page" disclaimer rather than a stale number. Populated with the **Trend Sparkline** showing AgentRank's own visibility trend for the query "[tool] vs AgentRank" itself, which is genuinely on-brand content (the demo data already tracks Profound, Otterly.AI, and Peec AI as reference competitors in `lib/demo-data.ts`, confirming these are the real, intended comparison set).

Example slugs (real, named competitors in the AI-visibility-tracking category):
51. `/vs/profound-vs-agentrank`
52. `/vs/otterly-ai-vs-agentrank`
53. `/vs/peec-ai-vs-agentrank`
54. `/vs/athena-hq-vs-agentrank`
55. `/vs/scrunch-ai-vs-agentrank`
56. `/vs/goodie-ai-vs-agentrank`
57. `/vs/rankscale-vs-agentrank`
58. `/vs/semrush-ai-toolkit-vs-agentrank`
59. `/vs/ahrefs-brand-radar-vs-agentrank`
60. `/vs/nozzle-vs-agentrank`

### 3.5 Glossary — `/glossary/[term]` (20 pages)

**Intent:** Top-of-funnel definitional intent ("what is AEO," "what is a llms.txt file") — low individual volume per term today, but this is exactly the content type that compounds as the category grows, and definitional pages are disproportionately likely to be the pages LLMs themselves cite when asked to define a term (feeding the recursive-citation effect from §1).

**Template:** Definition (100–150 words), a "why it matters for AI visibility" section, one worked example, and a **Glossary Cross-Reference** linking to 3–5 related terms plus the most relevant `/guides/` page.

Example slugs:
61. `/glossary/ai-visibility-score`
62. `/glossary/answer-engine-optimization`
63. `/glossary/generative-engine-optimization`
64. `/glossary/share-of-voice-ai-search`
65. `/glossary/llm-citation`
66. `/glossary/prompt-tracking`
67. `/glossary/ai-search-share`
68. `/glossary/chatgpt-seo`
69. `/glossary/zero-click-ai-search`
70. `/glossary/rag-seo`
71. `/glossary/brand-mention-rate`
72. `/glossary/ai-overview-optimization`
73. `/glossary/llms-txt`
74. `/glossary/structured-data-for-ai-crawlers`
75. `/glossary/gptbot`
76. `/glossary/perplexitybot`
77. `/glossary/claudebot`
78. `/glossary/ai-referral-traffic`
79. `/glossary/citation-velocity`
80. `/glossary/entity-based-seo`

### 3.6 "How to Rank in [Engine]" Guides — `/guides/[slug]` (15 pages)

**Intent:** How-to/actionable intent from marketers actively trying to solve the problem right now — the highest-value organic content category for driving qualified trial signups, since anyone reading to the end has self-identified as someone with budget and urgency.

**Template:** Long-form editorial (1,200–2,000 words, written/reviewed by a human, not auto-generated — this is the one category that should stay hand-authored for quality) structured around a repeatable framework, embedding the **Citation Leaderboard** and **Recommendation Preview** modules as live proof rather than static screenshots, and closing with a CTA into the relevant `/[engine]-ranking-checker` tool.

Example slugs:
81. `/guides/how-to-rank-in-chatgpt`
82. `/guides/how-to-get-cited-by-perplexity`
83. `/guides/how-to-rank-in-claude-answers`
84. `/guides/how-to-appear-in-google-ai-overviews`
85. `/guides/how-to-write-content-llms-cite`
86. `/guides/how-to-build-reddit-presence-for-ai-visibility`
87. `/guides/how-to-get-listed-on-g2-for-ai-search`
88. `/guides/how-to-optimize-for-gptbot`
89. `/guides/how-to-create-an-llms-txt-file`
90. `/guides/how-to-track-chatgpt-rankings-for-free`
91. `/guides/ai-seo-for-ecommerce`
92. `/guides/ai-seo-for-shopify-apps`
93. `/guides/ai-seo-for-saas`
94. `/guides/comparison-pages-that-win-ai-citations`
95. `/guides/how-to-monitor-competitor-ai-visibility`

### 3.7 Integration & Alternative Pages — `/integrations/[tool]` and `/alternatives/[legacy-tool]-ai-visibility-alternative` (10 pages)

**Intent:** Two distinct intents bundled for symmetry — integration pages target "does AgentRank work with X" (adoption-friction intent for prospects already sold on the category), alternative pages target displacement intent from users of adjacent, mature SEO tools who are starting to ask whether their existing stack covers AI search (it doesn't, yet).

**Template — integrations:** What data flows where (e.g., "push a weekly visibility summary to Slack," "export visibility_scores to a Google Sheet," "sync alerts into HubSpot as a task"), a setup walkthrough, and a link to docs.
**Template — alternatives:** Honest positioning — "Ahrefs and Semrush are best-in-class for Google SEO and don't track AI answer engines at all; AgentRank is built specifically for that gap and is a complement, not a replacement" — avoiding the common pSEO trap of pretending to be a like-for-like substitute when the honest pitch (adjacent, not competing) converts better and holds up under scrutiny.

Example slugs:
96. `/integrations/slack`
97. `/integrations/zapier`
98. `/integrations/hubspot`
99. `/integrations/looker-studio`
100. `/integrations/google-sheets`
101. `/alternatives/ahrefs-ai-visibility-alternative`
102. `/alternatives/semrush-ai-visibility-alternative`
103. `/alternatives/moz-ai-visibility-alternative`
104. `/alternatives/brightedge-ai-visibility-alternative`
105. `/alternatives/conductor-ai-visibility-alternative`

---

## 4. On-Page Structure for Auto-Generated Pages

Every templated page (categories 3.1–3.5, 3.7; guides in 3.6 are hand-authored) follows this region layout:

```
┌─────────────────────────────────────────────┐
│ H1 (slug-variable formula, see below)        │
│ 1-sentence dek stating what data backs the   │
│ page and how fresh it is ("updated daily")   │
├─────────────────────────────────────────────┤
│ PRIMARY DATA MODULE                          │
│ (Live Scoreboard / Engine Breakdown /        │
│  Interactive Ranking Checker — category-     │
│  dependent, see §2 table)                    │
├─────────────────────────────────────────────┤
│ SECONDARY DATA MODULE                        │
│ (Citation Leaderboard or Trend Sparkline)    │
├─────────────────────────────────────────────┤
│ Sample Prompt List (3-5 real tracked prompts │
│ relevant to this page, builds trust that the │
│ data is real, not fabricated)                │
├─────────────────────────────────────────────┤
│ Recommendation Preview (1-2 teaser rows,     │
│ "unlock your full report" CTA)               │
├─────────────────────────────────────────────┤
│ Related pages (Glossary Cross-Reference +    │
│ 3-5 contextual internal links, see §5)       │
├─────────────────────────────────────────────┤
│ FAQ block (schema.org FAQPage markup)        │
├─────────────────────────────────────────────┤
│ CTA band: "Check your own AI visibility" →   │
│ /sign-up (pre-filled with slug variables     │
│ where applicable, e.g. industry pre-filled   │
│ from a /best-[category]-ai-visibility page)  │
└─────────────────────────────────────────────┘
```

**H1 formulas by category:**
- Ranking checker: `Is Your Company Recommended by [Engine]? Free {Engine} Ranking Checker`
- Category: `Best {Category} — Ranked by AI Visibility`
- Company report: `{Brand}'s AI Visibility Report — How Often ChatGPT, Claude, Gemini & Perplexity Recommend {Brand}`
- Vs: `{Tool} vs AgentRank: Which AI Visibility Tracker Should You Use?`
- Glossary: `What Is {Term}? (Definition + Example)`
- Guide: hand-authored, no formula
- Integration: `AgentRank + {Tool} Integration`
- Alternative: `Best {Legacy Tool} Alternative for AI Search Visibility`

**Technical requirements:**
- Server-rendered (App Router), not client-only — crawlers must see full content on first response.
- Meta title/description generated from the same slug-variable template as the H1, kept under 60/155 characters.
- Canonical tags self-referencing (no duplicate-content risk between templated variants since each has a unique data payload).
- Structured data: `FAQPage` on every page with an FAQ block, `SoftwareApplication` on the ranking-checker tools, `Organization` + `Article` on guides.
- Segmented sitemaps (`/sitemap-categories.xml`, `/sitemap-companies.xml`, `/sitemap-vs.xml`, `/sitemap-glossary.xml`, `/sitemap-guides.xml`) rather than one flat sitemap, so Search Console coverage issues are diagnosable per content type.
- ISR revalidation: category/company/vs pages revalidate on the same cadence as the underlying `visibility_scores` refresh (daily); glossary/guide/integration pages revalidate weekly or on manual publish, since their content doesn't derive from live data.

---

## 5. Internal Linking Strategy

**Hub-and-spoke, not a flat mesh.** Three pillar hubs anchor the structure:
1. **`/ai-search-seo`** (already referenced in `components/marketing/nav.tsx` and `footer.tsx` as a nav/footer link, not yet built) — the top-of-funnel pillar page, linking out to every guide and every glossary term.
2. **`/pricing`** and the four `/[engine]-ranking-checker` tools — the product pillar, which every category, company-report, and vs page links into via its CTA band.
3. **`/company/[brand]-ai-visibility-report`** pages — the widest spoke layer (20 pages, growing over time as more brands are tracked), cross-linked densely to `/best-[category]-ai-visibility` and `/vs/` pages.

**Specific rules:**
- Every category page (3.2) links to its 3–5 most-visible **company report** pages (3.3) for that vertical, and vice versa — company reports link back to their category page.
- Every glossary term (3.5) links to the 1–2 guides (3.6) where that term is used in context, and every guide links to every glossary term it mentions on first use.
- Every vs page (3.4) links to the relevant `/alternatives/` page (3.7) if the compared tool has legacy-SEO-tool positioning, and to its own trend data via the Trend Sparkline module.
- The `MarketingFooter` component (`components/marketing/footer.tsx`) already reserves a dedicated "AI SEO tools" column — this should expand from its current 4 hardcoded links to programmatically list the highest-authority page from each of the 7 categories above, rotating periodically rather than being static.
- No page should be more than 3 clicks from the homepage; category pages and the pillar (`/ai-search-seo`) are the primary depth-reducers.
- Orphan prevention: every auto-generated page must be linked from at least one other page and from a sitemap at build/generation time — a page existing only in the database with no inbound link is treated as a bug, not a low-priority page.
