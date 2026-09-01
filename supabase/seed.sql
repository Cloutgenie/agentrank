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
