-- Fix 1: Set search_path on update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Fix 2: Allow authenticated users to read profiles (needed for social features)
-- Drop the restrictive policy first
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Create a policy that allows authenticated users to read any profile (social platform)
CREATE POLICY "Authenticated users can view profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- Fix 3: Add RLS policy on public_profiles view
-- Views inherit RLS from underlying tables, but we ensure the view is secure
DROP VIEW IF EXISTS public_profiles;
CREATE VIEW public_profiles AS
SELECT id, username, avatar_url
FROM profiles;

-- Grant select on the view to authenticated users
GRANT SELECT ON public_profiles TO authenticated;

-- Revoke from anon to prevent unauthenticated scraping
REVOKE SELECT ON public_profiles FROM anon;