# FlowAI - AI-Native Creator Platform

<div align="center">

![FlowAI Logo](https://via.placeholder.com/200x200?text=FlowAI)

**An AI-powered content generation platform with viral social mechanics and gamification.**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/react-18%2B-61dafb.svg)](https://react.dev)
[![Supabase](https://img.shields.io/badge/supabase-latest-3ecf8e.svg)](https://supabase.com)

</div>

---

## 🎯 What is FlowAI?

FlowAI is an **AI-native creator platform** featuring:
- 🎬 **AI Content Generation** – Transform ideas into viral posts for Twitter, LinkedIn, and Instagram
- 🎮 **Gamification Engine** – Streaks, levels, and XP to drive daily engagement
- 🔄 **Remix Workflow** – Iterate on generated content with AI variations
- 💰 **Token Economy** – ERC-20 utility token on Polygon (in development)
- 📱 **Mobile PWA** – Installable app with offline support

---

## ✨ Core Features

### Platform Core
- ✅ AI content generation (multi-platform optimization)
- ✅ Supabase auth + RBAC (admin, moderator, user)
- ✅ Premium Landing Page with glassmorphism design
- ✅ Pro Dashboard with floating header and ambient effects

### Gamification & Engagement
- ✅ **Daily Streaks**: Track consecutive creation days
- ✅ **Leveling System**: Earn XP and unlock new features
- ✅ **Sound Effects**: Audio feedback for actions and achievements
- ✅ **Remix Mode**: AI-powered content variations

### Web3 Economy (Planned)
- 🚧 **$FLOW Token**: ERC-20 utility token on Polygon
- 🚧 **NFT Marketplace**: Buy/Sell AI assets and prompts
- 🚧 **Creator Coins**: Bonding curve economy for creators

### Mobile & Growth
- ✅ **Mobile PWA**: Installable app
- ✅ **Push Notifications**: Real-time engagement alerts
- 🚧 **Viral Loops**: Gamified referrals

---

## 🏗️ Tech Stack

**Frontend**
```
React 18 + TypeScript + Vite
├─ shadcn/ui (components)
├─ TailwindCSS (styling)
└─ React Query (API)
```

**Backend**
```
Supabase
├─ PostgreSQL (database)
├─ Edge Functions (serverless)
├─ Auth (authentication)
└─ Storage (file uploads)
```

**AI/ML**
```
OpenAI API
└─ GPT-4 for content generation
```

**Blockchain (In Development)**
```
Polygon (Layer 2)
└─ FlowToken (ERC-20)
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node ≥ 18
- Supabase account (free tier works)
- Git

### 1️⃣ Clone & Install
```bash
git clone https://github.com/yourusername/flowaicontent-7.git
cd flowaicontent-7

# Frontend
npm install
cp .env.example .env.local   # edit with your Supabase URL & anon key
```

### 2️⃣ Run Services
```bash
# Development server
npm run dev   # http://localhost:5173
```

### 3️⃣ Database
- Open Supabase dashboard → **SQL editor** → run migrations from `supabase/migrations/`

---

## 📚 Documentation
- **Architecture** – See `docs/ARCHITECTURE.md`
- **Contributing** – See `CONTRIBUTING.md`
- **Testing** – See `TESTING_GUIDE.md`

---

## 🎨 Design Philosophy

FlowAI follows these principles:
1. **Premium First**: Glassmorphism, smooth animations, dark mode
2. **Gamification**: Every action should feel rewarding
3. **Performance**: Code splitting, lazy loading, optimized assets
4. **Accessibility**: WCAG 2.1 AA compliant

---

## 🤝 Contributing
See `CONTRIBUTING.md` for guidelines on:
- Forking & branching
- Code standards (ESLint, Prettier)
- Pull-request process

---

## 📞 Contact
- **Email**: contact@flowai.app
- **Twitter**: @FlowAI_app

---

*Built with ❤️ by the FlowAI team*
