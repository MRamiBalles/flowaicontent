# 📱 FlowAI Mobile App - Documentation

> **Feature**: FlowAI Mobile App  
> **Version**: 1.0.0  
> **Last Updated**: 2025-12-08  
> **Status**: ✅ Implemented

---

## Overview

Cross-platform mobile application (iOS/Android) ensuring FlowAI creators can manage their studio on the go. Includes push notifications, remote stream management, and analytics.

---

## Database Schema (3 Tables)

| Table | Purpose |
|-------|---------|
| `mobile_devices` | Device registry (FCM tokens) |
| `mobile_sync_events` | Data sync queue |
| `mobile_app_config` | Remote feature flags |

---

## API Reference

**Endpoint**: `POST /functions/v1/mobile-api`

| Action | Description |
|--------|-------------|
| `register_device` | Save FCM token |
| `get_sync_data` | Fetch pending updates |
| `check_config` | Get feature flags |

---

## Features

- **Push Notifications**: Live stream alerts, sale notifications (Brand Deals/NFTs)
- **Sync**: Background data synchronization for offline access
- **Remote Config**: Enable/Disable features without app store updates

---

## Files Created

| File | Purpose |
|------|---------|
| [20251208170900_mobile_app.sql](file:///c:/Users/Manu/FlowAI/flowaicontent-10/supabase/migrations/20251208170900_mobile_app.sql) | Database |
| [mobile-api/index.ts](file:///c:/Users/Manu/FlowAI/flowaicontent-10/supabase/functions/mobile-api/index.ts) | Edge Function |
| [MobileApp.tsx](file:///c:/Users/Manu/FlowAI/flowaicontent-10/src/pages/MobileApp.tsx) | Landing Page |
| [capacitor.config.json](file:///c:/Users/Manu/FlowAI/flowaicontent-10/capacitor.config.json) | App Config |

---

## Route: `/mobile`

---

## Deployment

```bash
npx supabase db push
npx supabase functions deploy mobile-api
```
