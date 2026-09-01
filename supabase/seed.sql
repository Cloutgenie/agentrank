-- Local dev seed: one agency org, one demo project, a competitor, and a
-- handful of prompts so `npm run dev` has data to render immediately.

insert into organizations (id, name, slug, plan_tier) values
  ('00000000-0000-0000-0000-000000000001', 'Demo Agency', 'demo-agency', 'agency');

insert into projects (id, organization_id, name, slug, website_url, industry) values
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001',
   'AgentRank', 'agentrank', 'https://agentrank.ai', 'B2B SaaS / Analytics');

insert into competitors (project_id, name, website_url, is_primary) values
  ('00000000-0000-0000-0000-000000000010', 'Profound', 'https://tryprofound.com', true),
  ('00000000-0000-0000-0000-000000000010', 'Otterly.AI', 'https://otterly.ai', false),
  ('00000000-0000-0000-0000-000000000010', 'Peec AI', 'https://peec.ai', false);

insert into prompts (project_id, text, category, source) values
  ('00000000-0000-0000-0000-000000000010', 'best AI search visibility tracking tool', 'category', 'auto_generated'),
  ('00000000-0000-0000-0000-000000000010', 'how do I track if ChatGPT recommends my company', 'brand_monitoring', 'auto_generated'),
  ('00000000-0000-0000-0000-000000000010', 'tools to monitor brand mentions in AI answers', 'category', 'auto_generated'),
  ('00000000-0000-0000-0000-000000000010', 'best Ahrefs alternative for AI search', 'comparison', 'auto_generated');

-- ============================================================================
-- Mocked run results — stands in for a real lib/runner.ts pass so the
-- dashboard has real rows to render via lib/queries.ts from a clean seed.
-- ============================================================================

-- Blended (engine_id null) trend for the last 5 weeks
insert into visibility_scores (project_id, engine_id, score_date, visibility_score, mention_frequency, share_of_voice, avg_position, prompts_tracked, prompts_mentioned) values
  ('00000000-0000-0000-0000-000000000010', null, current_date - interval '28 days', 28, 40, 24, 2.8, 4, 2),
  ('00000000-0000-0000-0000-000000000010', null, current_date - interval '21 days', 31, 44, 27, 2.6, 4, 2),
  ('00000000-0000-0000-0000-000000000010', null, current_date - interval '14 days', 30, 42, 26, 2.7, 4, 2),
  ('00000000-0000-0000-0000-000000000010', null, current_date - interval '7 days', 35, 48, 29, 2.3, 4, 2),
  ('00000000-0000-0000-0000-000000000010', null, current_date, 40, 53.5, 31, 2.1, 4, 3);

-- Per-engine current scores
insert into visibility_scores (project_id, engine_id, score_date, visibility_score, mention_frequency, share_of_voice, avg_position, prompts_tracked, prompts_mentioned)
select '00000000-0000-0000-0000-000000000010', id, current_date, v.score, v.freq, v.sov, v.pos, 4, v.mentioned
from engines, (values
  ('chatgpt', 43, 58, 33, 2.4, 2),
  ('claude', 37, 49, 29, 2.6, 2),
  ('gemini', 29, 41, 22, 3.1, 2),
  ('perplexity', 51, 66, 36, 1.8, 3)
) as v(slug, score, freq, sov, pos, mentioned)
where engines.slug = v.slug::engine_slug;

