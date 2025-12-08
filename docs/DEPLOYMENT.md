# 🚀 FlowAI - Deployment Guide

> **Infrastructure, CI/CD, and Production Operations**  
> **Version**: 1.1  
> **Last Updated**: 2025-12-08  
> **Target Audience**: DevOps, SRE, Backend Engineers

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Environments](#environments)
3. [CI/CD Pipeline](#cicd-pipeline)
4. [Deployment Process](#deployment-process)
5. [Rollback Procedures](#rollback-procedures)
6. [Monitoring & Alerting](#monitoring--alerting)
7. [Secrets Management](#secrets-management)
8. [Disaster Recovery](#disaster-recovery)
9. [Scaling Strategy](#scaling-strategy)
10. [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture Overview

### Infrastructure Stack

```
┌─────────────────────────────────────────────────────────┐
│                    PRODUCTION ARCHITECTURE               │
└─────────────────────────────────────────────────────────┘

                    ┌──────────────┐
                    │   Route 53   │ (DNS)
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  CloudFront  │ (CDN)
                    └──────┬───────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
     ┌──────▼──────┐ ┌────▼────┐ ┌──────▼──────┐
     │   Vercel    │ │ Railway │ │  Supabase   │
     │  (Frontend) │ │(Backend)│ │  (Database) │
     └─────────────┘ └─────────┘ └─────────────┘
            │              │              │
            │              │              │
     ┌──────▼──────────────▼──────────────▼──────┐
     │            Monitoring & Logging            │
     │  Sentry | CloudWatch | Datadog (optional) │
     └────────────────────────────────────────────┘
```

### Service Breakdown

| Service | Provider | Purpose | Cost |
|---------|----------|---------|------|
| **Frontend** | Vercel | React SPA, edge functions | $20/mo (Pro) |
| **Backend API** | Railway | FastAPI, worker queues | $50/mo (Hobby+) |
| **Database** | Supabase (Lovable Cloud) | PostgreSQL, Auth, Storage | Usage-based |
| **Blockchain** | Polygon | Smart contracts (FLO token) | Gas fees only |
| **CDN** | CloudFront | Static assets, video cache | ~$50/mo |
| **Monitoring** | Sentry | Error tracking, performance | $26/mo (Team) |
| **CI/CD** | GitHub Actions | Automated testing & deploy | Free (public repo) |

**Total Infrastructure Cost**: ~$150-$200/month (early stage)

---

## 🌍 Environments

### 1. Development (Local)

**Purpose**: Individual developer workstations

```bash
# Start all services locally
docker-compose up

# Access points
Frontend:  http://localhost:80
Backend:   http://localhost:8000
Database:  localhost:5432 (via Supabase local)
```

**Environment Variables** (`.env.local`):
```bash
# Supabase (local instance)
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<local-anon-key>

# Backend
BACKEND_URL=http://localhost:8000

# Feature flags
ENABLE_TOKEN_ECONOMY=false
ENABLE_AI_GENERATION=true
```

**Database**: Supabase local dev instance
**Data**: Seeded with test data (see `backend/app/data/`)

---

### 2. Staging (staging.flowai.com)

**Purpose**: Pre-production testing, QA validation

```bash
# Deploy to staging (automatic on push to 'develop' branch)
git push origin develop
```

**Infrastructure**:
- Frontend: Vercel Preview Deployment
- Backend: Railway Staging Environment
- Database: Supabase Staging Project
- Blockchain: Polygon Mumbai Testnet

**Environment Variables** (Vercel + Railway):
```bash
# Supabase (staging project)
VITE_SUPABASE_URL=https://staging.supabase.co
VITE_SUPABASE_ANON_KEY=<staging-anon-key>

# Backend
BACKEND_URL=https://staging-api.railway.app

# Feature flags
ENABLE_TOKEN_ECONOMY=true
ENABLE_AI_GENERATION=true
LOG_LEVEL=debug
```

**Access Control**:
- Protected by HTTP Basic Auth (username: `flowai`, password: from 1Password)
- Or IP whitelist (office + team VPN IPs)

**Data**: Production-like data (sanitized copy, refreshed weekly)

---

### 3. Production (flowai.com)

**Purpose**: Live user-facing application

**Infrastructure**:
- Frontend: Vercel Production (flowai.com)
- Backend: Railway Production
- Database: Supabase Production
- Blockchain: Polygon Mainnet

**Environment Variables** (managed in Vercel/Railway dashboards):
```bash
# Supabase
VITE_SUPABASE_URL=https://zcuhvoyvutspcciyjohf.supabase.co
VITE_SUPABASE_ANON_KEY=<prod-anon-key>

# Backend
BACKEND_URL=https://api.flowai.com

# Feature flags
ENABLE_TOKEN_ECONOMY=true
ENABLE_AI_GENERATION=true
LOG_LEVEL=info

# Monitoring
VITE_SENTRY_DSN=<sentry-dsn>
SENTRY_TRACES_SAMPLE_RATE=0.1

# Payments
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_... (backend only)
```

**Deployment Approval**: Requires manual approval in GitHub Actions

**Data**: Live production data (backups every 6 hours)

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

**File**: `.github/workflows/ci.yml`

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  # ===== JOB 1: LINT & TEST =====
  lint-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      # Frontend
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install frontend dependencies
        run: npm ci

      - name: Lint frontend
        run: npm run lint

      - name: Test frontend
        run: npm test

      # Backend
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install backend dependencies
        working-directory: ./backend
        run: |
          pip install -r requirements.txt
          pip install flake8 pytest

      - name: Lint backend
        working-directory: ./backend
        run: flake8 .

      - name: Test backend
        working-directory: ./backend
        run: pytest --cov=app --cov-report=xml

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3

  # ===== JOB 2: BUILD =====
  build:
    needs: lint-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build frontend
        run: npm run build

      - name: Build backend Docker image
        working-directory: ./backend
        run: docker build -t flowai-backend:${{ github.sha }} .

  # ===== JOB 3: DEPLOY STAGING =====
  deploy-staging:
    needs: build
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Deploy frontend to Vercel (staging)
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
        run: |
          npm i -g vercel
          vercel --token $VERCEL_TOKEN --scope $VERCEL_ORG_ID

      - name: Deploy backend to Railway (staging)
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_STAGING_TOKEN }}
        run: |
          curl -L https://railway.app/install.sh | bash
          railway up --service backend --environment staging

  # ===== JOB 4: DEPLOY PRODUCTION =====
  deploy-production:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Manual Approval
        uses: trstringer/manual-approval@v1
        with:
          secret: ${{ secrets.GITHUB_TOKEN }}
          approvers: founder1,founder2,devops-lead

      - name: Deploy frontend to Vercel (production)
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
        run: |
          npm i -g vercel
          vercel --prod --token $VERCEL_TOKEN

      - name: Deploy backend to Railway (production)
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_PROD_TOKEN }}
        run: railway up --service backend --environment production

      - name: Run database migrations
        env:
          SUPABASE_DB_URL: ${{ secrets.SUPABASE_DB_URL }}
        run: |
          cd backend
          alembic upgrade head

      - name: Notify Slack
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "🚀 Production deployment completed",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Deployment Details*\nCommit: ${{ github.sha }}\nAuthor: ${{ github.actor }}\nTime: $(date -u)"
                  }
                }
              ]
            }
```

---

### Pipeline Stages

#### Stage 1: Code Quality (2-3 min)
```
┌─────────────┐
│   Linting   │ → ESLint (frontend), flake8 (backend)
├─────────────┤
│   Testing   │ → Jest (frontend), pytest (backend)
├─────────────┤
│  Coverage   │ → Codecov (target: >80%)
└─────────────┘
```

#### Stage 2: Build (3-5 min)
```
┌─────────────┐
│  npm build  │ → Vite production build
├─────────────┤
│Docker build │ → Backend container image
└─────────────┘
```

#### Stage 3: Deploy (5-8 min)
```
┌─────────────┐
│   Vercel    │ → Frontend to CDN edge nodes
├─────────────┤
│  Railway    │ → Backend to Railway infrastructure
├─────────────┤
│  Migrations │ → Database schema updates (if any)
└─────────────┘
```

#### Stage 4: Verification (2 min)
```
┌─────────────┐
│Health Checks│ → GET /health returns 200
├─────────────┤
│Smoke Tests  │ → Critical user flows (login, generate video)
├─────────────┤
│ Monitoring  │ → Sentry connected, logs flowing
└─────────────┘
```

**Total Pipeline Time**: ~12-18 minutes (depending on test suite)

---

## 📦 Deployment Process

### Frontend Deployment (Vercel)

**Automatic Deployments**:
- Every PR → Preview deployment (e.g., `pr-123-flowai.vercel.app`)
- Push to `develop` → Staging deployment
- Push to `main` → Production deployment (with approval)

**Manual Deployment**:
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to production
vercel --prod
```

**Environment Variables**:
- Managed in Vercel dashboard under "Settings → Environment Variables"
- Separate values for Preview, Staging, Production
- NEVER commit secrets to git

**Build Settings**:
```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm ci
Node.js Version: 18.x
```

---

### Backend Deployment (Railway)

**Automatic Deployments**:
- Push to `develop` → Staging environment
- Push to `main` → Production environment (with approval)

**Manual Deployment**:
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy to production
railway up --service backend --environment production
```

**Health Check Endpoint**:
```python
# backend/main.py
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": os.getenv("GIT_SHA", "unknown"),
        "database": await check_db_connection(),
        "redis": await check_redis_connection()
    }
