# AgentRank.ai

"Ahrefs for ChatGPT." AgentRank tracks how often ChatGPT, Claude, Gemini, and Perplexity mention or recommend a
company versus its competitors, scores that visibility, and recommends content to close the gap.

This repo is the foundation pass: database schema, core orchestration (prompt generation → engine querying → scoring
→ persistence), the dashboard shell, the marketing site, and the strategy docs. It runs locally today against demo
data with zero external accounts configured — see **Running locally** below.

## Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 15 (App Router) · TypeScript · Tailwind · shadcn-style components |
| Backend | Supabase (Postgres, RLS, Edge Functions) |
| Auth | Clerk |
| Payments | Stripe |
| Email | Resend |
| AI engines | OpenAI, Anthropic, Google (Gemini), Perplexity |
| Hosting | Vercel |

## Project structure

```
app/
  (marketing)/            marketing site — homepage, pricing, pSEO landing pages
  dashboard/               authenticated app — overview, competitors, prompts, citations,
                            recommendations, reports, alerts, settings, onboarding
  company/[slug]/          programmatic per-company visibility report pages
  api/prompts/generate/    prompt-generation endpoint (live today, no external deps)
  sign-in/ sign-up/        Clerk auth pages

components/
  ui/                       base primitives (button, card, badge, input, label, progress)
  marketing/                nav, footer
  dashboard/                sidebar, topbar, chart components

lib/
  types.ts                  TypeScript types mirroring the DB schema
  demo-data.ts               static data the dashboard renders against until Supabase is live
  scoring.ts                 the 0–100 AI Visibility Score algorithm
  runner.ts                  orchestrates: run every prompt × every engine → persist → roll up scores
  prompts/generator.ts       buyer-intent prompt generation (category / comparison / use-case templates)
  engines/                   one file per AI provider (openai, anthropic, google, perplexity) behind a
                              shared EngineProvider interface, plus mock.ts (deterministic fallback) and
                              extract.ts (mention/citation extraction heuristics)
  supabase/                  server + browser Supabase clients

supabase/migrations/        0001_init.sql (schema), 0002_rls.sql (row-level security)
supabase/seed.sql           local dev seed data

docs/                        PRD, database notes, SEO plan, growth plan, roadmap, wireframes
```

## Running locally

```bash
npm install
npm run dev
```

The app renders fully — marketing site, dashboard, onboarding flow — with **no environment variables set**. Two
things make that possible, both documented inline where they matter:

- `middleware.ts` and `app/layout.tsx` skip Clerk entirely when `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` isn't set, so
  `/dashboard` is reachable without auth in local/demo mode.
- Dashboard pages read from `lib/demo-data.ts` rather than Supabase until a real project is connected.

The one fully live feature end-to-end today is the onboarding flow at `/dashboard/onboarding`: it calls
`POST /api/prompts/generate`, which runs the real prompt-generation logic in `lib/prompts/generator.ts` — no API
keys required, since that step is pure templating.

## Wiring up real infrastructure

1. **Supabase** — create a project, run the migrations in `supabase/migrations/` in order, then set
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
2. **Clerk** — create an app, set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY`. Configure a JWT
   template named `supabase` so Clerk-issued tokens satisfy the RLS policies in `0002_rls.sql`.
3. **AI engines** — set any of `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_AI_API_KEY`, `PERPLEXITY_API_KEY`.
   Each provider in `lib/engines/` falls back to `lib/engines/mock.ts` when its key is absent, so you can wire
   these up one at a time.
4. **Stripe** — set `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` and the three price IDs; billing endpoints are
   not yet scaffolded in this pass (see `docs/ROADMAP.md`).
5. **Resend** — set `RESEND_API_KEY` for the weekly alert emails described in `docs/GROWTH_PLAN.md`.

Full copy of every required variable lives in `.env.example`.

## What's next

`docs/ROADMAP.md` lays out the 90-day plan; the short version is: connect Supabase and swap `lib/demo-data.ts`
reads for real queries, wire one real LLM provider end-to-end, add Stripe checkout, then open the trial.
