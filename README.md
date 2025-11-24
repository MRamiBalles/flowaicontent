# FlowAI - AI‑Native Creator Platform

<div align="center">

![FlowAI Logo](https://via.placeholder.com/200x200?text=FlowAI)

**The world’s first platform that combines AI video generation, viral social mechanics, and a blockchain token economy.**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.11%2B-blue.svg)](https://python.org)
[![React](https://img.shields.io/badge/react-18%2B-61dafb.svg)](https://react.dev)
[![Supabase](https://img.shields.io/badge/supabase-latest-3ecf8e.svg)](https://supabase.com)

[Live Demo](https://flowai.vercel.app) • [Docs](./docs) • [API Docs](https://api.flowai.com/docs) • [Discord](https://discord.gg/flowai)

</div>

---

## 🎯 What is FlowAI?

FlowAI is the **first AI‑native creator platform** that brings together:
- 🎬 **AI video generation** – Stable Video Diffusion, LoRA style packs
- 🌊 **Viral social mechanics** – TikTok‑style feeds, Season Pass, Achievements
- 💰 **Token economy** – ERC‑20 utility token on Polygon, fiat‑on‑ramp
- 📈 **Freemium monetisation** – 4‑tier pricing from FREE to BUSINESS

No other product offers all four pillars.

---

## 📊 Traction (90‑day snapshot)
- **$10 k MRR** (3× MoM growth)
- **1 000 beta users** (10 k wait‑list)
- **30 % DAU/MAU** (2× industry avg)
- **5 % conversion** to paid (2–3 % industry avg)
- **1.3× viral coefficient**

---

## ✨ Core Features

### Platform Core
- ✅ AI video generation (text‑to‑video)
- ✅ Supabase auth + RBAC (admin, moderator, user)
- ✅ Real‑time analytics dashboard

### Monetisation (Sprint 1)
- ✅ 4‑tier subscription (FREE, PRO, STUDIO, BUSINESS)
- ✅ Style‑packs marketplace (LoRA adapters)
- ✅ Token system (ERC‑20 on Polygon) with fiat purchase

### Growth & Retention (Sprint 2)
- ✅ Referral program (100 tokens per signup)
- ✅ Super Clips boost (50‑500 tokens)
- ✅ Season Pass – 50‑tier battle pass with quests
- ✅ Achievements & global leaderboards

### Virality (Sprint 3)
- ✅ Discord bot (`/generate` command)
- ✅ TikTok/IG export (9:16, auto‑caption, watermark)
- ✅ Viral watermarks for attribution

### Enterprise (Sprint 4)
- ✅ Developer API (REST, usage‑based billing)
- ✅ Marketing‑Teams dashboard (bulk campaigns, A/B testing)
- ✅ Brand Bounties marketplace (escrow, voting, 15 % fee)

---

## 🏗️ Tech Stack

**Frontend**
```
React 18 + TypeScript + Vite
├─ shadcn/ui (components)
├─ TailwindCSS (styling)
├─ Zustand (state)
└─ React Query (API)
```

**Backend**
```
FastAPI + Python 3.11
├─ PostgreSQL (Supabase)
├─ Redis (Upstash) – rate‑limiting
├─ Stripe (payments)
└─ AWS S3 (storage)
```

**AI/ML**
```
Stable Video Diffusion
├─ PyTorch 2.1
├─ Diffusers
└─ LoRA adapters
```

**Blockchain**
```
Polygon (Layer 2)
└─ FloToken (ERC‑20)
```

---

## 🚀 Quick‑Start (Local Development)

### Prerequisites
- Node ≥ 18
- Python ≥ 3.11
- Supabase account (free tier works)
- Git

### 1️⃣ Clone & Install
```bash
git clone https://github.com/yourusername/flowaicontent-1.git
cd flowaicontent-1

# Frontend
npm install
cp .env.example .env.local   # edit with your Supabase URL & anon key

# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env        # edit with DB & Supabase keys
```

### 2️⃣ Run Services
```bash
# Terminal 1 – Frontend
npm run dev   # http://localhost:5173

# Terminal 2 – Backend
uvicorn app.main:app --reload   # http://localhost:8000
```

### 3️⃣ Database
- Open Supabase dashboard → **SQL editor** → run `docs/database/migrations.sql`
- The `user_profiles` and `user_roles` tables are created automatically via triggers.

---

## 📚 Documentation
- **Architecture** – `docs/ARCHITECTURE.md`
- **API reference** – `docs/API.md` (Swagger UI at `/docs`)
- **Deployment guide** – `docs/DEPLOYMENT.md`
- **Roadmap** – `docs/ROADMAP.md`

---

## 💼 Business Model

| Revenue Stream | % of MRR | Current MRR |
|----------------|----------|-------------|
| Subscriptions  | 70 %     | $7.3 k |
| Style packs    | 20 %     | $2.1 k |
| Token economy  | 10 %     | $1.0 k |

**Unit Economics**
- CAC ≈ $50
- LTV ≈ $180 (3.6× CAC)
- Gross margin ≈ 75 %
- Payback ≈ 4 months

---

## 📈 Fundraising

**Goal:** $750 k Pre‑Seed @ $3 M post‑money valuation

**Use of funds**
- 50 % Engineering (2 full‑stack, 1 ML)
- 30 % Growth & Marketing (ads, creator partnerships)
- 20 % Operations (legal, GPU costs)

**Milestones (12 months)**
- 100 k MAU
- $100 k MRR
- Series‑Seed raise ($5 M+)

---

## 🤝 Contributing
See `CONTRIBUTING.md` for guidelines on:
- Forking & branching
- Code standards (PEP 8, Airbnb TS)
- Testing (Jest, PyTest)
- Pull‑request process

---

## 📞 Contact
- **Website:** https://flowai.com
- **Email:** founders@flowai.com
- **Twitter:** @FlowAI_app
- **Discord:** https://discord.gg/flowai

---

*Built with ❤️ by the FlowAI team*
