# Voice Cloning

AI voice cloning and text-to-speech system powered by ElevenLabs.

## Requirements

- Subscription: Pro or higher
- ElevenLabs API key configured in Supabase secrets

## Database Schema

### `voice_clones`

User's cloned voices.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Owner |
| `elevenlabs_voice_id` | TEXT | ElevenLabs voice ID |
| `name` | TEXT | Display name |
| `language` | TEXT | Voice language (en, es, etc.) |
| `status` | TEXT | `active` / `processing` / `failed` |
| `consent_given` | BOOL | Required legal consent |
| `consent_timestamp` | TIMESTAMPTZ | Audit timestamp |

### `voice_generations`

Text-to-speech generation log.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `voice_clone_id` | UUID | Source voice |
| `input_text` | TEXT | Text converted |
| `output_audio_url` | TEXT | Generated audio URL |
| `credits_consumed` | INT | Credits used |

## API

### Clone Voice

```
POST /functions/v1/voice-clone
Content-Type: multipart/form-data

audio_file: File (MP3/WAV, max 10MB)
name: string
consent_confirmed: "true"
```

Response:
```json
{
  "success": true,
  "voice_id": "uuid"
}
```

### Text-to-Speech

```
POST /functions/v1/text-to-speech
Content-Type: application/json

{
  "voice_id": "uuid",
  "text": "Hello world",
  "stability": 0.5,
  "similarity_boost": 0.75
}
```

Response:
```json
{
  "success": true,
  "audio_url": "https://...",
  "duration_seconds": 2.5,
  "credits_consumed": 25
}
```

## Subscription Limits

| Feature | Pro | Business |
|---------|-----|----------|
| Voice clones | 3 | 10 |
| TTS minutes/month | 30 | 120 |
| Languages | 5 | 29 |

## Consent Requirements

Voice cloning requires explicit consent for GDPR/CCPA compliance:

1. User confirms voice ownership via checkbox
2. System records timestamp and IP address
3. User can delete voice at any time (removes from ElevenLabs)

## Files

| Path | Purpose |
|------|---------|
| `supabase/functions/voice-clone/index.ts` | Clone endpoint |
| `supabase/functions/text-to-speech/index.ts` | TTS endpoint |
| `src/pages/VoiceStudio.tsx` | UI component |

## Configuration

1. Get API key from [ElevenLabs](https://elevenlabs.io)
2. Add `ELEVENLABS_API_KEY` to Supabase Edge Function secrets
3. Deploy: `npx supabase functions deploy voice-clone text-to-speech`
