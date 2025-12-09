# Video Dubbing

AI-powered video translation and dubbing using OpenAI + ElevenLabs.

## Features

- 29 language support
- Automatic transcription
- AI translation
- Voice synthesis with cloned voices

## Supported Languages

English, Spanish, French, German, Italian, Portuguese, Polish, Dutch, Russian, Norwegian, Romanian, Hungarian, Indonesian, Thai, Bulgarian, Japanese, Korean, Chinese, Arabic, Hindi, Turkish, Swedish, Danish, Finnish, Czech, Greek, Ukrainian, Malay, Vietnamese

## Database Tables

| Table | Purpose |
|-------|---------|
| `dub_languages` | Language reference (29 entries) |
| `video_dub_jobs` | Job tracking with status |
| `video_dub_history` | Per-language results |

## API

**Endpoint**: `POST /functions/v1/video-dubbing`

| Action | Description |
|--------|-------------|
| `get_languages` | List supported languages |
| `create_job` | Start dubbing job |
| `get_job_status` | Check progress |
| `translate_text` | Translate via OpenAI |

## Workflow

1. Upload video
2. Select target languages
3. Transcribe audio (Whisper)
4. Translate text (GPT)
5. Generate voice (ElevenLabs)
6. Sync and download

## Pricing

| Languages | Credits/min |
|-----------|-------------|
| 1 | ~130 |
| 5 | ~660 |
| 10 | ~1,320 |
| All 29 | ~3,800 |

## Deployment

```bash
npx supabase db push
npx supabase functions deploy video-dubbing
```

## Files

| Path | Purpose |
|------|---------|
| `supabase/functions/video-dubbing/index.ts` | Edge Function |
| `src/pages/VideoDubbing.tsx` | UI component |
