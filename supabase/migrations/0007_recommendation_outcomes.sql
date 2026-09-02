-- Closes the loop the whole product is supposed to run on: recommendation
-- -> action taken -> did visibility actually move. Without this, "AI SEO
-- recommendations" is just an opinionated checklist; with it, AgentRank
-- accumulates the one dataset competitors can't get from reading public
-- API docs — real before/after evidence of which interventions work.

create table recommendation_outcomes (
  id uuid primary key default gen_random_uuid(),
  recommendation_id uuid not null references recommendations(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  action_type text not null, -- 'manual' | 'cursor_agent'
  actioned_at timestamptz not null default now(),
  score_before numeric(5,2) not null,
  score_before_date date not null,
  score_after numeric(5,2),
  score_after_date date,
  measured_at timestamptz,
  created_at timestamptz not null default now(),
  unique (recommendation_id)
);

create index idx_recommendation_outcomes_project on recommendation_outcomes(project_id);

alter table recommendation_outcomes enable row level security;

create policy recommendation_outcomes_all on recommendation_outcomes for all
  using (exists (select 1 from projects p where p.id = project_id and is_org_member(p.organization_id)))
  with check (exists (select 1 from projects p where p.id = project_id and is_org_member(p.organization_id)));
