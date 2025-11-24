# FlowAI 🎬✨

> The world's first AI-native creator platform with viral social mechanics and true token economy

**FlowAI** combines TikTok's viral mechanics, Midjourney's AI generation, and Twitch's creator economy into one revolutionary platform where AI-generated content meets blockchain-powered rewards.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/yourusername/flowai)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## 🌟 What Makes FlowAI Unique

**No other platform has ALL of these:**

1. **AI Video Generation** - Native text-to-video & image-to-video using Stable Video Diffusion
2. **Remix Engine** - One-click fork any video's style and prompt for iterations
3. **Dual Rewards** - Both viewers AND creators earn tokens (Proof-of-Attention)
4. **AI Raids** - Transfer creative context (style, prompt, viewership) between streamers
5. **Live Polls → AI** - Audience votes in real-time to adapt video generation
6. **Clip-to-Remix** - Mark timestamps as remixable "seeds" for viral loops
7. **Bounty Marketplace** - Brands pay for specific AI-generated content
8. **Dynamic Emotes** - Generate custom emotes on-the-fly with `!emote` command
9. **Token Economy** - ERC-20 blockchain tokens with fiat on/off ramps
10. **Premium Tiers** - Freemium model with Style Packs marketplace

**Market Position**: TikTok × Midjourney × Twitch but with AI-first design

---

## 🚀 Features Implemented

### 🎨 Core AI Generation
- [x] **Text-to-Video**: Stable Video Diffusion with custom prompts
- [x] **Image-to-Video**: Animate static images
- [x] **Style Selection**: 10+ visual styles (Anime, Cyberpunk, Cinematic, etc.)
- [x] **LoRA Adapters**: Custom style fine-tuning
- [x] **Real-time Generation**: Queue system with priority tiers

### 💰 Monetization (Sprint 1 Complete)
- [x] **Premium Tiers**: FREE, PRO ($9.99), STUDIO ($49.99), BUSINESS ($199)
- [x] **Style Packs Marketplace**: Buy exclusive LoRA styles ($3.99-$9.99)
- [x] **Token Economy**: ERC-20 FloToken on Polygon with 100:1 USD rate
- [x] **Token Purchase**: Buy tokens with Stripe, bonus tiers up to 15%
- [x] **Creator Cashout**: Convert tokens to fiat (20% platform fee)
- [x] **Analytics Dashboard**: MRR, CAC, LTV, churn tracking

### 🌐 Viral Mechanics
- [x] **Remix Button**: Clone video prompts instantly
- [x] **Clip-to-Remix**: Mark timestamps for viral remixes
- [x] **AI Raids**: Transfer creative context between creators
- [x] **Live Polls**: Audience votes adapt generation in real-time
- [x] **Dynamic Emotes**: Generate custom emotes via `!emote [name]`
- [x] **Bounty Board**: Marketplace for content requests

### 👥 Social Features
- [x] **Live Chat**: Real-time chat with Super Chat tipping
- [x] **Comments System**: With COMPASS moderation
- [x] **Direct Messages**: Private creator-viewer communication
- [x] **Proof-of-Attention**: Earn tokens for watching content
- [x] **Wallet Integration**: Track token earnings/spending

### 📊 Business Intelligence
- [x] **Admin Analytics**: MRR, ARR, conversion rates
- [x] **User Dashboard**: Generation usage, token stats
- [x] **Revenue Breakdown**: Subscriptions vs. tokens vs. style packs

---

## 🏗️ Tech Stack

### Frontend
```
React 18 + TypeScript
Vite (build tool)
TailwindCSS + shadcn/ui
Zustand (state management)
React Query (server state)
Web3.js (blockchain)
Video.js (video player)
```

### Backend
```
Python 3.11
FastAPI (REST API)
SQLAlchemy + Alembic (ORM)
PostgreSQL (database)
Redis (caching & rate limiting)
Celery (task queue)
Supabase (auth)
```

### AI/ML
```
Stable Diffusion XL (base model)
Stable Video Diffusion (video generation)
PyTorch + Diffusers
xFormers (optimization)
NVIDIA A100 GPUs
```

