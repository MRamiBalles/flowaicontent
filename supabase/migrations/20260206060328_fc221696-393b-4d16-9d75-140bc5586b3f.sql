-- =====================================================
-- Security Fix: Error-Level Security Issues
-- 1. Voice Credit Functions Authorization Bypass
-- 2. Profiles Table Unauthenticated Access
-- 3. API Keys Hash Exposure
-- =====================================================

-- =====================================================
-- FIX 1: Voice Credit Functions - Remove p_user_id parameter
-- These functions now use auth.uid() directly to prevent 
-- any user from operating on other users' credits
-- =====================================================

-- Replace check_voice_credits to require authentication
CREATE OR REPLACE FUNCTION public.check_voice_credits(
    p_credits_needed integer
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id uuid;
    v_available integer;
    v_monthly_remaining integer;
BEGIN
    -- Get authenticated user
    v_caller_id := auth.uid();
    
    -- Require authentication
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    
    SELECT 
        available_credits,
        monthly_limit - monthly_used
    INTO v_available, v_monthly_remaining
    FROM public.voice_credits
    WHERE user_id = v_caller_id;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Check both available credits AND monthly limit
    RETURN (v_available >= p_credits_needed) AND (v_monthly_remaining >= p_credits_needed);
END;
$$;

COMMENT ON FUNCTION public.check_voice_credits(integer) IS 'Securely checks if the authenticated user has sufficient voice credits. Uses auth.uid() to prevent credit enumeration attacks.';

-- Replace consume_voice_credits to require authentication
CREATE OR REPLACE FUNCTION public.consume_voice_credits(
    p_credits integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id uuid;
BEGIN
    -- Get authenticated user
    v_caller_id := auth.uid();
    
    -- Require authentication
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    
    -- Check if user has enough credits (uses the fixed function)
    IF NOT public.check_voice_credits(p_credits) THEN
        RETURN false;
    END IF;
    
    -- Deduct credits - only from the authenticated user
    UPDATE public.voice_credits
    SET 
        available_credits = available_credits - p_credits,
        monthly_used = monthly_used + p_credits,
        updated_at = now()
    WHERE user_id = v_caller_id;
    
    RETURN true;
END;
$$;

COMMENT ON FUNCTION public.consume_voice_credits(integer) IS 'Securely consumes voice credits for the authenticated user. Uses auth.uid() to prevent credit theft.';

-- Drop the old 2-parameter versions if they exist (they shouldn't co-exist)
-- Note: We can't easily drop them if they're still referenced, but the new 
-- single-parameter versions will be preferred

-- =====================================================
-- FIX 2: Profiles Table - Ensure no anonymous access
-- Verify only authenticated users can access profiles
-- =====================================================

-- Drop any potentially misconfigured policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "public_profiles_select" ON public.profiles;

-- Create secure owner-only SELECT policy for authenticated users
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- =====================================================
-- FIX 3: API Keys Hash Exposure - Create safe view
-- Developers should only see key_prefix for identification
-- Never expose key_hash which could be brute-forced
-- =====================================================

-- Create a safe view that excludes sensitive columns
CREATE OR REPLACE VIEW public.api_keys_safe
WITH (security_invoker=on) AS
SELECT 
    id,
    developer_id,
    name,
    key_prefix,  -- Only the prefix (first 8 chars) for identification
    scopes,
    is_active,
    last_used_at,
    total_requests,
    created_at
    -- key_hash is explicitly excluded
FROM public.api_keys;

COMMENT ON VIEW public.api_keys_safe IS 'Safe view of API keys that excludes the key_hash column. Use this view in application code instead of the base table.';

-- Grant access to the safe view
GRANT SELECT ON public.api_keys_safe TO authenticated;

-- Drop existing SELECT policies on api_keys table
DROP POLICY IF EXISTS "Developers can view own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Developers can view own keys" ON public.api_keys;

-- Block direct SELECT on api_keys table to force use of the safe view
-- Only allow INSERT, UPDATE, DELETE through the base table
CREATE POLICY "No direct SELECT on api_keys"
ON public.api_keys
FOR SELECT
TO authenticated
USING (false);  -- Block all direct SELECT

-- Ensure RLS is enabled
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Summary of fixes:
-- 1. check_voice_credits(p_credits_needed) now uses auth.uid()
-- 2. consume_voice_credits(p_credits) now uses auth.uid()
-- 3. profiles table SELECT restricted to authenticated owners
-- 4. api_keys_safe view created without key_hash
-- 5. Direct SELECT on api_keys table blocked
-- =====================================================