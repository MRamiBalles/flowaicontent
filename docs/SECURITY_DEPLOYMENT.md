# Security Hardening - Deployment Guide

## ✅ What's Been Done

### 1. RLS Policy Migration
**File:** `supabase/migrations/20251126004500_fix_critical_rls_policies.sql`

**Changes:**
- ❌ Removed: `USING (true)` policies on sensitive tables
- ✅ Added: Secure read-only policies
- ✅ Added: User-scoped policies

**Tables Fixed:**
- `nft_shares` - Now read-only, writes via Edge Function
- `nft_transactions` - Now read-only, writes via Edge Function
- `creator_earnings` - Now read-only, writes via Edge Function

### 2. Secure Edge Functions Created

#### A. `manage-nft-shares`
**Purpose:** Handle NFT share buy/sell operations  
**Security:**
- ✅ User authentication required
- ✅ Wallet address validation
- ✅ Share balance checks
- ✅ Service role for DB writes

#### B. `record-nft-transaction`
**Purpose:** Record blockchain transactions  
**Security:**
- ✅ User authentication required
- ✅ Duplicate transaction detection
- ✅ Transaction type validation
- ✅ Service role for DB writes

#### C. `process-creator-payout`
**Purpose:** Process creator earnings (Admin only)  
**Security:**
- ✅ Admin role verification
- ✅ Duplicate payout detection
- ✅ 70/30 split calculation
- ✅ Audit logging
- ✅ Service role for DB writes

---

## 🚀 Deployment Steps

### Step 1: Apply Database Migration

```bash
# Navigate to project directory
cd c:\Users\Manu\FlowAI\flowaicontent-7

# Login to Supabase CLI (if not already)
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Apply the migration
supabase db push
```

**Or via Supabase Dashboard:**
1. Go to SQL Editor
2. Copy content from `supabase/migrations/20251126004500_fix_critical_rls_policies.sql`
3. Execute the SQL
4. Verify no errors

### Step 2: Deploy Edge Functions

```bash
# Deploy all 3 functions
supabase functions deploy manage-nft-shares
supabase functions deploy record-nft-transaction
supabase functions deploy process-creator-payout
```

**Verify deployment:**
```bash
supabase functions list
```

You should see:
```
┌──────────────────────────┬─────────┬─────────────┐
│ NAME                     │ STATUS  │ UPDATED AT  │
├──────────────────────────┼─────────┼─────────────┤
│ manage-nft-shares        │ deployed│ 2025-11-28  │
│ record-nft-transaction   │ deployed│ 2025-11-28  │
│ process-creator-payout   │ deployed│ 2025-11-28  │
└──────────────────────────┴─────────┴─────────────┘
```

---

## 🧪 Testing & Verification

### Test 1: Verify RLS Policies

```sql
-- Check nft_shares policies (should be read-only)
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies 
WHERE tablename = 'nft_shares';

-- Expected: Only SELECT policies, no INSERT/UPDATE/DELETE for users
```

### Test 2: Test Edge Functions

#### A. Test manage-nft-shares (Buy)
```bash
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/manage-nft-shares' \
  -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "nftId": "your-nft-id",
    "shares": 100,
    "action": "buy",
    "price": 1.5
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Successfully purchased 100 shares"
}
```

#### B. Test record-nft-transaction
```bash
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/record-nft-transaction' \
  -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "nftId": "your-nft-id",
    "transactionType": "buy",
    "fromAddress": "0x...",
    "toAddress": "0x...",
    "shares": 100,
    "priceMatic": 1.5,
    "transactionHash": "0x..."
  }'
```

#### C. Test process-creator-payout (Admin Only)
```bash
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/process-creator-payout' \
  -H 'Authorization: Bearer YOUR_ADMIN_JWT' \
  -H 'Content-Type: application/json' \
  -d '{
    "purchaseId": "purchase-id-here"
  }'
```

---

## 🔒 Security Checklist

- [x] RLS enabled on all sensitive tables
- [x] Overly permissive policies removed
- [x] Edge Functions use service role for writes
- [x] User authentication verified in all functions
- [x] Admin role verification for sensitive operations
- [x] Input validation on all endpoints
- [x] Audit logging for admin actions
- [x] Duplicate transaction detection
- [x] Balance checks before operations

---

## 📊 Security Scorecard (After Implementation)

| Category | Before | After | Notes |
|----------|--------|-------|-------|
| Authentication | 🟢 Strong | 🟢 Strong | No change needed |
| Authorization | 🟢 Strong | 🟢 Strong | Admin verification added |
| RLS Policies | 🔴 Critical | 🟢 Strong | Fixed overly permissive policies |
| Input Validation | 🟢 Strong | 🟢 Strong | Added to Edge Functions |
| AI Security | 🟢 Strong | 🟢 Strong | No change needed |

**Overall Security Score: 🟢 STRONG**

---

## 🚨 What to Monitor

### 1. Edge Function Logs
```bash
supabase functions logs manage-nft-shares --tail
supabase functions logs record-nft-transaction --tail
supabase functions logs process-creator-payout --tail
```

### 2. Failed Authentication Attempts
Check for repeated unauthorized access attempts

### 3. Unusual Transaction Patterns
- Multiple failed share purchases
- Duplicate transaction hash attempts
- Admin payout requests from non-admins

---

## 🔧 Troubleshooting

### Issue: "Unauthorized" error
**Solution:** Check that:
1. User is logged in
2. Authorization header is present
3. JWT token is valid

### Issue: "Insufficient shares" error
**Solution:** 
1. Verify user's share balance
2. Check NFT total shares
3. Ensure buy/sell logic is correct

### Issue: "Admin access required"
**Solution:**
1. Verify user has admin role in `user_roles` table
2. Check admin verification query in function

---

## 📝 Next Steps

1. Deploy migration and functions
2. Test each endpoint
3. Monitor logs for 24-48 hours
4. Update frontend to use new Edge Functions instead of direct DB writes
5. Consider rate limiting on Edge Functions (Future)
