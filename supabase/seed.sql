-- =============================================================================
-- SEED DATA: Test users and organizations
-- Run with service_role key (bypasses RLS)
-- =============================================================================

-- NOTE: Users must be created via Supabase Auth API (auth.users triggers
-- the handle_new_user() function which auto-creates profiles + personal orgs).
-- Use the companion script below to create auth users first, then run this
-- file to add team orgs, memberships, and invitations.
--
-- Test users (create via Supabase dashboard or API):
--   1. alice@test.com / password123  (owner of Acme Corp)
--   2. bob@test.com   / password123  (admin of Acme Corp)
--   3. carol@test.com / password123  (member of Acme Corp)
--   4. dave@test.com  / password123  (no team org, only personal)

-- =============================================================================
-- After creating the 4 test users via Auth, get their IDs and replace below:
-- =============================================================================

-- Uncomment and replace with actual UUIDs after creating users:

-- \set alice_id '''<alice-uuid>'''
-- \set bob_id '''<bob-uuid>'''
-- \set carol_id '''<carol-uuid>'''
-- \set dave_id '''<dave-uuid>'''

-- =============================================================================
-- TEAM ORGANIZATION: Acme Corp
-- =============================================================================

-- INSERT INTO organizations (id, name, slug, type)
-- VALUES (
--   'a0000000-0000-0000-0000-000000000001',
--   'Acme Corp',
--   'acme-corp',
--   'team'
-- );

-- -- Alice is owner
-- INSERT INTO organization_members (organization_id, user_id, role)
-- VALUES ('a0000000-0000-0000-0000-000000000001', :alice_id, 'owner');

-- -- Bob is admin
-- INSERT INTO organization_members (organization_id, user_id, role)
-- VALUES ('a0000000-0000-0000-0000-000000000001', :bob_id, 'admin');

-- -- Carol is member
-- INSERT INTO organization_members (organization_id, user_id, role)
-- VALUES ('a0000000-0000-0000-0000-000000000001', :carol_id, 'member');

-- =============================================================================
-- TEAM ORGANIZATION: Startup Labs
-- =============================================================================

-- INSERT INTO organizations (id, name, slug, type)
-- VALUES (
--   'a0000000-0000-0000-0000-000000000002',
--   'Startup Labs',
--   'startup-labs',
--   'team'
-- );

-- -- Alice is owner of this org too
-- INSERT INTO organization_members (organization_id, user_id, role)
-- VALUES ('a0000000-0000-0000-0000-000000000002', :alice_id, 'owner');

-- -- Bob is member here
-- INSERT INTO organization_members (organization_id, user_id, role)
-- VALUES ('a0000000-0000-0000-0000-000000000002', :bob_id, 'member');

-- =============================================================================
-- PENDING INVITATION
-- =============================================================================

-- -- Dave is invited to Acme Corp by Alice
-- INSERT INTO invitations (organization_id, email, role, token, invited_by, status, expires_at)
-- VALUES (
--   'a0000000-0000-0000-0000-000000000001',
--   'dave@test.com',
--   'member',
--   'test-invite-token-001',
--   :alice_id,
--   'pending',
--   now() + interval '7 days'
-- );

-- -- Expired invitation for testing
-- INSERT INTO invitations (organization_id, email, role, token, invited_by, status, expires_at)
-- VALUES (
--   'a0000000-0000-0000-0000-000000000001',
--   'expired@test.com',
--   'member',
--   'test-invite-token-expired',
--   :alice_id,
--   'pending',
--   now() - interval '1 day'
-- );