```

**Zero-Downtime Deployment**:
- Railway uses rolling deployments (blue-green)
- New container starts before old one terminates
- Health check must pass before traffic switches

---

### Database Migrations (Supabase)

**Migration Files**: `supabase/migrations/`

**Development**:
```bash
# Create a new migration
supabase migration new add_user_credits_table

# Apply migrations locally
supabase db push

# Reset local database
supabase db reset
```

**Production**:
```bash
# Review pending migrations
supabase db diff

# Apply migrations (manual approval required)
supabase db push --db-url $SUPABASE_DB_URL

# Rollback last migration
supabase migration down 1
```

**Best Practices**:
- Always test migrations in staging first
- Use transactions (wrap in `BEGIN`/`COMMIT`)
- Write reversible migrations when possible
- Avoid data migrations in schema migrations (separate scripts)

---

### Edge Functions (Supabase)

**Deployment**:
```bash
# Deploy all edge functions
supabase functions deploy

# Deploy specific function
supabase functions deploy admin-change-role

# View logs
supabase functions logs admin-change-role
```

**Environment Variables**:
- Set in Supabase dashboard under "Edge Functions → Secrets"
- Example: `OPENAI_API_KEY`, `STRIPE_SECRET_KEY`

---

### Smart Contracts (Polygon)

**Deployment** (Hardhat):
```bash
cd contracts

