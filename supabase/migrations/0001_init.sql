-- AgentRank.ai core schema
-- Postgres / Supabase. Run in order; RLS policies live in 0002_rls.sql.

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================================
-- ENUMS
-- ============================================================================

create type plan_tier as enum ('starter', 'growth', 'agency', 'enterprise');
create type subscription_status as enum ('trialing', 'active', 'past_due', 'canceled', 'incomplete');
create type org_role as enum ('owner', 'admin', 'member', 'viewer');
create type engine_slug as enum ('chatgpt', 'claude', 'gemini', 'perplexity');
create type prompt_status as enum ('active', 'paused', 'archived');
create type prompt_source as enum ('auto_generated', 'user_added', 'ai_suggested');
create type mention_type as enum ('not_mentioned', 'mentioned', 'recommended', 'top_pick');
create type citation_source_type as enum ('reddit', 'g2', 'trustpilot', 'blog', 'news', 'github', 'docs', 'forum', 'other');
create type alert_type as enum (
  'visibility_lost', 'visibility_gained', 'competitor_overtook',
  'new_ranking', 'lost_ranking', 'weekly_summary'
);
create type alert_channel as enum ('email', 'in_app', 'slack');
create type report_type as enum ('weekly', 'monthly', 'on_demand', 'white_label');

-- ============================================================================
-- CORE: organizations, users, membership
-- ============================================================================

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  is_agency boolean not null default false,
  plan_tier plan_tier not null default 'starter',
  stripe_customer_id text unique,
  logo_url text,
  white_label_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Mirrors Clerk users; primary key is the Clerk user id (text), not a generated uuid.
