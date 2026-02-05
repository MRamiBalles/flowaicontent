# 🌊 FlowAI - AI Content Studio & Creator Platform

> **Enterprise-grade AI content creation platform** combining multi-modal AI generation, Web3 ownership, token economics, and creator monetization.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

---

## 🎯 Overview

FlowAI is a comprehensive creator platform that enables:

- **AI Content Generation**: Multi-platform content (Twitter, LinkedIn, Instagram) with AI-powered suggestions
- **Video Production**: Professional video rendering with Remotion + AWS Lambda
- **Voice Services**: ElevenLabs voice cloning & text-to-speech (29 languages)
- **Token Economics**: $FLOW token staking with 8-20% APY
- **DAO Governance**: Democratic voting (1 token = 1 vote)
- **Creator Analytics**: Real-time SaaS metrics (MRR, ARR, churn, LTV/CAC)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Supabase** account (free tier available)
- **API Keys**: OpenAI, ElevenLabs, Stripe (optional for testing)

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/flowaicontent.git
cd flowaicontent-11

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your credentials

# Run development server
npm run dev
```

### Environment Variables

```bash
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# Edge Functions (Server-side)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_key
ELEVENLABS_API_KEY=your_elevenlabs_key
LOVABLE_API_KEY=your_lovable_ai_key
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_webhook_secret
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
REMOTION_SERVE_URL=your_s3_bucket_url
```

---

## 📂 Project Structure

```
flowaicontent-11/
├── src/
│   ├── components/        # React components
│   │   ├── ui/           # Shadcn/ui primitives
│   │   ├── layout/       # Layout components
│   │   └── ...           # Feature components
│   ├── pages/            # Route pages
│   ├── hooks/            # Custom React hooks (100% documented)
│   ├── lib/              # Utilities & helpers
│   └── i18n/             # Internationalization (EN, ES)
├── supabase/
│   ├── functions/        # Edge Functions (serverless)
│   └── migrations/       # Database migrations
└── docs/                 # Documentation
    ├── MONETIZATION.md
    ├── TOKENOMICS.md
    └── ...
```

---

## 🎨 Key Features

### 1. AI Content Generation

```typescript
// Multi-platform content generation with AI
POST /functions/v1/generate-content
{
  "content": "Your original post",
  "platforms": ["twitter", "linkedin", "instagram"],
  "style": "professional"
}
```

**Features**:
- Rate limiting: 10 generations/hour (free), unlimited (pro)
- Async job queue pattern
- Prompt injection detection
- Platform-specific optimization

### 2. Voice Services

```typescript
// Clone your voice (legal consent required)
POST /functions/v1/voice-clone
{
  "audio_file": File,
  "name": "My Voice",
  "consent_confirmed": true
}

// Generate speech from text
POST /functions/v1/text-to-speech
{
  "voice_id": "uuid",
  "text": "Hello world",
  "model": "eleven_multilingual_v2"
}
```

**Subscription Limits**:
- Pro: 3 voices, 30 min/month
- Business: 10 voices, 2 hours/month
- Enterprise: 50 voices, 8+ hours/month

### 3. Video Rendering

```typescript
// Render video with parallel processing
POST /functions/v1/render-video
{
  "project_id": "uuid",
  "quality": "high", // draft | medium | high | ultra
  "format": "mp4"
}
```

**Quality Tiers** (subscription-gated):
- Free: Draft (CRF 28)
- Pro: High (CRF 18)
- Business/Enterprise: Ultra (CRF 15)

### 4. Token Staking

```typescript
// Stake $FLOW tokens for rewards
POST /functions/v1/token-governance
{
  "action": "stake",
  "data": {
    "pool_id": "90-day",
    "amount": 1000
  }
}
```

**APY Rates**:
- Flexible (0 days): 8%
- 30-Day: 12%
- 90-Day: 16%
- Diamond (180 days, 10k min): 20%

---

## 🔧 Tech Stack

### Frontend
- **React 18** with TypeScript
- **TanStack Query** for state management
- **Tailwind CSS** + **Shadcn/ui** for styling
- **React Router** for navigation
- **i18next** for internationalization (EN/ES)

### Backend
- **Supabase**:
  - PostgreSQL with RLS (Row Level Security)
  - Realtime subscriptions (WebSockets)
  - Edge Functions (Deno runtime)
  - Storage (audio, video, thumbnails)

### Integrations
- **AI**: OpenAI (DALL-E 3), Lovable AI (content generation)
- **Voice**: ElevenLabs (cloning, TTS)
- **Payments**: Stripe (subscriptions, webhooks)
- **Video**: AWS Lambda + Remotion (parallel rendering)

### 🚀 2026 Standards Integration
- **Architecture**: [Model Context Protocol (MCP)](file:///d:/flowaicontent/backend/mcp_server.py) for standardized AI agent interaction.
- **Linear Video Platform**: O(N) Mamba SSM backbone with NABLA block-sparse attention (45x speedup, 2.7x generation acceleration).
- **Security**: Advanced RLS with `app.current_tenant` session isolation.
- **AgentOps**: Shadow Deployment for AI decision monitoring and FinOps cost tracking.
- **Compliance**: EU Data Act "Right to Switch" logic with logical portability exports.
- **Truth Layer**: Valsci RAG verification with bibliometric scoring for truth-based monetization.
- **UI/UX**: Generative UI registry and Zero UI (Intent/Voice) command palette.

---

## 💰 Monetization

### Pricing Tiers

| Tier | Price | Generations | Features |
|------|-------|-------------|----------|
| **Free** | $0 | 10/hour | Basic content generation |
| **Creator** | $9.99/mo | 50/hour | + Analytics, staking |
| **Pro** | $99.99/mo | Unlimited | + Voice cloning, premium |
| **Enterprise** | Custom | Unlimited | + Custom features, SLA |

### Revenue Streams

1. **SaaS Subscriptions** (70% of revenue)
2. **Marketplace Commissions** (20%)
3. **Token Economy Fees** (10%)

Target: $50K MRR by Month 12

---

## 🔐 Security

### Authentication
- Supabase Auth with JWT tokens
- Row Level Security (RLS) on all tables
- Role-based access control (user/moderator/admin)

### Rate Limiting
```typescript
// Per-user hourly limits
Free tier: 10 generations/hour
Pro tier: Unlimited
```

### API Security
- Webhook signature verification (Stripe)
- Prompt injection detection
- CORS headers configured
- Environment variable isolation

---

## 📊 Database Schema

### Core Tables

```sql
-- Users & Profiles
profiles (id, full_name, username, avatar_url, bio)
user_roles (user_id, role) -- admin, moderator, user

