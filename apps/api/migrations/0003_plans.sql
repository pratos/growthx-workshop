-- The orchestrator's view of the plan rooms: every plan anyone has opened, who opened it, when it was last active,
-- and who is in it now. Each plan is its own Durable Object (PlanRoom); this table is how the main app knows them.
-- Additive only: a new table.
CREATE TABLE IF NOT EXISTS plans (
  plan_id TEXT PRIMARY KEY,
  opened_by TEXT NOT NULL,
  opened_at TEXT NOT NULL,
  last_active_at TEXT NOT NULL,
  here TEXT NOT NULL DEFAULT '[]'
);
