# FlowCredits Billing System

Credit-based billing for AI features.

## Pricing

| Service | Credits | Notes |
|---------|---------|-------|
| AI content generation | 1 | Per post |
| Thumbnail | 5 | Per image |
| Video dubbing | 10 | Per language |
| Voice clone | 100 | One-time setup |

### Subscription Tiers

| Tier | Credits | Price | Generation Limit |
|------|---------|-------|------------------|
| Free | 60 | $0 (signup bonus) | 20/day |
| Creator | 1,500 | $9.99/mo | 500/month |
| Pro | Unlimited | $99.99/mo | Unlimited |
| Enterprise | Unlimited | Custom | Unlimited |

> **Note**: Credits are calculated as 3 credits = 1 generation on average. Pro/Enterprise have unlimited credits for platform features.

## Database Schema

### `user_credits`
Current balance per user.

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | UUID | Primary key, FK to auth.users |
| `balance` | INT | Current credit count |
| `is_frozen` | BOOL | Admin lock flag |

### `credit_transactions`
Immutable ledger of all credit movements.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Account owner |
| `amount` | INT | Positive = deposit, negative = usage |
| `transaction_type` | TEXT | `purchase`, `video_dubbing`, etc. |
| `metadata` | JSONB | Service-specific data (job IDs, etc.) |

## API

### Check Balance

```typescript
const { data } = await supabase.functions.invoke('billing-engine', {
  body: { action: 'get_balance' }
});
// data.balance => 150
```

### Deduct Credits

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
  // HTTP 402: Insufficient funds
}
```

## Integration Pattern

1. Deduct credits before starting the operation
2. If deduction fails, show error and stop
3. If deduction succeeds, proceed with the AI call

```typescript
const COST = 5;

// Step 1: Charge
const { error } = await supabase.functions.invoke('billing-engine', {
  body: { action: 'deduct_credits', amount: COST, service: 'thumbnail_gen' }
});

if (error) {
  toast.error('Insufficient credits');
  return;
}

// Step 2: Execute
const result = await generateThumbnail(params);
toast.success(`Generated! -${COST} credits`);
```

## Security

- Credit operations use `SECURITY DEFINER` functions
- Direct table writes blocked by RLS
- Balance updates via trigger on `credit_transactions`
- Admin-only `add_credits` action for purchases
