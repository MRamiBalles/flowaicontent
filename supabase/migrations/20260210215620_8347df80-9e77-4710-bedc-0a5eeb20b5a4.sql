-- Fix: Recreate public_profiles view with security_invoker=on
DROP VIEW IF EXISTS public_profiles;
CREATE VIEW public_profiles
WITH (security_invoker=on) AS
SELECT id, username, avatar_url
FROM profiles;

-- Grant select on the view to authenticated users
GRANT SELECT ON public_profiles TO authenticated;

-- Revoke from anon to prevent unauthenticated scraping
REVOKE SELECT ON public_profiles FROM anon;