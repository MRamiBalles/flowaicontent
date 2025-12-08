-- ==========================================
-- Fix: Add Public SELECT Policy for Profiles
-- ==========================================
-- Issue: The profiles table only allows users to view their own profile,
-- which breaks social features like:
--   - Comments displaying usernames
--   - Creator profiles in marketplace
--   - Showing who you're following
--
-- Solution: Add a public SELECT policy to allow anyone to view profiles
-- while keeping UPDATE and INSERT policies restricted to profile owners.

-- First, drop the overly restrictive policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Add new public SELECT policy for basic profile information
-- This enables social features while maintaining security
CREATE POLICY "Anyone can view profiles"
  ON public.profiles FOR SELECT
  USING (true);

-- Comment: UPDATE and INSERT policies remain unchanged:
-- - "Users can update own profile" - Only owners can update
-- - "Users can insert own profile" - Only owners can create
