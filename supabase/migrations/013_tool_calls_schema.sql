CREATE TABLE tool_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES runs(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  duration_ms INTEGER,
  success BOOLEAN NOT NULL DEFAULT true,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tool_calls_agent ON tool_calls(agent_id);
CREATE INDEX idx_tool_calls_run ON tool_calls(run_id);
