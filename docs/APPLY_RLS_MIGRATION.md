# How to Apply the RLS Security Migration

Since Supabase CLI is not installed on your system, you'll need to apply the migration manually via the Supabase Dashboard.

## Step 1: Open Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your FlowAI project
3. Click on "SQL Editor" in the left sidebar

## Step 2: Run the Migration SQL

Copy and paste the following SQL into the SQL editor:

```sql
-- Migration: Fix Critical RLS Policy Vulnerabilities
-- Date: 2025-11-28
-- Description: Removes unrestricted access policies on nft_shares, nft_transactions, and creator_earnings

-- =========================================
-- 1. NFT Shares Table - Fix Unrestricted Access
-- =========================================
DROP POLICY IF EXISTS "System can manage NFT shares" ON nft_shares;

CREATE POLICY "Users can view their own NFT shares"
ON nft_shares FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view NFT share data"
ON nft_shares FOR SELECT
USING (true);

-- =========================================
-- 2. NFT Transactions - Fix Unrestricted Inserts
-- =========================================
DROP POLICY IF EXISTS "System can insert NFT transactions" ON nft_transactions;

CREATE POLICY "Users can view NFT transactions"
ON nft_transactions FOR SELECT
USING (true);

-- =========================================
-- 3. Creator Earnings - Fix Unrestricted Inserts
-- =========================================
DROP POLICY IF EXISTS "System can insert creator earnings" ON creator_earnings;

CREATE POLICY "Users can view their own earnings"
ON creator_earnings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all earnings"
ON creator_earnings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);
```

## Step 3: Execute the SQL

1. Click the "Run" button (or press Ctrl+Enter / Cmd+Enter)
2. Wait for success message
3. Review any errors if they occur

## Step 4: Verify the Changes

Run this verification query in the SQL Editor:

```sql
-- Check nft_shares policies
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies 
WHERE tablename IN ('nft_shares', 'nft_transactions', 'creator_earnings')
ORDER BY tablename, policyname;
```

You should see:
- **nft_shares**: Only SELECT policies (no INSERT/UPDATE/DELETE)
- **nft_transactions**: Only SELECT policies
- **creator_earnings**: Only SELECT policies with user/admin restrictions

## ✅ Success Indicators

- ✅ No errors in SQL execution
- ✅ "System can manage NFT shares" policy dropped
- ✅ "System can insert NFT transactions" policy dropped  
- ✅ "System can insert creator earnings" policy dropped
- ✅ New read-only policies created

## Next Steps

After applying the migration:
1. Deploy the 3 Edge Functions (see SECURITY_DEPLOYMENT.md)
2. Test the functions with curl or Postman
3. Update frontend to use Edge Functions instead of direct DB writes

---

**Note:** The Edge Functions are already fixed with proper TypeScript error handling (using `error instanceof Error` checks).