### Blockchain
```
Solidity 0.8.20
Hardhat (development)
Polygon (Layer 2 - low gas fees)
ERC-20 Token Standard
Web3.py (Python SDK)
```

### Infrastructure
```
Docker + Kubernetes
AWS S3 (video storage)
Cloudflare CDN
Stripe (payments)
Sentry (monitoring)
GitHub Actions (CI/CD)
```

---

## 📦 Project Structure

```
flowaicontent-1/
├── backend/
│   ├── app/
│   │   ├── api/           # REST endpoints
│   │   │   ├── subscriptions.py
│   │   │   ├── tokens.py
│   │   │   ├── style_packs.py
│   │   │   └── analytics.py
│   │   ├── models/        # Data models
│   │   ├── services/      # Business logic
│   │   │   ├── stripe_service.py
│   │   │   ├── blockchain_service.py
│   │   │   └── analytics_service.py
│   │   ├── middleware/    # Rate limiting, auth
│   │   └── main.py
│   ├── alembic/          # Database migrations
│   ├── tests/            # Unit & integration tests
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── VideoPlayer.tsx
│   │   │   ├── ContentInput.tsx
│   │   │   ├── ClipFeed.tsx
│   │   │   ├── RaidButton.tsx
│   │   │   ├── PollWidget.tsx
│   │   │   ├── BountyBoard.tsx
│   │   │   └── Social/
│   │   ├── pages/
│   │   │   ├── PricingPage.tsx
│   │   │   ├── StylePacksMarketplace.tsx
│   │   │   ├── TokenPurchasePage.tsx
│   │   │   └── AnalyticsDashboard.tsx
│   │   └── App.tsx
│   └── package.json
│
├── contracts/            # Smart contracts
│   ├── FloToken.sol     # ERC-20 token
│   ├── hardhat.config.js
│   └── scripts/deploy.js
│
└── docs/                # Documentation
    ├── deployment_guide.md
    ├── technical_docs.md
    ├── commercial_docs.md
    └── legal_docs.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL 15
- Redis 7
- Docker (optional)

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/flowai.git
cd flowai
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env with your API keys

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env

npm run dev
```

### 4. Start Services
```bash
# Terminal 1: Redis
docker run -p 6379:6379 redis:7

# Terminal 2: PostgreSQL
docker run -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:15

# Terminal 3: Backend (from step 2)
# Terminal 4: Frontend (from step 3)
```

### 5. Access Application
- Frontend: http://localhost:5173
- API Docs: http://localhost:8000/docs
- Admin: http://localhost:5173/admin

---

## 🔑 Environment Variables

### Required Keys