# Compile contracts
npx hardhat compile

# Deploy to Mumbai testnet (staging)
npx hardhat run scripts/deploy.js --network mumbai

# Deploy to Polygon mainnet (production)
npx hardhat run scripts/deploy.js --network polygon

# Verify on Polygonscan
npx hardhat verify --network polygon <CONTRACT_ADDRESS>
```

**Post-Deployment**:
1. Update contract addresses in backend config
2. Verify on Polygonscan
3. Update documentation with new addresses
4. Test transactions on testnet first

**Contract Addresses** (Production):
```
FloToken:       0x...
FlowStaking:    0x...
FractionalNFT:  0x...
BountyEscrow:   0x...
```

---

## 🔙 Rollback Procedures

### Frontend Rollback (Vercel)

**Via Vercel Dashboard**:
1. Go to https://vercel.com/flowai/deployments
2. Find the last stable deployment
3. Click "..." → "Promote to Production"
4. Confirm

**Via CLI**:
```bash
vercel rollback
```

**Time to Rollback**: <2 minutes

---

### Backend Rollback (Railway)

**Via Railway Dashboard**:
1. Go to Railway dashboard → Backend service
2. Click "Deployments" tab
3. Find last stable deployment
4. Click "Redeploy"

**Via CLI**:
```bash
railway rollback
```

**Time to Rollback**: 3-5 minutes (container restart required)

---

### Database Rollback (Supabase)

**CRITICAL**: Database rollbacks are risky and should be last resort.

**Option 1: Migration Rollback** (if schema change only)
```bash
# Rollback last migration
supabase migration down 1

