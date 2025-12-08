# 📤 Multi-Platform Syndication - Documentation

> **Version**: 1.0.0  
> **Last Updated**: 2025-12-08  
> **Status**: ✅ Implemented

---

## Overview

Publish content to YouTube, TikTok, Instagram, and Twitter from one dashboard. Connect accounts, create posts, and syndicate with a single click.

---

## Supported Platforms

| Platform | Icon | Features |
|----------|------|----------|
| YouTube | 📺 | Videos, Shorts |
| TikTok | 🎵 | Videos, Duets |
| Instagram | 📸 | Reels, Posts |
| Twitter/X | 🐦 | Videos, Threads |
| Facebook | 📘 | Videos, Posts |
| LinkedIn | 💼 | Videos, Articles |

---

## Database Schema (4 Tables)

| Table | Purpose |
|-------|---------|
| `connected_platforms` | OAuth tokens & account info |
| `syndication_posts` | Content to publish |
| `syndication_post_platforms` | Per-platform results |
| `syndication_schedules` | Scheduled publishing |

---

## API Reference

**Endpoint**: `POST /functions/v1/syndication`

| Action | Description |
|--------|-------------|
| `get_platforms` | List supported platforms |
| `get_connected` | User's connected accounts |
| `connect_platform` | Connect new account |
| `disconnect_platform` | Remove account |
| `create_post` | Create new post |
| `publish_now` | Publish immediately |
| `get_my_posts` | List user's posts |

---

## Files

| File | Purpose |
|------|---------|
| [20251208215700_syndication.sql](file:///c:/Users/Manu/FlowAI/flowaicontent-10/supabase/migrations/20251208215700_syndication.sql) | Database |
| [syndication/index.ts](file:///c:/Users/Manu/FlowAI/flowaicontent-10/supabase/functions/syndication/index.ts) | Edge Function |
| [Syndication.tsx](file:///c:/Users/Manu/FlowAI/flowaicontent-10/src/pages/Syndication.tsx) | UI Page |

---

## Route: `/syndication`

---

## Deployment

```bash
npx supabase db push
npx supabase functions deploy syndication
```

---

## OAuth Setup (Production)

To enable real platform connections, configure these secrets:

```
YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET
TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET
INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET
TWITTER_API_KEY, TWITTER_API_SECRET
```