-- Subscriptions & Billing
subscriptions (user_id, plan_id, status, stripe_customer_id)
generation_attempts (user_id, created_at) -- Rate limiting

-- Content Generation
generation_jobs (id, user_id, status, output)
projects (id, user_id, title, content)

-- Token Economics
staking_pools (id, name, apy_percentage, lock_period_days)
user_stakes (user_id, pool_id, amount, unlocks_at, rewards_earned)
governance_proposals (id, title, description, votes_for, votes_against)

-- Voice Services
voice_clones (user_id, elevenlabs_voice_id, consent_timestamp)
voice_credits (user_id, monthly_limit, monthly_used)
```

---

## 🧪 Testing

```bash
# Run tests
npm test

# Run linter
npm run lint

# Type check
npm run type-check

# Build for production
npm run build
```

---

## 📖 Documentation

### For Developers
- [Technical Architecture](./docs/TECHNICAL_DOCS.md)
- [API Documentation](./docs/API_REFERENCE.md)
- [Database Schema](./docs/DATABASE_SCHEMA.md)
- [Implementation Status](./docs/IMPLEMENTATION_STATUS.md)

### For Business
- [Monetization Strategy](./docs/MONETIZATION.md)
- [Tokenomics](./docs/TOKENOMICS.md)
- [Marketing Strategy](./docs/MARKETING_STRATEGY.md)
- [Investor Brief](./docs/INVESTOR_BRIEF.md)

### Code Quality
- **100% of critical functionality** is professionally documented with JSDoc
- **Enterprise-grade comments** following established standards
- **1785+ lines** of inline and JSDoc documentation

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes (follow JSDoc standards)
4. Run tests and linter
5. Commit with clear messages
6. Push to your fork
7. Open a Pull Request

### Code Standards

- **TypeScript** strict mode
- **JSDoc** for all functions and complex logic
- **Inline comments** explaining "why", not "what"
- **ESLint** + **Prettier** for formatting
- **Conventional Commits** for commit messages

---

## 🗺️ Roadmap

### Q1 2025
- [x] Core AI content generation
- [x] Voice cloning & TTS integration
- [x] Token staking & DAO governance
- [x] Stripe payment integration
- [ ] Mobile app (React Native)

### Q2 2025
- [ ] NFT marketplace for content
- [ ] Co-streaming features
- [ ] Brand deals platform
- [ ] Advanced analytics dashboard

### 🚀 2026 Standards & Hydration Guide

### Edge AI Hydration (WebGPU)
To enable the **Local Vision Analyzer** (Phase 4), you must "hydrate" the frontend environment with the WebGPU vision engine:

1.  **Install Dependencies**:
    ```bash
    npm install @huggingface/transformers
    ```
2.  **Hardware Requirements**: Ensure you are using a browser with WebGPU support (Chrome 113+, Edge 113+).
3.  **Local Model Storage**: The first run will download ~50MB of model weights to your browser's IndexedDB.

### Agentic Governance (FinOps)
FlowAI implements **Hard Budget Gates** for all agent actions.
- **Deductions**: Atomic credits are deducted *before* tool execution.
- **Quotas**: Managed per `tenant_id`.
- **Transparency**: Every AI-generated asset is tagged with metadata for data sovereignty compliance.

### Developer Setup
1. Clone the repo.
2. Run `backend/mcp_server.py` to start the AI tool provider.
3. Run `npm run dev` in the root to start the dashboard.
4. Use the **Vision Analyzer** component to process video assets locally before sending them to the Cloud Generation pipeline.
xpansion

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

Built with ❤️ by the FlowAI Team

- **Technical Lead**: [Your Name]
- **Product**: [Product Manager]
- **Design**: [Designer Name]

---

## 📞 Contact & Support

- **Website**: [flowaicontent.com](https://flowaicontent.com)
- **Email**: support@flowaicontent.com
- **Discord**: [Join our community](https://discord.gg/flowaicontent)
- **Twitter**: [@FlowAIPlatform](https://twitter.com/FlowAIPlatform)

---

## 🙏 Acknowledgments

- [Supabase](https://supabase.com/) for backend infrastructure
- [ElevenLabs](https://elevenlabs.io/) for voice AI
- [Remotion](https://www.remotion.dev/) for video rendering
- [Shadcn/ui](https://ui.shadcn.com/) for UI components
- All our open-source contributors

---

**⭐ Star this repo if you find it useful!**