# Rollback to specific migration
supabase migration down --target 20240101000000
```

**Option 2: Point-in-Time Recovery** (if data loss)
```sql
-- Restore from automated backup (Supabase dashboard)
-- Settings → Database → Backups → Restore
```

**Option 3: Manual Data Fix** (preferred when possible)
```sql
-- Example: Undo accidental column deletion
ALTER TABLE users ADD COLUMN deleted_column TEXT;
UPDATE users SET deleted_column = backup_data FROM backup_table;
```

**Time to Rollback**: 10-60 minutes (depending on database size)

---

### Rollback Decision Matrix

| Issue | Severity | Rollback Strategy | SLA |
|-------|----------|-------------------|-----|
| Frontend bug (visual only) | Low | Hotfix in new deploy | 4 hours |
| Frontend crash (app broken) | Critical | Immediate rollback | 15 min |
| Backend bug (minor feature) | Low | Hotfix + test + deploy | 2 hours |
| Backend crash (API down) | Critical | Immediate rollback | 15 min |
| Database migration error | High | Rollback migration | 30 min |
| Data corruption | Critical | PITR + manual fix | 1-2 hours |

---

## 📊 Monitoring & Alerting

### Sentry Configuration

**Frontend** (`src/sentry.config.ts`):
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE, // 'production' or 'development'
  
  // Performance Monitoring
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  
  // Sample rates
  tracesSampleRate: 0.1, // 10% of transactions
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of error sessions
  
  // Release tracking
  release: import.meta.env.VITE_GIT_SHA,
  
  // Ignore common errors
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
  ],
});
```

**Backend** (`backend/main.py`):
```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    environment=os.getenv("ENVIRONMENT", "production"),
    traces_sample_rate=0.1,
    profiles_sample_rate=0.1,
    integrations=[FastApiIntegration()],
    release=os.getenv("GIT_SHA"),
)
```

---

### Key Metrics to Monitor

#### Application Health
```
┌─────────────────────────────────────────┐
│ Uptime:         99.95% (last 30 days)   │
│ Response Time:  <200ms (p95)            │
│ Error Rate:     <0.5%                   │
│ Apdex Score:    >0.9                    │
└─────────────────────────────────────────┘
```

#### Business Metrics
```
┌─────────────────────────────────────────┐
│ New Signups:    50/day                  │
│ Video Generations: 500/day              │
│ MRR:            $10k                    │
│ Churn Rate:     8%/month                │
└─────────────────────────────────────────┘
```

#### Infrastructure
```
┌─────────────────────────────────────────┐
│ CPU Usage:      40% (avg)               │
│ Memory Usage:   60% (avg)               │
│ Database Load:  25% (connections)       │
│ CDN Bandwidth:  2TB/month               │
└─────────────────────────────────────────┘
```

---

### Alert Rules

| Alert | Condition | Severity | Notification |
|-------|-----------|----------|--------------|
| **API Down** | Healthcheck fails 3x in 2 min | Critical | PagerDuty + Slack |
| **High Error Rate** | >5% errors in 5 min | High | Slack |
| **Slow Responses** | p95 >1s for 10 min | Medium | Slack |
| **Database Lag** | Replication lag >30s | High | Slack + Email |
| **Disk Full** | >85% disk usage | High | Slack + Email |
| **SSL Expiring** | <14 days until expiry | Medium | Email |
| **High Churn** | >15% monthly churn | Medium | Email (weekly) |

**PagerDuty Escalation**:
1. On-call engineer (immediate)
2. Engineering lead (after 15 min)
3. CTO (after 30 min)

