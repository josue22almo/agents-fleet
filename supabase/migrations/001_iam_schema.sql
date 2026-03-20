-- IAM Schema: Multi-tenant support
-- Enums, tables, triggers, and RLS policies

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE org_type AS ENUM ('individual', 'team');
CREATE TYPE member_role AS ENUM ('owner', 'admin', 'member');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'declined');

-- =============================================================================
-- TABLES
-- =============================================================================

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  type org_type NOT NULL DEFAULT 'team',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);

-- Organization Members
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role member_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_organization_members_org ON organization_members(organization_id);
CREATE INDEX idx_organization_members_user ON organization_members(user_id);

-- Invitations
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role member_role NOT NULL DEFAULT 'member',
  token TEXT NOT NULL UNIQUE,
  invited_by UUID NOT NULL REFERENCES profiles(id),
  status invitation_status NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_org_email ON invitations(organization_id, email);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-create profile + personal org on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
  new_member_id UUID;
  display_name TEXT;
BEGIN
  -- Extract display name from email prefix
  display_name := split_part(NEW.email, '@', 1);

  -- Create profile
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', display_name));

  -- Create personal organization
  new_org_id := gen_random_uuid();
  INSERT INTO organizations (id, name, slug, type)
  VALUES (
    new_org_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', display_name) || '''s Space',
    lower(regexp_replace(COALESCE(NEW.raw_user_meta_data->>'full_name', display_name), '[^a-z0-9]+', '-', 'gi')) || '-personal-' || substr(NEW.id::text, 1, 8),
    'individual'
  );

  -- Add user as owner
  INSERT INTO organization_members (organization_id, user_id, role)
  VALUES (new_org_id, NEW.id, 'owner');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Organizations: users can see orgs they belong to
CREATE POLICY "Members can read their organizations"
  ON organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
    )
  );

-- Organizations: owners/admins can update
CREATE POLICY "Owners and admins can update organizations"
  ON organizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

-- Organizations: owners can delete
CREATE POLICY "Owners can delete organizations"
  ON organizations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'owner'
    )
  );

-- Organizations: authenticated users can create
CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Organization Members: members can see other members of their orgs
CREATE POLICY "Members can read org members"
  ON organization_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members AS my_membership
      WHERE my_membership.organization_id = organization_members.organization_id
      AND my_membership.user_id = auth.uid()
    )
  );

-- Organization Members: owners/admins can insert (invite)
CREATE POLICY "Owners and admins can add members"
  ON organization_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members AS my_membership
      WHERE my_membership.organization_id = organization_members.organization_id
      AND my_membership.user_id = auth.uid()
      AND my_membership.role IN ('owner', 'admin')
    )
  );

-- Organization Members: owners/admins can update roles
CREATE POLICY "Owners and admins can update member roles"
  ON organization_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members AS my_membership
      WHERE my_membership.organization_id = organization_members.organization_id
      AND my_membership.user_id = auth.uid()
      AND my_membership.role IN ('owner', 'admin')
    )
  );

-- Organization Members: owners can remove members
CREATE POLICY "Owners can remove members"
  ON organization_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members AS my_membership
      WHERE my_membership.organization_id = organization_members.organization_id
      AND my_membership.user_id = auth.uid()
      AND my_membership.role = 'owner'
    )
  );

-- Invitations: anyone can read by token (for accept/decline flow)
CREATE POLICY "Anyone can read invitations by token"
  ON invitations FOR SELECT
  USING (true);

-- Invitations: owners/admins can create
CREATE POLICY "Owners and admins can create invitations"
  ON invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = invitations.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

-- Invitations: status can be updated (accept/decline)
CREATE POLICY "Invitations can be updated"
  ON invitations FOR UPDATE
  USING (true)
  WITH CHECK (true);
