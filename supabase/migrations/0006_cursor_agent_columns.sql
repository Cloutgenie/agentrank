-- Tracks a Cursor Background Agent run launched to auto-implement a
-- recommendation, so the UI can show progress and link the resulting PR.
alter table recommendations
  add column cursor_agent_id text,
  add column cursor_run_id text,
  add column cursor_status text,
  add column cursor_pr_url text;
