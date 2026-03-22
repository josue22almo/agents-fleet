-- Add FK from runs to agents

ALTER TABLE runs
  ADD CONSTRAINT runs_agent_id_fkey
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;