-- One prompt_results row per (prompt, engine)
with p as (
  select id, text from prompts where project_id = '00000000-0000-0000-0000-000000000010'
),
e as (
  select id, slug from engines
),
matrix(prompt_text, engine_slug, mention_type, rank_position, entities) as (
  values
    ('best AI search visibility tracking tool', 'perplexity', 'top_pick', 1, '[{"name":"AgentRank","is_project":true,"rank_position":1,"sentiment":"positive"},{"name":"Profound","is_project":false,"rank_position":2,"sentiment":"neutral"}]'),
    ('best AI search visibility tracking tool', 'chatgpt', 'mentioned', 3, '[{"name":"Profound","is_project":false,"rank_position":1,"sentiment":"positive"},{"name":"Otterly.AI","is_project":false,"rank_position":2,"sentiment":"neutral"},{"name":"AgentRank","is_project":true,"rank_position":3,"sentiment":"neutral"}]'),
    ('best AI search visibility tracking tool', 'claude', 'mentioned', 2, '[{"name":"AgentRank","is_project":true,"rank_position":2,"sentiment":"positive"},{"name":"Profound","is_project":false,"rank_position":1,"sentiment":"positive"}]'),
    ('best AI search visibility tracking tool', 'gemini', 'not_mentioned', null, '[{"name":"Profound","is_project":false,"rank_position":1,"sentiment":"neutral"},{"name":"Peec AI","is_project":false,"rank_position":2,"sentiment":"neutral"}]'),

    ('how do I track if ChatGPT recommends my company', 'chatgpt', 'mentioned', 3, '[{"name":"Otterly.AI","is_project":false,"rank_position":1,"sentiment":"positive"},{"name":"Profound","is_project":false,"rank_position":2,"sentiment":"neutral"},{"name":"AgentRank","is_project":true,"rank_position":3,"sentiment":"neutral"}]'),
    ('how do I track if ChatGPT recommends my company', 'perplexity', 'mentioned', 2, '[{"name":"Profound","is_project":false,"rank_position":1,"sentiment":"positive"},{"name":"AgentRank","is_project":true,"rank_position":2,"sentiment":"positive"}]'),
    ('how do I track if ChatGPT recommends my company', 'claude', 'mentioned', 4, '[{"name":"Profound","is_project":false,"rank_position":1,"sentiment":"positive"},{"name":"Otterly.AI","is_project":false,"rank_position":2,"sentiment":"neutral"},{"name":"Peec AI","is_project":false,"rank_position":3,"sentiment":"neutral"},{"name":"AgentRank","is_project":true,"rank_position":4,"sentiment":"neutral"}]'),
    ('how do I track if ChatGPT recommends my company', 'gemini', 'not_mentioned', null, '[{"name":"Otterly.AI","is_project":false,"rank_position":1,"sentiment":"neutral"}]'),

    ('tools to monitor brand mentions in AI answers', 'perplexity', 'mentioned', 2, '[{"name":"Profound","is_project":false,"rank_position":1,"sentiment":"positive"},{"name":"AgentRank","is_project":true,"rank_position":2,"sentiment":"positive"}]'),
    ('tools to monitor brand mentions in AI answers', 'claude', 'mentioned', 3, '[{"name":"Profound","is_project":false,"rank_position":1,"sentiment":"positive"},{"name":"Otterly.AI","is_project":false,"rank_position":2,"sentiment":"neutral"},{"name":"AgentRank","is_project":true,"rank_position":3,"sentiment":"neutral"}]'),
    ('tools to monitor brand mentions in AI answers', 'chatgpt', 'mentioned', 4, '[{"name":"Profound","is_project":false,"rank_position":1,"sentiment":"positive"},{"name":"Otterly.AI","is_project":false,"rank_position":2,"sentiment":"positive"},{"name":"Peec AI","is_project":false,"rank_position":3,"sentiment":"neutral"},{"name":"AgentRank","is_project":true,"rank_position":4,"sentiment":"neutral"}]'),
    ('tools to monitor brand mentions in AI answers', 'gemini', 'not_mentioned', null, '[{"name":"Profound","is_project":false,"rank_position":1,"sentiment":"neutral"}]'),

    ('best Ahrefs alternative for AI search', 'perplexity', 'top_pick', 1, '[{"name":"AgentRank","is_project":true,"rank_position":1,"sentiment":"positive"},{"name":"Otterly.AI","is_project":false,"rank_position":2,"sentiment":"neutral"}]'),
    ('best Ahrefs alternative for AI search', 'claude', 'mentioned', 2, '[{"name":"Profound","is_project":false,"rank_position":1,"sentiment":"positive"},{"name":"AgentRank","is_project":true,"rank_position":2,"sentiment":"positive"}]'),
    ('best Ahrefs alternative for AI search', 'chatgpt', 'mentioned', 4, '[{"name":"Profound","is_project":false,"rank_position":1,"sentiment":"positive"},{"name":"Otterly.AI","is_project":false,"rank_position":2,"sentiment":"neutral"},{"name":"Peec AI","is_project":false,"rank_position":3,"sentiment":"neutral"},{"name":"AgentRank","is_project":true,"rank_position":4,"sentiment":"neutral"}]'),
    ('best Ahrefs alternative for AI search', 'gemini', 'not_mentioned', null, '[{"name":"Profound","is_project":false,"rank_position":1,"sentiment":"neutral"},{"name":"Otterly.AI","is_project":false,"rank_position":2,"sentiment":"neutral"}]')
)
insert into prompt_results (prompt_id, engine_id, run_date, mention_type, rank_position, mentioned_entities, latency_ms)
select p.id, e.id, current_date, m.mention_type::mention_type, m.rank_position, m.entities::jsonb, 900 + (random() * 1200)::int
from matrix m
join p on p.text = m.prompt_text
join e on e.slug = m.engine_slug::engine_slug;

