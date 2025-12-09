# 💰 FlowCredits - Unified Billing System

> A single currency for all premium AI features in FlowAI.

---

## Pricing Model

| Service | Cost | Description |
|---------|------|-------------|
| **AI Content Generation** | 1 credit | Per post generated |
| **Video Dubbing** | 10 credits | Per target language |
| **Thumbnail Generation** | 5 credits | Per image generated |
| **Voice Cloning** | 100 credits | One-time per voice |
| **Multi-Platform Syndication** | 2 credits | Per platform post |

### Credit Packs (Suggested Retail)

| Pack | Credits | Price (USD) |
|------|---------|-------------|
| Starter | 50 | Free (Sign-up bonus) |
| Basic | 200 | $9.99 |
| Pro | 1,000 | $39.99 |
| Business | 5,000 | $149.99 |
| Enterprise | Custom | Contact Sales |

---

## Technical Implementation

### Database Schema

**`user_credits`** - Balance ledger
```sql
user_id UUID PRIMARY KEY
balance INTEGER DEFAULT 50
is_frozen BOOLEAN DEFAULT false
updated_at TIMESTAMPTZ
```

**`credit_transactions`** - Immutable audit trail
```sql
id UUID PRIMARY KEY
user_id UUID
amount INTEGER -- Positive = deposit, Negative = usage
transaction_type TEXT -- 'purchase', 'video_dubbing', etc.
description TEXT
metadata JSONB
created_at TIMESTAMPTZ
```

### API Reference

**Check Balance**
```typescript
const { data } = await supabase.functions.invoke('billing-engine', {
  body: { action: 'get_balance' }
});
// data.balance => 150
```

**Deduct Credits**
```typescript
const { error } = await supabase.functions.invoke('billing-engine', {
  body: { 
    action: 'deduct_credits', 
    amount: 10, 
    service: 'video_dubbing',
    metadata: { job_id: 'abc123' }
  }
});

if (error) {
  // Handle insufficient funds (HTTP 402)
}
```

---

## Integration Pattern

When adding billing to a feature:

1. **Pre-check** (Optional): Display cost to user before action
2. **Deduct**: Call `billing-engine` with `deduct_credits`
3. **Execute**: Only proceed if billing succeeds
4. **Confirm**: Show success message with credits used

```typescript
// Example: Thumbnail Generation
const COST = 5;

// 1. Deduct first
const { error } = await supabase.functions.invoke('billing-engine', {
  body: { action: 'deduct_credits', amount: COST, service: 'thumbnail_gen' }
});

if (error) {
  toast.error('Insufficient credits');
  return;
}

// 2. Then generate
const result = await generateThumbnail(params);
toast.success(`Generated! -${COST} credits`);
```

---

## Security

- All credit operations use **SECURITY DEFINER** functions
- Direct table updates are blocked by RLS
- Balance changes only via `credit_transactions` trigger
- Admin-only `add_credits` action for purchases
