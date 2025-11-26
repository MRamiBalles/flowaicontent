# Security Hardening Deployment Guide

## Prerequisites
- Supabase CLI installed
- Access to production Supabase project
- Sentry account and DSN

## 1. Deploy Database Security Fixes

### Apply RLS Policy Migration
```bash
# Navigate to your project root
cd C:\Users\Manu\FlowAI\flowaicontent-6

# Apply the security migration to your Supabase project
supabase db push
```

Important: This migration drops the dangerous policies and adds secure ones. Verify that your edge functions use the service role client for writes.

### Verify RLS Policies
Run these queries in the Supabase dashboard SQL editor:

```sql
-- Check nft_shares policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'nft_shares';
-- Should show: "Users can view their own NFT shares" (SELECT)
--              "Anyone can view NFT share data" (SELECT)

-- Check nft_transactions policies  
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'nft_transactions';
-- Should show: "Users can view NFT transactions" (SELECT)

-- Check creator_earnings policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'creator_earnings';
-- Should show: "Users can view their own earnings" (SELECT)
--              "Admins can view all earnings" (SELECT)
```

## 2. Configure Sentry Monitoring

### Get Your Sentry DSN
1. Log in to https://sentry.io
2. Create a new project or use existing
3. Copy the DSN from Project Settings → Client Keys

### Set Environment Variables
Add these to your `.env` file (do NOT commit this file):

```env
VITE_SENTRY_DSN=https://your-dsn@o0.ingest.sentry.io/0
VITE_SENTRY_ENVIRONMENT=production
VITE_SENTRY_TRACES_SAMPLE_RATE=0.1
VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE=0.1
VITE_SENTRY_REPLAYS_ERROR_SAMPLE_RATE=1.0
```

### Deploy to Vercel/Railway
Add the same environment variables in your hosting platform:
- Vercel: Project Settings → Environment Variables
- Railway: Project → Variables tab

## 3. Set Up Playwright Test Database

### Create Test Database (Optional - for CI/CD)
If running automated tests:

```bash
# Run the test database setup
psql -h your-test-db-url -f tests/setup-test-db.sql
```

### Configure Test Users
The script creates 3 test users:
- `testuser@flowai.test` (regular user)
- `creator@flowai.test` (creator role)
- `admin@flowai.test` (admin role)

Password for all: `TestPassword123!`

## 4. Verification Checklist

### Database Security
- [ ] RLS migration applied successfully
- [ ] Old dangerous policies removed
- [ ] New read-only policies in place
- [ ] Edge functions updated to use service role for writes

### Sentry Monitoring
- [ ] Environment variables configured
- [ ] Sentry initialization working (check console)
- [ ] Test error tracking with: `throw new Error("Sentry test")`
- [ ] Verify errors appear in Sentry dashboard

### Edge Functions
- [ ] mint-nft function validates wallet addresses
- [ ] Invalid addresses are rejected (test with: "0x123")
- [ ] Valid addresses accepted (test with: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb")

## 5. Monitoring & Alerts

### Sentry Alerts
Configure in Sentry dashboard:
1. Go to Alerts → Create Alert
2. Set up rules for:
   - Critical errors (send to email/Slack)
   - Performance degradation (>2s page load)
   - High error rate (>10 errors/minute)

### Database Monitoring
Monitor for unauthorized access attempts:
```sql
-- Check for failed INSERT attempts on secured tables
SELECT * FROM pg_stat_statements 
WHERE query LIKE '%INSERT INTO nft_shares%' 
  OR query LIKE '%INSERT INTO creator_earnings%'
ORDER BY calls DESC;
```

## 6. Rollback Plan

If issues arise:

### Revert RLS Policies
```sql
-- Emergency rollback (NOT RECOMMENDED - security risk)
DROP POLICY "Users can view their own NFT shares" ON nft_shares;
-- Recreate old policies if absolutely necessary
```

### Disable Sentry
Remove `VITE_SENTRY_DSN` from environment variables and redeploy.

## Support
For issues, check:
- Supabase logs: Dashboard → Database → Logs
- Sentry dashboard: https://sentry.io
- Edge function logs: Supabase → Edge Functions → [function name] → Logs
