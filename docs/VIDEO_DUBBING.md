# 🌍 AI Video Dubbing - Documentation

> **Version**: 1.0.0  
> **Last Updated**: 2025-12-08  
> **Status**: ✅ Implemented

---

## Overview

Automatically translate and dub videos into **29 languages** using AI translation (OpenAI) and voice synthesis (ElevenLabs). Users can use their own cloned voice for authentic dubbing.

---

## Supported Languages (29)

| Language | Code | Language | Code |
|----------|------|----------|------|
| English | en | Japanese | ja |
| Spanish | es | Korean | ko |
| French | fr | Chinese | zh |
| German | de | Arabic | ar |
| Italian | it | Hindi | hi |
| Portuguese | pt | Turkish | tr |
| Polish | pl | Swedish | sv |
| Dutch | nl | Danish | da |
| Russian | ru | Finnish | fi |
| Norwegian | no | Czech | cs |
| Romanian | ro | Greek | el |
| Hungarian | hu | Ukrainian | uk |
| Indonesian | id | Malay | ms |
| Thai | th | Vietnamese | vi |
| Bulgarian | bg | | |

---

## Database Schema (3 Tables)

| Table | Purpose |
|-------|---------|
| `dub_languages` | Reference table with 29 supported languages |
| `video_dub_jobs` | Job tracking with status and outputs |
| `video_dub_history` | Per-language dubbing results |

---

## API Reference

**Endpoint**: `POST /functions/v1/video-dubbing`

| Action | Description |
|--------|-------------|
| `get_languages` | Fetch supported languages |
| `create_job` | Create new dubbing job |
| `get_job_status` | Check job progress |
| `get_my_jobs` | List user's jobs |
| `translate_text` | Translate text via OpenAI |

---

## Workflow

```mermaid
graph LR
    A[Upload Video] --> B[Select Languages]
    B --> C[Transcribe Audio]
    C --> D[Translate Text]
    D --> E[Generate Voice]
    E --> F[Sync Audio]
    F --> G[Download Dubs]
```

---

## Files Created

| File | Purpose |
|------|---------|
| [20251208214400_video_dubbing.sql](file:///c:/Users/Manu/FlowAI/flowaicontent-10/supabase/migrations/20251208214400_video_dubbing.sql) | Database |
| [video-dubbing/index.ts](file:///c:/Users/Manu/FlowAI/flowaicontent-10/supabase/functions/video-dubbing/index.ts) | Edge Function |
| [VideoDubbing.tsx](file:///c:/Users/Manu/FlowAI/flowaicontent-10/src/pages/VideoDubbing.tsx) | UI Page |

---

## Route: `/dubbing`

---

## Deployment

```bash
npx supabase db push
npx supabase functions deploy video-dubbing
```

---

## Pricing

| Languages | Estimated Credits |
|-----------|------------------|
| 1 | ~130 per minute |
| 5 | ~660 per minute |
| 10 | ~1,320 per minute |
| All 29 | ~3,800 per minute |
