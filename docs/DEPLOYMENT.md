# Deployment Guide

Instructions for deploying and operating FlowAI.

## Infrastructure

| Service | Provider | Purpose |
|---------|----------|---------|
| Frontend | Vercel | React SPA |
| Database | Supabase | PostgreSQL + Auth |
| Edge Functions | Supabase | Serverless API |
| Backend | Railway | FastAPI (optional) |

## Environments

| Environment | Branch | URL |
|-------------|--------|-----|
| Development | `develop` | localhost |
| Staging | `staging` | staging.flowai.app |
| Production | `main` | app.flowai.app |

## Frontend Deployment (Vercel)

1. Connect GitHub repository
2. Set environment variables:
   ```
   VITE_SUPABASE_URL=https://xxx.supabase.co
   VITE_SUPABASE_ANON_KEY=xxx
   ```
3. Deploy triggers on push to `main`

## Database Deployment (Supabase)

```bash
# Apply migrations
npx supabase db push

# Deploy Edge Functions
npx supabase functions deploy --all
```

## Required Secrets

### Supabase Edge Functions

Add via Supabase Dashboard → Edge Functions → Secrets:

| Secret | Source |
|--------|--------|
| `OPENAI_API_KEY` | OpenAI |
| `ELEVENLABS_API_KEY` | ElevenLabs |
| `AWS_ACCESS_KEY_ID` | AWS IAM |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM |

## CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/ci.yml`):

1. **Lint** - ESLint + TypeScript check
2. **Test** - Vitest unit tests
3. **Build** - Vite production build
4. **Deploy** - Vercel + Supabase

## Rollback

```bash
# Revert database migration
npx supabase db reset --version <previous>

# Redeploy previous Edge Function
npx supabase functions deploy <function-name> --version <previous>
```

## Monitoring

| Tool | Purpose |
|------|---------|
| Sentry | Error tracking |
| Supabase Dashboard | Database metrics |
| Vercel Analytics | Frontend performance |

## Health Checks

- Frontend: `https://app.flowai.app`
- Edge Functions: `https://xxx.supabase.co/functions/v1/health`

## Scaling

| Component | Strategy |
|-----------|----------|
| Frontend | Vercel Edge Network (automatic) |
| Database | Connection pooling, read replicas |
| Edge Functions | Auto-scaling (Supabase managed) |

## Cost Estimates

| Tier | Monthly Cost |
|------|--------------|
| Development | Free |
| Production (small) | ~$100 |
| Production (growth) | ~$300 |