create table users (
  id text primary key,
  email text not null unique,
  full_name text,
  avatar_url text,
  default_org_id uuid references organizations(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  role org_role not null default 'member',
  invited_email text,
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index idx_org_members_org on organization_members(organization_id);
create index idx_org_members_user on organization_members(user_id);

-- ============================================================================
-- PROJECTS (a project = one tracked brand, agencies have many)
-- ============================================================================

create table projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  slug text not null,
  website_url text not null,
  industry text not null,
  description text,
  logo_url text,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create index idx_projects_org on projects(organization_id);

create table competitors (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  website_url text,
  is_primary boolean not null default false,
  added_by text references users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (project_id, name)
);

create index idx_competitors_project on competitors(project_id);

-- ============================================================================
-- ENGINES (static reference table, seeded)
-- ============================================================================

create table engines (
  id uuid primary key default gen_random_uuid(),
  slug engine_slug not null unique,
  display_name text not null,
  provider text not null,
  model_id text not null,
  is_enabled boolean not null default true,
  icon_url text
);

insert into engines (slug, display_name, provider, model_id) values
  ('chatgpt', 'ChatGPT', 'openai', 'gpt-4o-search-preview'),
  ('claude', 'Claude', 'anthropic', 'claude-sonnet-5'),
  ('gemini', 'Gemini', 'google', 'gemini-2.5-pro'),
  ('perplexity', 'Perplexity', 'perplexity', 'sonar-pro');

-- ============================================================================
-- PROMPTS (buyer-intent queries generated + tracked per project)
-- ============================================================================

create table prompts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  text text not null,
  category text,
  source prompt_source not null default 'auto_generated',
  status prompt_status not null default 'active',
  intent_tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (project_id, text)
);

create index idx_prompts_project on prompts(project_id);
create index idx_prompts_status on prompts(project_id, status);

-- ============================================================================
-- PROMPT_RESULTS (one row per prompt x engine x run)
-- ============================================================================

create table prompt_results (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references prompts(id) on delete cascade,
  engine_id uuid not null references engines(id) on delete cascade,
  run_date date not null default current_date,
  mention_type mention_type not null default 'not_mentioned',
  rank_position int,
  raw_response text,
  response_summary text,
  mentioned_entities jsonb not null default '[]',
  -- [{ "name": "Competitor A", "is_project": false, "rank_position": 1, "sentiment": "positive" }]
  latency_ms int,
  tokens_used int,
  created_at timestamptz not null default now(),
  unique (prompt_id, engine_id, run_date)
);

create index idx_prompt_results_prompt on prompt_results(prompt_id);
create index idx_prompt_results_engine on prompt_results(engine_id);
create index idx_prompt_results_run_date on prompt_results(run_date);
create index idx_prompt_results_mentioned_entities on prompt_results using gin (mentioned_entities);

-- ============================================================================
-- VISIBILITY_SCORES (daily rollup per project, and per project+engine)
-- ============================================================================

create table visibility_scores (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  engine_id uuid references engines(id) on delete cascade, -- null = blended across all engines
  score_date date not null default current_date,
  visibility_score numeric(5,2) not null default 0, -- proprietary 0-100 score
  mention_frequency numeric(5,2) not null default 0, -- % of prompts where mentioned
  share_of_voice numeric(5,2) not null default 0, -- % of total mentions vs competitors
  avg_position numeric(5,2),
  prompts_tracked int not null default 0,
  prompts_mentioned int not null default 0,
  created_at timestamptz not null default now(),
  unique (project_id, engine_id, score_date)
);

create index idx_visibility_scores_project on visibility_scores(project_id, score_date desc);

-- ============================================================================
-- CITATIONS (sources AI answers cite/reference)
-- ============================================================================

create table citations (
  id uuid primary key default gen_random_uuid(),
  prompt_result_id uuid not null references prompt_results(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  domain text not null,
  url text,
  source_type citation_source_type not null default 'other',
  mentions_project boolean not null default false,
  mentions_competitor_id uuid references competitors(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_citations_project on citations(project_id);
create index idx_citations_domain on citations(domain);
create index idx_citations_source_type on citations(source_type);

-- ============================================================================
-- RECOMMENDATIONS (AI SEO recommendation engine output)
-- ============================================================================

create table recommendations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  description text not null,
  category text not null, -- e.g. 'comparison_page', 'integration_page', 'reddit_presence', 'glossary', 'directory', 'citation_building'
  impact_estimate text, -- 'high' | 'medium' | 'low'
  status text not null default 'open', -- 'open' | 'in_progress' | 'done' | 'dismissed'
  related_prompt_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create index idx_recommendations_project on recommendations(project_id, status);

-- ============================================================================
-- REPORTS
-- ============================================================================

create table reports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  report_type report_type not null default 'weekly',
  period_start date not null,
  period_end date not null,
  summary jsonb not null default '{}',
  pdf_url text,
  is_white_label boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_reports_project on reports(project_id, period_end desc);

-- ============================================================================
-- SUBSCRIPTIONS (Stripe mirror)
-- ============================================================================

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  stripe_subscription_id text unique,
  stripe_price_id text,
  plan_tier plan_tier not null,
  status subscription_status not null default 'trialing',
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  seats int not null default 1,
  projects_limit int not null default 1,
  prompts_limit int not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_subscriptions_org on subscriptions(organization_id);

-- ============================================================================
-- ALERTS
-- ============================================================================

create table alerts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  alert_type alert_type not null,
  channel alert_channel not null default 'email',
  title text not null,
  body text not null,
  metadata jsonb not null default '{}',
  is_read boolean not null default false,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_alerts_project on alerts(project_id, created_at desc);
create index idx_alerts_org_unread on alerts(organization_id) where is_read = false;

-- ============================================================================
-- REFERRALS (viral growth loop)
-- ============================================================================

create table referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_org_id uuid not null references organizations(id) on delete cascade,
  referral_code text not null unique,
  referred_email text,
  referred_org_id uuid references organizations(id) on delete set null,
  reward_granted boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_referrals_referrer on referrals(referrer_org_id);

-- ============================================================================
-- updated_at trigger
-- ============================================================================

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_organizations_updated_at before update on organizations
  for each row execute function set_updated_at();
create trigger trg_users_updated_at before update on users
  for each row execute function set_updated_at();
create trigger trg_projects_updated_at before update on projects
  for each row execute function set_updated_at();
create trigger trg_subscriptions_updated_at before update on subscriptions
  for each row execute function set_updated_at();
