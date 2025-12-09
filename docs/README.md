# FlowAI Documentation

Technical reference for the FlowAI content creation platform.

## Quick Links

| Category | Document |
|----------|----------|
| **Architecture** | [System Design](ARCHITECTURE.md) |
| **Deployment** | [Deploy Guide](DEPLOYMENT.md) |
| **API** | [API Reference](API_REFERENCE.md) |
| **Security** | [Security Policy](SECURITY.md) |

## Features

| Feature | Documentation |
|---------|---------------|
| Video Editor | [Video Editor Pro](VIDEO_EDITOR_PRO.md) |
| Voice Cloning | [Voice Cloning](VOICE_CLONING.md) |
| Video Dubbing | [Video Dubbing](VIDEO_DUBBING.md) |
| Thumbnails | [Thumbnail Generator](THUMBNAIL_GENERATOR.md) |
| Credits | [FlowCredits Billing](CREDITS_SYSTEM.md) |

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Vite, TailwindCSS |
| Backend | Supabase (PostgreSQL, Edge Functions) |
| AI | OpenAI, ElevenLabs, Fal.ai |
| Payments | Stripe |

## Deployment

```bash
# Database
npx supabase db push

# Edge Functions
npx supabase functions deploy --all
```

## Security

- Row-level security on all tables
- JWT authentication via Supabase Auth
- Rate limiting on Edge Functions
- See [Security Audit](SECURITY_AUDIT_2025-12.md) for latest review
