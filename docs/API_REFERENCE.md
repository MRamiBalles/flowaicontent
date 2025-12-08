# 🔌 FlowAI - Complete API Reference

> **Backend API Documentation for Developers**  
> **Version**: 2.1  
> **Last Updated**: 2025-12-08  
> **Base URL**: `https://api.flowai.com/api/v1`

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Rate Limiting](#rate-limiting)
3. [Error Handling](#error-handling)
4. [Video Generation](#-video-generation)
5. [Co-Streaming](#-co-streaming)
6. [Emotes](#-emotes)
7. [Safety & Moderation](#%EF%B8%8F-safety--moderation)
8. [Staking](#-staking)
9. [Marketplace](#%EF%B8%8F-marketplace)
10. [Economy & Governance](#-economy--governance)
11. [Notifications](#-notifications)
12. [Social Export](#-social-export)
13. [Referrals](#-referrals)
14. [Admin Functions](#-admin-functions-edge-functions)
15. [Webhooks](#-webhooks)

---

## 🔐 Authentication

### Overview

FlowAI uses **JWT (JSON Web Tokens)** issued by Supabase Auth.

**Authentication Flow**:
```
1. User logs in → Supabase returns JWT
2. Client includes JWT in Authorization header
3. Backend validates JWT signature
4. Request proceeds with user context
```

---

### Login

**Endpoint**: `POST /auth/login`  
**Description**: Authenticate user and receive JWT token

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK)**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "v1.MRjXLiK...",
  "expires_in": 3600,
  "token_type": "bearer",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "role": "user"
  }
}
```

---

### Using JWT in Requests

Include token in `Authorization` header:
```http
GET /video/history
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token Lifetime**: 1 hour (3600 seconds)

---

### Refresh Token

**Endpoint**: `POST /auth/refresh`  
**Description**: Get new access token without re-login

**Request**:
```json
{
  "refresh_token": "v1.MRjXLiK..."
}
```

**Response (200 OK)**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600
}
```

---

## ⏱️ Rate Limiting

### Limits by Tier

| Tier | Requests/Minute | Burst Limit |
|------|-----------------|-------------|
| **Free** | 10 req/min | 20 req |
| **PRO** | 100 req/min | 200 req |
| **BUSINESS** | 1000 req/min | 2000 req |

**Rate Limit Headers**:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1638360000
```

**429 Response**:
```json
{
  "error": "rate_limit_exceeded",
  "message": "Try again in 42 seconds",
  "retry_after": 42
}
```

---

## ❌ Error Handling

### Standard Error Response

```json
{
  "error": {
    "code": "invalid_request",
    "message": "The 'prompt' field is required",
    "details": {
      "field": "prompt",
      "reason": "missing_required_field"
    }
  }
}
```

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Success |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Missing/invalid JWT |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

---

## 🎬 Video Generation

### Generate Video

**Endpoint**: `POST /video/generate`  
**Description**: Start AI video generation from text prompt  
**Auth**: Required

**Request**:
```json
{
  "prompt": "A cyberpunk city at night with neon lights and rain",
  "style_id": "550e8400-e29b-41d4-a716-446655440000",
  "duration": 4,
  "resolution": "1080p",
  "aspect_ratio": "16:9"
}
```

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| prompt | string | Yes | 10-500 characters |
| style_id | UUID | No | Style pack ID (default: Cinematic) |
| duration | integer | No | 1-10 seconds (default: 4) |
| resolution | string | No | `720p`, `1080p`, `4k` |
| aspect_ratio | string | No | `16:9`, `9:16`, `1:1` |

**Response (202 Accepted)**:
```json
{
  "task_id": "task_abc123xyz",
  "status": "queued",
  "estimated_time": 75,
  "position_in_queue": 3
}
```

---

### Check Status

**Endpoint**: `GET /video/status/:task_id`  
**Description**: Check video generation progress  
**Auth**: Required

**Response (200 OK)**:
```json
{
  "task_id": "task_abc123xyz",
  "status": "complete",
  "progress": 100,
  "video_url": "https://cdn.flowai.com/videos/550e8400.mp4",
  "thumbnail_url": "https://cdn.flowai.com/thumbnails/550e8400.jpg",
  "created_at": "2024-11-25T10:30:00Z",
  "completed_at": "2024-11-25T10:31:15Z"
}
```

**Status Values**: `queued`, `processing`, `complete`, `failed`, `canceled`

---

### List Styles

**Endpoint**: `GET /video/styles`  
**Description**: Get available style packs  
**Auth**: Optional

**Response (200 OK)**:
```json
{
  "styles": [
    {
      "id": "style_abc123",
      "name": "Cinematic",
      "description": "Movie-like, dramatic lighting",
      "preview_url": "https://cdn.flowai.com/styles/cinematic.jpg",
      "is_premium": false
    },
    {
      "id": "style_def456",
      "name": "Anime",
      "description": "Japanese animation style",
      "preview_url": "https://cdn.flowai.com/styles/anime.jpg",
      "is_premium": false
    }
  ]
}
```

---

### Video History

**Endpoint**: `GET /video/history`  
**Description**: Get user's generated videos  
**Auth**: Required

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Page number |
| limit | integer | 20 | Items per page (max 100) |
| sort | string | created_at | Sort by: `created_at`, `views`, `likes` |
| order | string | desc | `asc` or `desc` |

**Response (200 OK)**:
```json
{
  "videos": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "prompt": "A cyberpunk city at night...",
      "video_url": "https://cdn.flowai.com/videos/550e8400.mp4",
      "views": 1523,
      "likes": 87,
      "created_at": "2024-11-25T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 47
  }
}
```

---

## 🤝 Co-Streaming

### Find Matches

**Endpoint**: `GET /co-streaming/matches`  
**Description**: Get recommended co-streaming partners  
**Auth**: Required

**Response (200 OK)**:
```json
{
  "matches": [
    {
      "user_id": "user_abc123",
      "display_name": "@CreatorName",
      "avatar_url": "https://cdn.flowai.com/avatars/abc123.jpg",
      "match_score": 0.87,
      "common_styles": ["Cyberpunk", "Anime"],
      "followers": 5420
    }
  ]
}
```

---

### Initiate Raid

**Endpoint**: `POST /co-streaming/raid`  
**Description**: Send viewers to another creator  
**Auth**: Required

**Request**:
```json
{
  "target_user_id": "user_xyz789"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "raiders_sent": 142,
  "target_user": {
    "id": "user_xyz789",
    "display_name": "@TargetCreator"
  }
}
```

---

## 😄 Emotes

### Generate Emote

**Endpoint**: `POST /emotes/generate`  
**Description**: Create AI-generated custom emote  
**Auth**: Required

**Request**:
```json
{
  "prompt": "Happy panda eating bamboo",
  "style": "cartoon"
}
```

**Response (202 Accepted)**:
```json
{
  "task_id": "emote_abc123",
  "status": "processing",
  "estimated_time": 30
}
```

---

### Emote Library

**Endpoint**: `GET /emotes/library`  
**Description**: Get user's generated emotes  
**Auth**: Required

**Response (200 OK)**:
```json
{
  "emotes": [
    {
      "id": "emote_abc123",
      "image_url": "https://cdn.flowai.com/emotes/abc123.png",
      "prompt": "Happy panda eating bamboo",
      "created_at": "2024-11-25T10:30:00Z"
    }
  ]
}
```

---

## 🛡️ Safety & Moderation

### Content Check

**Endpoint**: `POST /safety/check`  
**Description**: Check content for deepfakes, NSFW, violence  
**Auth**: Required

**Request**:
```json
{
  "content_url": "https://cdn.flowai.com/videos/550e8400.mp4",
  "content_type": "video"
}
```

**Response (200 OK)**:
```json
{
  "is_safe": true,
  "deepfake_score": 0.02,
  "nsfw_score": 0.01,
  "violence_score": 0.00,
  "flags": []
}
```

**If unsafe**:
```json
{
  "is_safe": false,
  "deepfake_score": 0.87,
  "nsfw_score": 0.12,
  "violence_score": 0.03,
  "flags": ["deepfake_detected", "explicit_content"]
}
```

---

## 🥩 Staking

### Staking Info

**Endpoint**: `GET /staking/info`  
**Description**: Get user's staking balance and rewards  
**Auth**: Required

**Response (200 OK)**:
```json
{
  "staked_amount": 10000,
  "lock_period": "12_months",
  "apy": 0.31,
  "rewards_earned": 850,
  "unlock_date": "2025-11-25T10:30:00Z"
}
```

---

### Staking Stats

**Endpoint**: `GET /staking/stats`  
**Description**: Get global platform staking statistics  
**Auth**: Optional

**Response (200 OK)**:
```json
{
  "total_value_locked": 50000000,
  "total_stakers": 12500,
  "current_apy": {
    "no_lock": 0.15,
    "3_months": 0.20,
    "6_months": 0.25,
    "12_months": 0.31
  },
  "staking_pool_remaining": 250000000
}
```

---

## 🛍️ Marketplace

### List NFTs

**Endpoint**: `GET /marketplace/listings`  
**Description**: Get active NFT listings  
**Auth**: Optional

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| sort | string | price_low | `price_low`, `price_high`, `newest`, `most_viewed` |
| page | integer | 1 | Page number |
| limit | integer | 20 | Items per page |

**Response (200 OK)**:
```json
{
  "listings": [
    {
      "id": "nft_abc123",
      "video_url": "https://cdn.flowai.com/videos/abc123.mp4",
      "price_flo": 500,
      "price_usd": 50.00,
      "seller": {
        "id": "user_xyz789",
        "display_name": "@CreatorName"
      },
      "views": 15230,
      "listed_at": "2024-11-25T10:30:00Z"
    }
  ]
}
```

---

### Mint NFT

**Endpoint**: `POST /marketplace/mint`  
**Description**: Mint a video as NFT  
**Auth**: Required

**Request**:
```json
{
  "video_id": "550e8400-e29b-41d4-a716-446655440000",
  "price_flo": 500,
  "royalty_percentage": 10
}
```

**Response (201 Created)**:
```json
{
  "nft_id": "nft_abc123",
  "contract_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "token_id": 12345,
  "transaction_hash": "0xabc123...",
  "listing_url": "https://flowai.com/marketplace/nft/nft_abc123"
}
```

---

### Buy NFT

**Endpoint**: `POST /marketplace/buy/:id`  
**Description**: Purchase a listed NFT  
**Auth**: Required

**Request**:
```json
{
  "payment_method": "flo"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "nft_id": "nft_abc123",
  "transaction_hash": "0xdef456...",
  "amount_paid_flo": 500
}
```

---

## 📈 Economy & Governance

### Creator Coin Info

**Endpoint**: `GET /economy/coins/:id`  
**Description**: Get Creator Coin price and supply  
**Auth**: Optional

**Response (200 OK)**:
```json
{
  "creator_id": "user_xyz789",
  "coin_price": 1.50,
  "total_supply": 100000,
  "circulating_supply": 75000,
  "market_cap": 112500,
  "holders": 523
}
```

---

### Buy Creator Coins

**Endpoint**: `POST /economy/coins/buy`  
**Description**: Purchase Creator Coins  
**Auth**: Required

**Request**:
```json
{
  "creator_id": "user_xyz789",
  "amount_flo": 1000
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "coins_received": 667,
  "price_per_coin": 1.50,
  "transaction_id": "tx_abc123"
}
```

---

### DAO Proposals

**Endpoint**: `GET /economy/governance/proposals`  
**Description**: List DAO governance proposals  
**Auth**: Optional

**Response (200 OK)**:
```json
{
  "proposals": [
    {
      "id": "prop_abc123",
      "title": "Reduce platform fee from 5% to 3%",
      "description": "Lower fees to increase creator earnings",
      "votes_for": 12500000,
      "votes_against": 3200000,
      "status": "active",
      "ends_at": "2024-12-01T00:00:00Z"
    }
  ]
}
```

---

### Vote on Proposal

**Endpoint**: `POST /economy/governance/vote`  
**Description**: Cast vote on DAO proposal  
**Auth**: Required

**Request**:
```json
{
  "proposal_id": "prop_abc123",
  "vote": "for",
  "voting_power": 10000
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "proposal_id": "prop_abc123",
  "your_vote": "for",
  "voting_power_used": 10000
}
```

---

## 🔔 Notifications

### Subscribe to Push

**Endpoint**: `POST /notifications/subscribe`  
**Description**: Register device for push notifications  
**Auth**: Required

**Request**:
```json
{
  "device_token": "ExponentPushToken[abc123xyz]",
  "platform": "ios"
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "subscription_id": "sub_abc123"
}
```

---

### Test Notification

**Endpoint**: `POST /notifications/test`  
**Description**: Send test notification to verify setup  
**Auth**: Required

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Test notification sent"
}
```

---

## 🚀 Social Export

### Export to Platform

**Endpoint**: `POST /social-export/share`  
**Description**: Export video to TikTok, Reels, Shorts  
**Auth**: Required

**Request**:
```json
{
  "video_id": "550e8400-e29b-41d4-a716-446655440000",
  "platform": "tiktok",
  "caption": "Check out my AI video! #FlowAI #AIArt"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "export_id": "export_abc123",
  "platform": "tiktok",
  "share_url": "https://tiktok.com/@username/video/123456",
  "formatted_video_url": "https://cdn.flowai.com/exports/abc123.mp4"
}
```

---

### Export History

**Endpoint**: `GET /social-export/history`  
**Description**: Get user's export history  
**Auth**: Required

**Response (200 OK)**:
```json
{
  "exports": [
    {
      "id": "export_abc123",
      "platform": "tiktok",
      "video_id": "550e8400-e29b-41d4-a716-446655440000",
      "exported_at": "2024-11-25T10:30:00Z",
      "views": 15230
    }
  ]
}
```

---

## 👥 Referrals

### Referral Dashboard

**Endpoint**: `GET /referrals-v2/dashboard`  
**Description**: Get referral stats and share links  
**Auth**: Required

**Response (200 OK)**:
```json
{
  "referral_code": "ABC123XYZ",
  "referral_link": "https://flowai.com/ref/ABC123XYZ",
  "stats": {
    "total_referrals": 42,
    "signups": 42,
    "pro_upgrades": 12,
    "earnings_flo": 5200
  },
  "leaderboard_position": 87
}
```

---

### Claim Referral Code

**Endpoint**: `POST /referrals-v2/claim`  
**Description**: Use a referral code during signup  
**Auth**: Optional

**Request**:
```json
{
  "referral_code": "ABC123XYZ"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "bonus_flo": 100,
  "message": "You received 100 FLO bonus!"
}
```

---

### Leaderboard

**Endpoint**: `GET /referrals-v2/leaderboard`  
**Description**: Get top referrers  
**Auth**: Optional

**Response (200 OK)**:
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "user_id": "user_abc123",
      "display_name": "@TopReferrer",
      "total_referrals": 523,
      "earnings_flo": 52300
    }
  ]
}
```

---

## 🔑 Admin Functions (Edge Functions)

**Note**: All admin endpoints require `admin` role and use Supabase Edge Functions.

**Base URL**: `https://zcuhvoyvutspcciyjohf.supabase.co/functions/v1`

---

### List Users

**Edge Function**: `admin-list-users`  
**Description**: Get all users (admin only)  
**Auth**: Required (admin)

**Request**:
```http
GET /admin-list-users?page=1&limit=50
Authorization: Bearer <admin-jwt>
```

**Response (200 OK)**:
```json
{
  "users": [
    {
      "id": "user_abc123",
      "email": "user@example.com",
      "display_name": "@UserName",
      "role": "user",
      "tier": "pro",
      "created_at": "2024-10-15T12:00:00Z",
      "last_login": "2024-11-25T09:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1523
  }
}
```

---

### Change User Role

**Edge Function**: `admin-change-role`  
**Description**: Update user's role (admin/moderator/user)  
**Auth**: Required (admin)

**Request**:
```http
POST /admin-change-role
Authorization: Bearer <admin-jwt>
Content-Type: application/json

{
  "userId": "660f9511-f39c-52e5-b827-557766551111",
  "newRole": "moderator"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "user_id": "660f9511-f39c-52e5-b827-557766551111",
  "new_role": "moderator"
}
```

**Security Notes**:
- Cannot demote yourself
- Action logged in `admin_audit_logs`
- Requires `admin` role (verified via RLS)

---

### View Audit Logs

**Edge Function**: `admin-audit-logs`  
**Description**: View admin action history  
**Auth**: Required (admin)

**Request**:
```http
GET /admin-audit-logs?page=1&limit=20&search=change_role
Authorization: Bearer <admin-jwt>
```

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| page | integer | Page number (default: 1) |
| limit | integer | Items per page (max 100) |
| search | string | Search by action or user email |

**Response (200 OK)**:
```json
{
  "logs": [
    {
      "id": "log_abc123",
      "admin": {
        "id": "admin_xyz789",
        "email": "admin@flowai.com"
      },
      "action": "change_role",
      "target_user": {
        "id": "user_def456",
        "email": "user@example.com"
      },
      "details": {
        "new_role": "moderator"
      },
      "created_at": "2024-11-25T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 87
  }
}
```

---

## 🔔 Webhooks

### Register Webhook

**Endpoint**: `POST /webhooks/register`  
**Description**: Register URL for event notifications  
**Auth**: Required

**Request**:
```json
{
  "url": "https://your-server.com/webhooks/flowai",
  "events": ["video.generation.complete", "subscription.created"],
  "secret": "your_webhook_secret_123"
}
```

**Response (201 Created)**:
```json
{
  "webhook_id": "wh_abc123",
  "url": "https://your-server.com/webhooks/flowai",
  "events": ["video.generation.complete"],
  "created_at": "2024-11-25T10:30:00Z"
}
```

---

### Webhook Payload Example

**Event**: `video.generation.complete`

**Payload**:
```json
{
  "event": "video.generation.complete",
  "timestamp": "2024-11-25T10:31:15Z",
  "data": {
    "task_id": "task_abc123xyz",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "video_url": "https://cdn.flowai.com/videos/550e8400.mp4",
    "thumbnail_url": "https://cdn.flowai.com/thumbnails/550e8400.jpg"
  }
}
```

**Headers**:
```http
X-FlowAI-Signature: sha256=abc123...
```

**Verify Signature** (Node.js):
```javascript
const crypto = require('crypto');

const signature = req.headers['x-flowai-signature'];
const expectedSignature = `sha256=${crypto
  .createHmac('sha256', YOUR_SECRET)
  .update(JSON.stringify(req.body))
  .digest('hex')}`;

if (signature !== expectedSignature) {
  throw new Error('Invalid signature');
}
```

---

## 📚 SDK Examples

### JavaScript/TypeScript

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.flowai.com/api/v1',
  headers: {
    'Authorization': `Bearer ${JWT_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// Generate video
const task = await api.post('/video/generate', {
  prompt: 'A cyberpunk city at night',
  duration: 4
});

// Poll for completion
const checkStatus = async (taskId: string) => {
  const { data } = await api.get(`/video/status/${taskId}`);
  if (data.status === 'complete') {
    console.log('Video ready:', data.video_url);
  } else {
    setTimeout(() => checkStatus(taskId), 5000);
  }
};

checkStatus(task.data.task_id);
```

---

### Python

```python
import requests
import time

headers = {
    'Authorization': f'Bearer {JWT_TOKEN}',
    'Content-Type': 'application/json'
}

# Generate video
response = requests.post(
    'https://api.flowai.com/api/v1/video/generate',
    json={'prompt': 'A cyberpunk city', 'duration': 4},
    headers=headers
)
task = response.json()

# Poll for completion
while True:
    status = requests.get(
        f'https://api.flowai.com/api/v1/video/status/{task["task_id"]}',
        headers=headers
    ).json()
    
    if status['status'] == 'complete':
        print(f"Video ready: {status['video_url']}")
        break
    time.sleep(5)
```

---

### cURL

```bash
# Generate video
curl -X POST https://api.flowai.com/api/v1/video/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A cyberpunk city", "duration": 4}'

# Check status
curl https://api.flowai.com/api/v1/video/status/task_abc123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get staking info
curl https://api.flowai.com/api/v1/staking/info \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📞 Support

**Developer Support**:
- **Email**: dev@flowai.com
- **Discord**: [#api-help](https://discord.gg/flowai)
- **Docs**: https://docs.flowai.com/api
- **Status**: https://status.flowai.com

**Rate Limit Increase**: Contact sales@flowai.com

---

**Document Version**: 2.0  
**Last Updated**: 2024-11-25  
**Contributors**: Backend Team, DevRel Team  
**Next Review**: 2024-12-25