---

### Log Aggregation

**Vercel Logs** (Frontend):
- Access via: https://vercel.com/flowai/logs
- Retention: 7 days (Hobby plan) / 30 days (Pro plan)

**Railway Logs** (Backend):
- Access via: Railway dashboard → Backend → Logs
- Retention: 7 days

**Supabase Logs** (Database):
- Access via: Lovable Cloud UI → Database → Logs
- Types: postgres_logs, auth_logs, function_edge_logs

**Centralized Logging** (Optional):
- **Tool**: Datadog or Logtail
- **Cost**: ~$100/month
- **Benefit**: Cross-service correlation, longer retention

---

## 🔐 Secrets Management

### Secrets Inventory

**Lovable Cloud Secrets** (managed via Lovable UI):
```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_DB_URL
```

**Vercel Environment Variables**:
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_SENTRY_DSN
VITE_STRIPE_PUBLIC_KEY
```

**Railway Environment Variables**:
```
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
OPENAI_API_KEY
JWT_SECRET
WEB3_PRIVATE_KEY
POLYGON_RPC_URL
```

**GitHub Secrets** (for CI/CD):
```
VERCEL_TOKEN
RAILWAY_PROD_TOKEN
RAILWAY_STAGING_TOKEN
CODECOV_TOKEN
SLACK_WEBHOOK
```

---

### Secret Rotation Policy

| Secret | Rotation Frequency | Owner | Last Rotated |
|--------|-------------------|-------|--------------|
| JWT_SECRET | Every 90 days | Backend Lead | 2024-10-01 |
| Stripe API Keys | Annually | Finance | 2024-01-15 |
| Supabase Service Role | Annually | DevOps | 2024-03-20 |
| Web3 Private Key | Never (unless compromised) | CTO | N/A |
| GitHub Tokens | Every 180 days | DevOps | 2024-06-10 |

**Rotation Process**:
1. Generate new secret in provider dashboard
2. Update in Vercel/Railway/GitHub Secrets
3. Deploy to staging → test → deploy to production
4. Revoke old secret after 24-hour grace period
5. Document rotation date in 1Password

---

## 🛡️ Disaster Recovery

### Backup Strategy

#### Database Backups
```
Automated (Supabase):
├─ Point-in-Time Recovery: Last 7 days (hourly granularity)
├─ Daily Backups: Retained for 30 days
└─ Weekly Backups: Retained for 1 year

Manual:
└─ Before major migrations: pg_dump to S3
```

**Restore Time**: 10-30 minutes (depending on size)

#### Code Repository
```
GitHub:
├─ Main branch: Protected (requires PR + review)
├─ Develop branch: Active development
└─ Release tags: v1.0.0, v1.1.0, etc.

Mirrors:
└─ GitLab (synced daily, backup)
```

**Restore Time**: 5 minutes (clone + deploy)

#### File Storage (Supabase Storage)
```
Buckets:
├─ user-avatars: Synced to S3 (weekly)
├─ generated-videos: Retained 90 days (then archived)
└─ style-pack-assets: Permanent retention

