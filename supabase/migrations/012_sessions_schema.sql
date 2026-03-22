CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  total_duration_ms INTEGER,
  total_tokens_used INTEGER,
  total_cost DECIMAL(10,4),
  run_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE runs ADD COLUMN session_id UUID REFERENCES sessions(id) ON DELETE SET NULL;
CREATE INDEX idx_sessions_agent ON sessions(agent_id);
CREATE INDEX idx_runs_session ON runs(session_id);
