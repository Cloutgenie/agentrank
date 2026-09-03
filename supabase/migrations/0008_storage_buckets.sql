-- Storage buckets for generated report PDFs and agency white-label logos.
-- Public read (report/logo URLs are used directly as <img src> / download
-- links with no auth check) with unguessable UUID-based paths; all writes
-- go through the service-role key from server actions/cron, same as every
-- other write path in this app, so no object-level RLS policy is needed.
insert into storage.buckets (id, name, public)
values
  ('reports', 'reports', true),
  ('org-logos', 'org-logos', true)
on conflict (id) do nothing;
