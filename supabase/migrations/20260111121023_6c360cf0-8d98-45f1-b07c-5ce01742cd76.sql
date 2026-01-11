-- Fix Critical RLS Security Issues
-- Issue 1: Profiles table has conflicting SELECT policies (USING (true) overrides restrictive policy)
-- Issue 2: API keys table needs stricter RLS enforcement

-- ============================================
-- FIX 1: Remove conflicting public profile policy
-- ============================================

-- Drop the problematic public policy that exposes all profile data
DROP POLICY IF EXISTS "Public profiles viewable with limited fields" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Ensure only the owner-based policy remains
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- ============================================
-- FIX 2: Create restricted public view for social features
-- ============================================

-- Drop existing view if any
DROP VIEW IF EXISTS public.public_profiles;

-- Create view with ONLY public-safe columns (no PII)
CREATE VIEW public.public_profiles 
WITH (security_invoker = true) AS
SELECT 
    id,
    username,
    avatar_url
    -- Explicitly excludes: full_name, bio, flow_points, total_minutes_watched
FROM public.profiles;

-- Grant read access to the view
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- Add comment documenting the security fix
COMMENT ON VIEW public.public_profiles IS 
'Public-safe profile data. Use this view for browsing/social features. Full profile data requires authentication as the profile owner.';

-- ============================================
-- FIX 3: Strengthen API Keys RLS
-- ============================================

-- Ensure RLS is enabled
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Drop any overly permissive policies
DROP POLICY IF EXISTS "Anyone can view api_keys" ON public.api_keys;
DROP POLICY IF EXISTS "Public api_keys access" ON public.api_keys;

-- Ensure only developer can see their own keys
DROP POLICY IF EXISTS "Developers can view own API keys" ON public.api_keys;
CREATE POLICY "Developers can view own API keys"
ON public.api_keys FOR SELECT
USING (
    developer_id IN (
        SELECT id FROM public.developer_accounts 
        WHERE user_id = auth.uid()
    )
);

-- Ensure only developer can create their own keys
DROP POLICY IF EXISTS "Developers can create own API keys" ON public.api_keys;
CREATE POLICY "Developers can create own API keys"
ON public.api_keys FOR INSERT
WITH CHECK (
    developer_id IN (
        SELECT id FROM public.developer_accounts 
        WHERE user_id = auth.uid()
    )
);

-- Ensure only developer can update their own keys
DROP POLICY IF EXISTS "Developers can update own API keys" ON public.api_keys;
CREATE POLICY "Developers can update own API keys"
ON public.api_keys FOR UPDATE
USING (
    developer_id IN (
        SELECT id FROM public.developer_accounts 
        WHERE user_id = auth.uid()
    )
);

-- Ensure only developer can delete their own keys
DROP POLICY IF EXISTS "Developers can delete own API keys" ON public.api_keys;
CREATE POLICY "Developers can delete own API keys"
ON public.api_keys FOR DELETE
USING (
    developer_id IN (
        SELECT id FROM public.developer_accounts 
        WHERE user_id = auth.uid()
    )
);