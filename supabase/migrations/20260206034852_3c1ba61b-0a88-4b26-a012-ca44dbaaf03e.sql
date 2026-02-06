-- Fix profiles table public exposure - ensure only owners can view their own profile
-- And ensure public_profiles view is properly set up for public access

-- First, drop any overly permissive policies on profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "public_profiles_select" ON public.profiles;

-- Ensure the correct owner-based policy exists
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Ensure authenticated users can still see limited public profile data through the view
-- The public_profiles view should already exist from previous migration, but let's ensure it's properly configured

-- Grant access to the public_profiles view
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- Add a comment explaining the security model
COMMENT ON TABLE public.profiles IS 'Private user profiles - access restricted to profile owner. Use public_profiles view for public data.';
COMMENT ON VIEW public.public_profiles IS 'Public-safe profile data (id, username, avatar_url only). Safe for display in UI.';

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;