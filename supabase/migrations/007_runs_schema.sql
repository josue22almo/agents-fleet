CREATE TABLE runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL,
  external_run_id TEXT,
  status TEXT NOT NULL DEFAULT 'running',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  tokens_used INTEGER,
  cost DECIMAL(10,4),
  metadata JSONB,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- NOTE: No FK to agents table. The monitoring context treats agent_id as a plain
-- string per DDD context boundaries. Orphaned runs after agent deletion are acceptable.

CREATE INDEX idx_runs_agent ON runs(agent_id);
CREATE INDEX idx_runs_agent_started ON runs(agent_id, started_at DESC);
CREATE UNIQUE INDEX idx_runs_agent_external ON runs(agent_id, external_run_id);