Backup:
└─ S3 Glacier Deep Archive (cost: ~$1/TB/month)
```

**Restore Time**: 12 hours (Glacier retrieval)

---

### Disaster Scenarios & Recovery

#### Scenario 1: Complete Regional Outage (AWS US-East-1)
**Probability**: Very Low (0.1% annually)

**Impact**:
- Vercel (multi-region) → Unaffected
- Railway (uses US-East-1) → Backend down
- Supabase (US-East-1) → Database down

**Recovery Plan**:
1. **Immediate** (T+0 to T+30 min): Enable "Maintenance Mode" page on Vercel
2. **Short-term** (T+30 min to T+2 hours): 
   - Spin up new Railway service in US-West-2
   - Restore database from last backup to Supabase US-West-2
   - Update DNS to point to new backend
3. **Long-term** (T+2 hours to T+24 hours):
   - Migrate back to US-East-1 once restored
   - Post-mortem and process improvements

**RTO (Recovery Time Objective)**: 2 hours  
**RPO (Recovery Point Objective)**: 1 hour (last hourly backup)

---

#### Scenario 2: Data Breach / Ransomware
**Probability**: Low (1% annually)

**Impact**: User data compromised, database encrypted

**Recovery Plan**:
1. **Immediate** (T+0 to T+10 min):
   - Shut down all services (kill switch)
   - Rotate all secrets (API keys, DB passwords)
   - Contact security team + legal
2. **Investigation** (T+10 min to T+4 hours):
   - Forensic analysis of attack vector
   - Identify compromised data scope
   - Preserve logs for legal/insurance
3. **Recovery** (T+4 hours to T+24 hours):
   - Restore from last clean backup (pre-breach)
   - Patch vulnerability
   - Re-deploy with new secrets
4. **Communication** (T+24 hours):
   - Notify affected users (GDPR compliance)
   - Public statement on website/blog
   - Submit breach report to authorities

**RTO**: 24 hours  
**RPO**: Up to 24 hours (data loss acceptable in breach scenario)

---

#### Scenario 3: Accidental Data Deletion
**Probability**: Medium (5% annually)

**Example**: Engineer runs `DELETE FROM users WHERE ...` with wrong condition

**Recovery Plan**:
1. **Immediate** (T+0 to T+5 min):
   - Stop all database writes (kill active connections)
   - Identify deleted rows (from logs or table snapshots)
2. **Restore** (T+5 min to T+30 min):
   - Use Point-in-Time Recovery to 5 minutes before deletion
   - Or restore specific table from backup and merge
3. **Verification** (T+30 min to T+1 hour):
   - Compare row counts before/after
   - Spot-check critical user accounts
   - Resume normal operations

**RTO**: 1 hour  
**RPO**: 5 minutes (PITR granularity)

---

## 📈 Scaling Strategy

### Current Capacity (as of 2024)

```
Users:          1,000
Requests/min:   100 (avg), 500 (peak)
Database:       1GB (data), 50 connections (max)
Compute:        2 vCPU, 4GB RAM (backend)
Bandwidth:      500GB/month
```

### Scaling Triggers

| Metric | Current | Yellow | Red | Action |
|--------|---------|--------|-----|--------|
| **Requests/min** | 100 | 1,000 | 5,000 | Scale backend horizontally |
| **Database Size** | 1GB | 50GB | 100GB | Migrate to dedicated instance |
| **DB Connections** | 50 | 200 | 400 | Connection pooling (PgBouncer) |
| **CPU Usage** | 40% | 70% | 85% | Increase container size |
| **Response Time** | 200ms | 500ms | 1000ms | Add caching (Redis) |

---

### Horizontal Scaling (Backend)

**Railway Auto-Scaling**:
```yaml
# railway.json
{
  "deploy": {
    "numReplicas": 3,
    "autoscaling": {
      "enabled": true,
      "minReplicas": 2,
      "maxReplicas": 10,
      "targetCPU": 70,
      "targetMemory": 80
    }
  }
}
```

**Load Balancing**: Automatic (Railway's ingress load balancer)

**Cost Impact**: ~$50/month per additional replica

---

### Vertical Scaling (Database)

**Supabase Instance Sizes**:
| Tier | vCPU | RAM | Storage | Connections | Price |
|------|------|-----|---------|-------------|-------|
| **Free** | Shared | 0.5GB | 500MB | 60 | $0 |
| **Pro** | 2 | 8GB | 8GB | 200 | $25/mo |
| **Team** | 4 | 16GB | 50GB | 400 | $599/mo |
| **Enterprise** | Custom | Custom | Custom | Custom | Contact |

**Migration Path**:
- Start: Free tier (current)
- 1k users: Pro tier
- 10k users: Team tier
- 50k+ users: Enterprise tier

---

### Caching Strategy

**Layer 1: CDN (CloudFront)**
- Cache static assets (JS, CSS, images)
- TTL: 1 year (cache-busting via hashed filenames)
- Cost: ~$0.085/GB

**Layer 2: Redis (Upstash)**
- Cache API responses (user profiles, video metadata)
- TTL: 5-60 minutes (depending on data type)
- Cost: $10/month (starter)

**Layer 3: Application (In-Memory)**
- Cache database query results
- TTL: 1-5 minutes
- Cost: Free (uses existing RAM)

---

## 🔧 Troubleshooting

### Common Issues

#### Issue 1: Frontend Build Fails on Vercel

**Symptoms**:
```
Error: Build failed with exit code 1
Module not found: Can't resolve '@/components/...'
```

**Causes**:
- Incorrect import paths (case sensitivity)
- Missing dependency in package.json
- Node version mismatch

**Solution**:
```bash
# Test locally first
npm run build

