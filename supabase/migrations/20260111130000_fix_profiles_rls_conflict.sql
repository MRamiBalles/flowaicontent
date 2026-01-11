-- ==========================================
-- Security Fix: Remove Conflicting RLS Policies on profiles
-- Migration: 20260111130000_fix_profiles_rls_conflict.sql
-- Issue: Two SELECT policies combined with OR expose all profiles
-- ==========================================

-- Step 1: Drop the conflicting permissive policy
DROP POLICY IF EXISTS "Public profiles viewable with limited fields" ON public.profiles;

-- Step 2: Keep ONLY the restrictive owner-based policy
-- "Users can view their own profile" (auth.uid() = id) remains active

-- Step 3: Create a secure VIEW for public profile information
-- This allows limited fields to be visible without compromising RLS
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
    id,
    username,
    avatar_url
    -- EXCLUDED: full_name, bio, flow_points, total_minutes_watched, email
FROM public.profiles;

-- Step 4: Grant SELECT on the view to authenticated and anon roles
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- Step 5: Add comment documenting the security fix
COMMENT ON VIEW public.public_profiles IS 
    'Public-safe view of profiles exposing only username and avatar. ' ||
    'Created to fix RLS policy conflict where USING(true) overrode auth.uid()=id. ' ||
    'Full profile data remains protected by RLS on profiles table.';

-- Step 6: Audit log for compliance
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs' AND table_schema = 'public') THEN
        INSERT INTO public.audit_logs (action, table_name, details, created_at)
        VALUES (
            'SECURITY_FIX',
            'profiles',
            'Removed conflicting SELECT policy "Public profiles viewable with limited fields" that exposed full_name, bio, flow_points, total_minutes_watched. Created public_profiles view for safe public access.',
            NOW()
        );
    END IF;
END $$;