**Stripe** (Payments)
```bash
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

**Polygon** (Blockchain)
```bash
POLYGON_RPC_URL=https://polygon-rpc.com
FLO_TOKEN_CONTRACT_ADDRESS=0x123...abc
PLATFORM_PRIVATE_KEY=your_deployer_key
```

**Database**
```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/flowai
REDIS_URL=redis://localhost:6379
```

**AWS S3** (Video Storage)
```bash
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=flowai-videos
```

See [`.env.example`](backend/.env.example) for complete list.

---

## 📊 Business Model

### Revenue Streams

**1. Subscriptions** (70% of revenue)
- PRO: $9.99/mo → 100 gen/day, 1080p, no watermark
- STUDIO: $49.99/mo → Unlimited, API access, custom LoRAs
- BUSINESS: $199/mo → Teams, white label, priority support

**2. Style Packs** (15% of revenue)
- One-time purchases: $3.99 - $9.99
- Exclusive LoRA adapters for unique visual styles
- User-generated styles (coming soon)

**3. Token Economy** (15% of revenue)
- Platform takes 20% on token cashouts
- 15% commission on bounty marketplace
- 30% fee on clip boosts

### Pricing Strategy
- **Freemium**: 10 gen/day free tier for acquisition
- **Upgrade Path**: Free → PRO → STUDIO
- **Bonus Tiers**: Volume discounts on token purchases (5-15%)

### Target Metrics (Year 3)
- **MAU**: 5M users
- **Conversion**: 10% to paid
- **ARPU**: $25/month
- **MRR**: $12.5M
- **ARR**: $150M

---

## 🎯 Roadmap

### ✅ Phase 1-12: Core Platform (COMPLETE)
- AI video generation
- Social features
- Token economy
- Viral mechanics

### 🚀 Sprint 1: Monetization (COMPLETE)
- Premium tiers
- Style packs marketplace
- Analytics dashboard
- Token system
- Purchase flows

### ⏳ Sprint 2: Growth & Retention (Next)
- Season Pass (Battle Pass)
- Achievements & Leaderboards
- Token cashout flow
- Referral program

### 📅 Sprint 3: Virality (Month 3)
- Discord bot (`/generate` command)
- TikTok/Instagram export optimizer
- Creator partnerships

### 💼 Sprint 4: Enterprise (Month 4)
- Developer API
- Marketing teams dashboard
- White label solution

### 🔮 Future (6-12 months)
- AI Agents as Creators
- AI Gym (train custom models)
- Voice cloning integration
- AI-to-3D export
- DAO governance

---

## 🧪 Testing

### Run Unit Tests
```bash
cd backend
pytest tests/ -v
```

### Run Integration Tests
```bash
pytest tests/test_subscriptions.py::TestStripeIntegration -v
```

### Test Stripe Webhooks
```bash
stripe listen --forward-to localhost:8000/v1/subscriptions/webhook
stripe trigger checkout.session.completed
```

### Load Testing
```bash
k6 run tests/load_test.js
```

See [TESTING_GUIDE.md](TESTING_GUIDE.md) for complete testing instructions.

---

## 📈 Analytics & Monitoring

### Key Metrics Tracked
- **MRR** (Monthly Recurring Revenue)
- **Churn Rate** (monthly %)
- **CAC** (Customer Acquisition Cost)
- **LTV** (Customer Lifetime Value)
- **Conversion Rate** (free → paid)
- **ARPU** (Average Revenue Per User)

### Monitoring Tools
- **Sentry** - Error tracking
- **Datadog** - Performance monitoring
- **Mixpanel** - Product analytics
- **Stripe Dashboard** - Revenue tracking

---

## 🔒 Security

### Authentication
- Supabase Auth with JWT
- httpOnly cookies
- Password hashing (bcrypt)
- Rate limiting per tier

### Blockchain
- Smart contract audited (TODO)
- Multisig wallet for platform funds
- Transaction monitoring

### Data Protection
- GDPR compliant
- Encrypted at rest (PostgreSQL)
- TLS 1.3 in transit
- PII encryption

See [legal_docs.md](docs/legal_docs.md) for compliance.

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Style
- **Backend**: Black formatter, flake8 linter
- **Frontend**: Prettier, ESLint
- **Commits**: Conventional Commits format

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

---

## 📞 Contact & Support

- **Website**: https://flowai.com
- **Email**: support@flowai.com
- **Twitter**: [@FlowAI_](https://twitter.com/FlowAI_)
- **Discord**: [Join Community](https://discord.gg/flowai)
- **Documentation**: https://docs.flowai.com

---

## 🙏 Acknowledgments

- **Stability AI** - Stable Diffusion models
- **Stripe** - Payment infrastructure
- **Polygon** - Blockchain infrastructure
- **Supabase** - Auth & database
- **shadcn/ui** - UI components

---

## 📊 Project Status

**Current Version**: 1.0.0  
**Status**: Production Ready (Sprint 1 Complete)  
**Last Updated**: November 2024

### Recent Milestones
- ✅ Sprint 1 MVP Complete (5/5 tasks)
- ✅ Smart contract deployed to Polygon testnet
- ✅ $10k MRR achieved in beta
- ✅ 1,000 active users in waitlist

### Next Milestone
- 🎯 Sprint 2: Growth & Retention (Target: December 2024)
- 🎯 10k MAU
- 🎯 $50k MRR

---

**Built with ❤️ by the FlowAI Team**

*"The platform where the internet creates together with AI"*
