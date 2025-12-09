# 💰 Unified Credits System (FlowCredits)

> **Goal**: A single "currency" for all premium AI features.

---

## 1. Credit Pricing Model

| Service | Cost | Unit |
|---------|------|------|
| **AI Generation** | 1 credit | per post |
| **Video Dubbing** | 5 credits | per minute |
| **Thumbnail Gen** | 2 credits | per image |
| **Voice Cloning** | 50 credits | per voice |

---

## 2. Database Schema

### `user_credits`
Holds the current balance.
- `balance`: Current available FlowCredits.
- `is_frozen`: Security flag.

### `credit_transactions`
The immutable ledger. **Never update user_credits directly**; always insert a transaction.
- `amount`: +ve for deposits, -ve for usage.
- `transaction_type`: `purchase`, `ai_generation`, etc.

---

## 3. API Reference (`billing-engine`)

### Check Balance
```typescript
const res = await supabase.functions.invoke('billing-engine', {
  body: { action: 'get_balance' }
});
console.log(res.data.balance); // 150
```

### Deduct Credits
```typescript
const res = await supabase.functions.invoke('billing-engine', {
  body: { 
    action: 'deduct_credits', 
    amount: 5, 
    service: 'video_dubbing',
    metadata: { job_id: '123' }
  }
});

if (res.error) {
  // Handle "Insufficient funds"
}
```

---

## 4. Integration Guide

When building a feature (e.g., Thumbnails):
1.  **Estimate Cost**: Calculate credits needed.
2.  **Call API**: Call `deduct_credits` *before* calling OpenAI/ElevenLabs.
3.  **Proceed**: Only run the AI job if billing succeeds.
