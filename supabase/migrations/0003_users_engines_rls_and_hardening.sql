-- Closes a gap in 0002_rls.sql: `users` and `engines` were left without RLS,
-- which the Supabase security advisor flags as a critical exposure (any
-- caller with the anon key could read/write every row). `users` gets a
-- self-only policy; `engines` is static reference data, so it gets an
-- open-read policy. Also pins search_path on the three helper functions
-- per the advisor's function_search_path_mutable warning.

alter table public.users enable row level security;

create policy users_self_select on public.users for select
  using (id = current_user_id());
create policy users_self_update on public.users for update
  using (id = current_user_id());

alter table public.engines enable row level security;

create policy engines_public_read on public.engines for select
  using (true);

alter function public.set_updated_at() set search_path = '';
alter function public.current_user_id() set search_path = '';
alter function public.is_org_member(uuid) set search_path = '';