-- Citations distributed across the prompt_results rows above, weighted
-- toward reddit.com/g2.com to match the "AI models rely on Reddit" story.
with pr as (
  select id, row_number() over (order by created_at, engine_id) as rn
  from prompt_results
  where prompt_id in (select id from prompts where project_id = '00000000-0000-0000-0000-000000000010')
),
total as (select count(*) as n from pr),
domains(domain, source_type, weight) as (
  values ('reddit.com','reddit',14), ('g2.com','g2',9), ('trustpilot.com','trustpilot',6), ('techcrunch.com','news',4), ('github.com','github',3)
),
expanded as (
  select domain, source_type, row_number() over () as n
  from domains, lateral generate_series(1, weight)
)
insert into citations (prompt_result_id, project_id, domain, source_type, mentions_project)
select pr.id, '00000000-0000-0000-0000-000000000010', e.domain, e.source_type::citation_source_type, (random() < 0.35)
from expanded e
join total on true
join pr on pr.rn = ((e.n - 1) % total.n) + 1;

insert into recommendations (project_id, title, description, category, impact_estimate, related_prompt_ids) values
  ('00000000-0000-0000-0000-000000000010',
   'Publish "AgentRank vs Profound" comparison page',
   'You''re mentioned alongside Profound in most tracked prompts but don''t have a page targeting that comparison directly.',
   'comparison_page', 'high', '{}'),
  ('00000000-0000-0000-0000-000000000010',
   'Earn more Reddit mentions in r/SaaS and r/marketing',
   'Reddit is your single most-cited domain across tracked prompts — prioritize earning mentions there before writing more owned-domain content.',
   'reddit_presence', 'high', '{}'),
  ('00000000-0000-0000-0000-000000000010',
   'Build an AI search glossary page',
   'Definitional prompts like "what is AI visibility" currently favor competitors who have published glossary content.',
   'glossary', 'medium', '{}');

insert into alerts (project_id, organization_id, alert_type, channel, title, body) values
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001',
   'visibility_lost', 'email', 'You lost visibility in Gemini', 'Mention frequency dropped this week — Gemini did not mention AgentRank in any tracked prompt.'),
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001',
   'competitor_overtook', 'email', 'Profound overtook you in Claude', 'For "how do I track if ChatGPT recommends my company", Profound now ranks above AgentRank.'),
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001',
   'visibility_gained', 'in_app', 'You gained visibility in Perplexity', 'AgentRank is now the top pick for 2 of 4 tracked prompts in Perplexity.');
