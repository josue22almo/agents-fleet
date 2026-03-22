-- Add FK from agents to organizations

ALTER TABLE agents
  ADD CONSTRAINT agents_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
