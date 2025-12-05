-- Fix Critical RLS Policy Vulnerabilities
-- Drop overly permissive policies that allow unrestricted writes

-- 1. Drop dangerous nft_shares policy (allows ALL operations with true)
DROP POLICY IF EXISTS "System can manage NFT shares" ON nft_shares;

-- 2. Drop dangerous nft_transactions policy (allows unrestricted inserts)
DROP POLICY IF EXISTS "System can insert NFT transactions" ON nft_transactions;

-- 3. Drop dangerous creator_earnings policy (allows unrestricted inserts)
DROP POLICY IF EXISTS "System can insert creator earnings" ON creator_earnings;