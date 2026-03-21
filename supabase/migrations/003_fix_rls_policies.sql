-- Fix RLS policies
-- 1. Fix infinite recursion on organization_members SELECT
-- 2. Add profiles INSERT policy for authenticated users
-- 3. Fix organization_members INSERT for first member (personal org)

-- =============================================================================
-- FIX: organization_members SELECT (infinite recursion)
-- The old policy queried organization_members from within itself.
-- Fix: use a subquery on organization_id directly.
-- =============================================================================

DROP POLICY IF EXISTS "Members can read org members" ON organization_members;
CREATE POLICY "Members can read org members"
  ON organization_members FOR SELECT
  USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid()
    )
  );

-- =============================================================================
-- FIX: organization_members INSERT (infinite recursion on first member)
-- The old policy checked if user is owner/admin, but for a new org there
-- are no members yet. Fix: allow insert if user is the org creator (no
-- existing members) OR if user is owner/admin.
-- =============================================================================

DROP POLICY IF EXISTS "Owners and admins can add members" ON organization_members;
CREATE POLICY "Owners and admins can add members"
  ON organization_members FOR INSERT
  WITH CHECK (
    -- Allow first member (creator) of an org
    NOT EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
    )
    OR
    -- Allow owners/admins to add subsequent members
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- =============================================================================
-- FIX: organization_members UPDATE (infinite recursion)
-- =============================================================================

DROP POLICY IF EXISTS "Owners and admins can update member roles" ON organization_members;
CREATE POLICY "Owners and admins can update member roles"
  ON organization_members FOR UPDATE
  USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- =============================================================================
-- FIX: organization_members DELETE (infinite recursion)
-- =============================================================================

DROP POLICY IF EXISTS "Owners can remove members" ON organization_members;
CREATE POLICY "Owners can remove members"
  ON organization_members FOR DELETE
  USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.role = 'owner'
    )
  );

-- =============================================================================
-- ADD: profiles INSERT policy
-- Authenticated users can create their own profile
-- =============================================================================

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
