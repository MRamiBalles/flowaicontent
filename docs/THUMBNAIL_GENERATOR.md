# Thumbnail Generator

AI-generated thumbnails using DALL-E 3.

## Features

- 6 style presets
- 8 category templates
- Generation history

## Styles

| Style | Description |
|-------|-------------|
| Vibrant | Bold, eye-catching colors |
| Minimal | Clean and simple |
| Dramatic | Cinematic lighting |
| Retro | 80s synthwave |
| Neon | Cyberpunk glow |
| Professional | Corporate clean |

## Templates

Gaming Epic, Vlog Clean, Tutorial Pro, Podcast Wave, Tech Review, Music Vibe, News Alert, Lifestyle Glow

## Database

| Table | Purpose |
|-------|---------|
| `thumbnail_templates` | Style templates |
| `thumbnail_generations` | User history |

## API

**Endpoint**: `POST /functions/v1/generate-thumbnail`

| Action | Description |
|--------|-------------|
| `get_templates` | List templates |
| `generate` | Create thumbnail |
| `get_my_generations` | User history |

## Configuration

Required secret: `OPENAI_API_KEY`

## Deployment

```bash
npx supabase db push
npx supabase functions deploy generate-thumbnail
```

## Files

| Path | Purpose |
|------|---------|
| `supabase/functions/generate-thumbnail/index.ts` | Edge Function |
| `src/pages/ThumbnailGenerator.tsx` | UI component |
