# 🪙 $FLOW Token Staking & Governance - Documentation

> **Feature**: $FLOW Token Staking  
> **Version**: 1.0.0  
> **Last Updated**: 2025-12-08  
> **Status**: ✅ Implemented

---

## Overview

Staking platform for $FLOW tokens allowing users to earn yield (APY) and participate in DAO governance.

---

## Database Schema (5 Tables)

| Table | Purpose |
|-------|---------|
| `staking_pools` | Config for APY, lock periods |
| `user_stakes` | Active user deposits |
| `staking_rewards` | (Implicit in `user_stakes`) |
| `governance_proposals` | DAO voting items |
| `governance_votes` | User votes weighted by stake |

---

## API Reference

**Endpoint**: `POST /functions/v1/token-governance`

| Action | Description |
|--------|-------------|
| `stake` | Deposit $FLOW into pool |
| `unstake` | Withdraw (after lock period) |
| `claim_rewards` | Harvest yield |
| `vote` | Cast DAO vote |
| `get_stats` | User/Global metrics |

---

## Staking Logic

- **Daily Rewards**: `Amount * (APY/365)`
- **Lock Periods**: 0, 30, 90 days (higher APY for longer locks)
- **Voting Power**: 1 Staked FLOW = 1 Vote

---

## Files Created

| File | Purpose |
|------|---------|
| [20251208170800_token_staking.sql](file:///c:/Users/Manu/FlowAI/flowaicontent-10/supabase/migrations/20251208170800_token_staking.sql) | Database |
| [token-governance/index.ts](file:///c:/Users/Manu/FlowAI/flowaicontent-10/supabase/functions/token-governance/index.ts) | Edge Function |
| [TokenStaking.tsx](file:///c:/Users/Manu/FlowAI/flowaicontent-10/src/pages/TokenStaking.tsx) | Dashboard UI |

---

## Route: `/staking`

---

## Deployment

```bash
npx supabase db push
npx supabase functions deploy token-governance
```
