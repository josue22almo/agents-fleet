-- Remove the auto-create profile + personal org trigger
-- This logic is now handled by the application layer via event handlers:
--   - CreateProfileOnUserSignedUpEventHandler
--   - CreatePersonalOrgOnUserSignedUpEventHandler

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
