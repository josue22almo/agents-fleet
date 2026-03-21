-- Fix RLS infinite recursion v2
-- PostgreSQL evaluates RLS policies on every table access, including
-- subqueries within the policy itself. A policy on organization_members
-- that queries organization_members causes infinite recursion.
--
-- Solution: use a SECURITY DEFINER function that bypasses RLS to check
-- membership, breaking the recursion.

-- =============================================================================
-- Helper function: check if user is a member of an org (bypasses RLS)
-- =============================================================================

CREATE OR REPLACE FUNCTION is_org_member(org_id UUID, uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id AND user_id = uid
  );
$$;

CREATE OR REPLACE FUNCTION get_user_org_role(org_id UUID, uid UUID)
RETURNS member_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM organization_members
  WHERE organization_id = org_id AND user_id = uid
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION get_user_org_ids(uid UUID)
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT organization_id FROM organization_members
  WHERE user_id = uid;
$$;

-- =============================================================================
-- Drop all existing organization_members policies
-- =============================================================================

DROP POLICY IF EXISTS "Members can read org members" ON organization_members;
DROP POLICY IF EXISTS "Owners and admins can add members" ON organization_members;
DROP POLICY IF EXISTS "Owners and admins can update member roles" ON organization_members;
DROP POLICY IF EXISTS "Owners can remove members" ON organization_members;

-- =============================================================================
-- Recreate organization_members policies using helper functions
-- =============================================================================

CREATE POLICY "Members can read org members"
  ON organization_members FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));

CREATE POLICY "Owners and admins can add members"
  ON organization_members FOR INSERT
  WITH CHECK (
    -- First member of a new org (no existing members)
    NOT EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = organization_members.organization_id)
    OR
    -- Existing owner/admin
    get_user_org_role(organization_id, auth.uid()) IN ('owner', 'admin')
  );

CREATE POLICY "Owners and admins can update member roles"
  ON organization_members FOR UPDATE
  USING (get_user_org_role(organization_id, auth.uid()) IN ('owner', 'admin'));

CREATE POLICY "Owners can remove members"
  ON organization_members FOR DELETE
  USING (get_user_org_role(organization_id, auth.uid()) = 'owner');

-- =============================================================================
-- Also fix organizations policies to use helper functions
-- =============================================================================

DROP POLICY IF EXISTS "Members can read their organizations" ON organizations;
DROP POLICY IF EXISTS "Owners and admins can update organizations" ON organizations;
DROP POLICY IF EXISTS "Owners can delete organizations" ON organizations;

CREATE POLICY "Members can read their organizations"
  ON organizations FOR SELECT
  USING (is_org_member(id, auth.uid()));

CREATE POLICY "Owners and admins can update organizations"
  ON organizations FOR UPDATE
  USING (get_user_org_role(id, auth.uid()) IN ('owner', 'admin'));

CREATE POLICY "Owners can delete organizations"
  ON organizations FOR DELETE
  USING (get_user_org_role(id, auth.uid()) = 'owner');

-- =============================================================================
-- Fix invitations policies to use helper functions
-- =============================================================================

DROP POLICY IF EXISTS "Owners and admins can create invitations" ON invitations;

CREATE POLICY "Owners and admins can create invitations"
  ON invitations FOR INSERT
  WITH CHECK (get_user_org_role(organization_id, auth.uid()) IN ('owner', 'admin'));