# Check Node version matches Vercel (18.x)
node --version

# Clear Vercel build cache
vercel build --force
```

---

#### Issue 2: Backend Container Crashes on Railway

**Symptoms**:
```
Container exited with code 137 (OOMKilled)
```

**Causes**:
- Memory limit exceeded (default: 512MB)
- Memory leak in application code

**Solution**:
```bash
# Increase memory limit in Railway dashboard
# Settings → Resources → Memory → 1GB

# Identify memory leak (locally)
docker stats
# or
node --inspect backend/main.py
```

---

#### Issue 3: Database Connection Pool Exhausted

**Symptoms**:
```
Error: sorry, too many clients already (max 60)
```

**Causes**:
- Not closing connections properly
- Too many concurrent requests
- Connection leak in ORM (SQLAlchemy)

**Solution**:
```python
# Use connection pooling (PgBouncer)
# Or increase max_connections in Supabase dashboard

# Proper connection management
from contextlib import asynccontextmanager

@asynccontextmanager
async def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

---

#### Issue 4: Slow API Response Times

**Symptoms**:
- p95 response time >1s
- Timeout errors on frontend

**Causes**:
- N+1 query problem
- Missing database indexes
- Expensive AI model calls

**Debugging**:
```bash
# Enable query logging
export LOG_SQL_QUERIES=true

# Analyze slow queries in Supabase
SELECT * FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

# Profile FastAPI endpoint
import time
@app.middleware("http")
async def add_process_time_header(request, call_next):
    start = time.time()
    response = await call_next(request)
    response.headers["X-Process-Time"] = str(time.time() - start)
    return response
```

**Solutions**:
- Add database indexes
- Implement caching (Redis)
- Use async/await properly
- Move AI calls to background jobs (Celery)

---

### Emergency Contacts

| Role | Name | Email | Phone | Timezone |
|------|------|-------|-------|----------|
| **CTO** | [Name] | cto@flowai.com | +1-XXX-XXX-XXXX | PST |
| **DevOps Lead** | [Name] | devops@flowai.com | +1-XXX-XXX-XXXX | EST |
| **Backend Lead** | [Name] | backend@flowai.com | +1-XXX-XXX-XXXX | CET |
| **On-Call (Current)** | Check PagerDuty | - | - | - |

**Escalation Path**:
1. On-call engineer (PagerDuty)
2. DevOps Lead (after 15 min)
3. CTO (after 30 min)
4. CEO (only for PR/legal issues)

---

## 📚 Additional Resources

- **Runbooks**: `/docs/runbooks/` (incident-specific procedures)
- **Architecture Diagrams**: `/docs/ARCHITECTURE.md`
- **API Documentation**: `/docs/API_REFERENCE.md`
- **Database Schema**: `/docs/DATABASE.md`
- **Supabase Dashboard**: [Lovable Cloud UI]
- **Vercel Dashboard**: https://vercel.com/flowai
- **Railway Dashboard**: https://railway.app/project/flowai
- **Sentry Dashboard**: https://sentry.io/flowai
- **Status Page**: https://status.flowai.com (to be built)

---

**Document Maintainers**:
- **Primary**: DevOps Lead
- **Secondary**: CTO
- **Review Frequency**: Quarterly
- **Last Updated**: 2024-11-25
- **Next Review**: 2025-02-25
