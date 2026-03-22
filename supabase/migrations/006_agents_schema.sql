CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'custom',
  token_hash TEXT NOT NULL,
  token_prefix TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'inactive',
  last_seen_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_agents_org ON agents(organization_id);
CREATE INDEX idx_agents_token_hash ON agents(token_hash);
