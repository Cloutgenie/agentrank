-- The blended (engine_id is null) row for a given project+day was never
-- actually deduplicated: standard SQL treats every NULL as distinct from
-- every other NULL in a UNIQUE constraint, so the runner's
-- onConflict: "project_id,engine_id,score_date" upsert silently inserted a
-- new row instead of overwriting whenever the blended score was recomputed
-- more than once on the same day. Per-engine rows (engine_id is a real
-- UUID) were never affected. Confirmed live: 4-5 duplicate rows per project
-- accumulated during a single day of re-triggered tracking runs, making
-- "get the latest score" queries non-deterministic among same-day ties.

-- Keep only the most-recently-created row per (project_id, score_date)
-- among the currently-duplicated blended rows before tightening the
-- constraint.
delete from visibility_scores vs
using visibility_scores newer
where vs.engine_id is null
  and newer.engine_id is null
  and vs.project_id = newer.project_id
  and vs.score_date = newer.score_date
  and vs.created_at < newer.created_at;

alter table visibility_scores drop constraint visibility_scores_project_id_engine_id_score_date_key;

create unique index visibility_scores_project_id_engine_id_score_date_key
  on visibility_scores (project_id, engine_id, score_date) nulls not distinct;
