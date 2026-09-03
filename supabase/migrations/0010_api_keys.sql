-- Public API access (Growth+) — "API access" pricing claim had no backing
-- endpoint or key infrastructure at all. Only a hash of the key is ever
-- stored; key_prefix is just enough of the raw key (shown once at creation)
-- to let a user identify which key is which in the Settings list later.
create table api_keys (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  key_hash text not null unique,
  key_prefix text not null,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_api_keys_org on api_keys(organization_id);
create index idx_api_keys_hash_active on api_keys(key_hash) where revoked_at is null;

alter table api_keys enable row level security;

create policy api_keys_all on api_keys
  for all using (is_org_member(organization_id));
