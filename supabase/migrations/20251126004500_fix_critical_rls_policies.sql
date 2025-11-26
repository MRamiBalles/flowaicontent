-- Migration: Fix Critical RLS Policy Vulnerabilities
-- Date: 2025-11-26
-- Description: Removes unrestricted access policies on nft_shares, nft_transactions, and creator_earnings
-- Security Impact: CRITICAL - Prevents unauthorized manipulation of NFT ownership, transactions, and earnings

-- =========================================
-- 1. NFT Shares Table - Fix Unrestricted Access
-- =========================================
-- Drop the dangerous policy that allows ALL operations
DROP POLICY IF EXISTS "System can manage NFT shares" ON nft_shares;

-- Add read-only policy for users to view their own shares
CREATE POLICY "Users can view their own NFT shares"
ON nft_shares FOR SELECT
USING (auth.uid() = user_id);

-- Add read policy for public fractional NFT data
CREATE POLICY "Anyone can view NFT share data"
ON nft_shares FOR SELECT
USING (true);

-- Note: All INSERT/UPDATE/DELETE operations must now go through secured edge functions
-- using the service role client

-- =========================================
-- 2. NFT Transactions - Fix Unrestricted Inserts
-- =========================================
-- Drop the dangerous policy that allows any user to insert transactions
DROP POLICY IF EXISTS "System can insert NFT transactions" ON nft_transactions;

-- Add read policy for users to view transactions
CREATE POLICY "Users can view NFT transactions"
ON nft_transactions FOR SELECT
USING (true);

-- Note: All transaction inserts must now go through secured edge functions
-- The edge function will validate the transaction before inserting

-- =========================================
-- 3. Creator Earnings - Fix Unrestricted Inserts
-- =========================================
-- Drop the dangerous policy that allows any user to insert earnings
DROP POLICY IF EXISTS "System can insert creator earnings" ON creator_earnings;

-- Add read policy for users to view their own earnings
CREATE POLICY "Users can view their own earnings"
ON creator_earnings FOR SELECT
USING (auth.uid() = user_id);

-- Add read policy for admins to view all earnings
CREATE POLICY "Admins can view all earnings"
ON creator_earnings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Note: All earnings inserts must now go through secured edge functions
-- The edge function will validate payouts before creating earnings records

-- =========================================
-- Verification Queries
-- =========================================
-- Run these to verify policies are properly configured:

-- Check nft_shares policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies WHERE tablename = 'nft_shares';

-- Check nft_transactions policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies WHERE tablename = 'nft_transactions';

-- Check creator_earnings policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies WHERE tablename = 'creator_earnings';
