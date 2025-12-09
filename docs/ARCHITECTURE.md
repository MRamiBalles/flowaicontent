# System Architecture

Technical overview of FlowAI's infrastructure.

## Components

| Layer | Technology | Hosting |
|-------|------------|---------|
| Frontend | React 18 + Vite | Vercel |
| Database | PostgreSQL 15 | Supabase |
| Auth | Supabase Auth | Supabase |
| Serverless | Deno Edge Functions | Supabase |
| Backend API | FastAPI | Railway |
| Storage | S3-compatible | Supabase/AWS |

## System Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React SPA     │────▶│    Supabase     │────▶│   External AI   │
│   (Vercel)      │     │   (Postgres +   │     │  (OpenAI, 11L)  │
│                 │     │  Edge Functions)│     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                      │
         │                      ▼
         │              ┌─────────────────┐
         └─────────────▶│   FastAPI       │
                        │   (Railway)     │
                        └─────────────────┘
```

## Data Flow

1. **User Request** → React SPA
2. **Auth Check** → Supabase Auth (JWT)
3. **Data Query** → PostgreSQL with RLS
4. **AI Operations** → Edge Functions → External APIs
5. **Response** → Client with real-time updates

## Database

PostgreSQL with row-level security. Key tables:

| Table | Purpose |
|-------|---------|
| `video_projects` | Editor projects |
| `video_tracks` | Timeline tracks |
| `video_clips` | Media clips |
| `user_credits` | Credit balances |
| `credit_transactions` | Billing ledger |
| `voice_clones` | Cloned voices |

## Edge Functions

Serverless functions handling AI and billing:

| Function | Purpose |
|----------|---------|
| `billing-engine` | Credit management |
| `generate-content` | AI text generation |
| `generate-subtitles` | Whisper transcription |
| `video-dubbing` | Translation + voice |
| `generate-thumbnail` | DALL-E images |
| `render-video` | Remotion → Lambda |

## Security Layers

1. **Authentication**: Supabase Auth with JWT
2. **Authorization**: RLS policies per table
3. **Rate Limiting**: Per-user request limits
4. **Input Validation**: Prompt injection protection

## Scalability

| Component | Strategy |
|-----------|----------|
| Frontend | CDN (Vercel Edge) |
| Database | Connection pooling |
| Edge Functions | Auto-scaling (Supabase) |
| Video Render | AWS Lambda parallel |

## Environment Variables

### Frontend (.env)
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### Edge Functions (Supabase Secrets)
```
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
ELEVENLABS_API_KEY
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
```
