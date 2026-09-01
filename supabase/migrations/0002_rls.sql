-- Row Level Security: every row is reachable only through an organization the
-- requesting user (Clerk id, exposed via request.jwt.claims ->> 'sub') belongs to.

alter table organizations enable row level security;
alter table organization_members enable row level security;
alter table projects enable row level security;
alter table competitors enable row level security;
alter table prompts enable row level security;
alter table prompt_results enable row level security;
alter table visibility_scores enable row level security;
alter table citations enable row level security;
alter table recommendations enable row level security;
alter table reports enable row level security;
alter table subscriptions enable row level security;
alter table alerts enable row level security;
alter table referrals enable row level security;

create or replace function current_user_id() returns text as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')
$$ language sql stable;

create or replace function is_org_member(org_id uuid) returns boolean as $$
  select exists (
    select 1 from organization_members m
    where m.organization_id = org_id and m.user_id = current_user_id()
  )
$$ language sql stable security definer;

create policy org_select on organizations for select
  using (is_org_member(id));
create policy org_update on organizations for update
  using (exists (
    select 1 from organization_members m
    where m.organization_id = id and m.user_id = current_user_id() and m.role in ('owner','admin')
  ));

create policy org_members_select on organization_members for select
  using (is_org_member(organization_id));

create policy projects_all on projects for all
  using (is_org_member(organization_id))
  with check (is_org_member(organization_id));

create policy competitors_all on competitors for all
  using (exists (select 1 from projects p where p.id = project_id and is_org_member(p.organization_id)))
  with check (exists (select 1 from projects p where p.id = project_id and is_org_member(p.organization_id)));

create policy prompts_all on prompts for all
  using (exists (select 1 from projects p where p.id = project_id and is_org_member(p.organization_id)))
  with check (exists (select 1 from projects p where p.id = project_id and is_org_member(p.organization_id)));

create policy prompt_results_select on prompt_results for select
  using (exists (
    select 1 from prompts pr join projects p on p.id = pr.project_id
    where pr.id = prompt_id and is_org_member(p.organization_id)
  ));

create policy visibility_scores_select on visibility_scores for select
  using (exists (select 1 from projects p where p.id = project_id and is_org_member(p.organization_id)));

create policy citations_select on citations for select
  using (exists (select 1 from projects p where p.id = project_id and is_org_member(p.organization_id)));

create policy recommendations_all on recommendations for all
  using (exists (select 1 from projects p where p.id = project_id and is_org_member(p.organization_id)))
  with check (exists (select 1 from projects p where p.id = project_id and is_org_member(p.organization_id)));

create policy reports_select on reports for select
  using (is_org_member(organization_id));

create policy subscriptions_select on subscriptions for select
  using (is_org_member(organization_id));

create policy alerts_all on alerts for all
  using (is_org_member(organization_id))
  with check (is_org_member(organization_id));

create policy referrals_select on referrals for select
  using (is_org_member(referrer_org_id));

-- Service-role bypasses RLS by default in Supabase; background jobs (prompt
-- runner, scoring, alerts) must use the service-role key, never the anon key.
