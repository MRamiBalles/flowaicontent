# FlowAI Content Platform 🚀

> **Advanced Multimodal Video Generation Platform**
> *Powered by AI, Driven by Community.*

FlowAI is a next-generation video platform that combines **Generative AI (Text-to-Video)** with a robust **Social Layer** and an **Attention Economy**. It allows creators to generate high-quality video content using AI models (simulated Kandinsky 5.0) and monetize their engagement through a dual-token system.

## ✨ Key Features

### 🧠 The Brain (AI Core)
- **Multimodal Ingestion**: Process text, scripts, and context to generate video prompts.
- **Video Generation Engine**: Simulated diffusion models with support for **LoRA Adapters** (Cinematic, Cyberpunk, Anime).
- **Training Pipeline**: Infrastructure for fine-tuning and style customization.

### 🐝 The Hive (Social Layer)
- **Real-time Interaction**: Live chat, comments, and direct messages (DMs).
- **Moderation**: Integrated **COMPASS** system for content safety analysis.
- **Community**: User profiles and social graph simulation.

### 💎 Attention Economy
- **Dual Monetization**: Rewards for both Creators (content quality) and Viewers (engagement).
- **Proof-of-Attention (PoA)**: Verifiable tracking of user engagement.
- **Wallet & Ledger**: Simulated blockchain ledger for token transactions and "Super Chat" tipping.

### 🎨 Premium UI/UX
- **Glassmorphism Design**: Modern, sleek interface with blur effects and animations.
- **Immersive Experience**: Synthesized UI sound effects (SFX) and 3D holographic badges.
- **Data Visualization**: Interactive neon charts for earnings tracking.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, TailwindCSS, Framer Motion, Recharts, Lucide Icons.
- **Backend**: FastAPI (Python), Pydantic, Uvicorn.
- **AI/ML**: PyTorch, Diffusers (Simulated), Accelerate.
- **DevOps**: Docker, Nginx, Docker Compose.

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local dev)
- Python 3.10+ (for local dev)

### Quick Start (Production Mode)
Run the entire stack with a single command:

```bash
docker-compose up --build
```

Access the application at `http://localhost`.

### 📚 API Documentation

The backend provides automatic interactive documentation:

- **Swagger UI**: `http://localhost:8000/docs` - Test endpoints directly.
- **ReDoc**: `http://localhost:8000/redoc` - Alternative documentation view.

### Local Development

**1. Backend**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

**2. Frontend**
```bash
npm install
npm run dev
```

## 📂 Project Structure

```
flowaicontent-1/
├── backend/                # FastAPI Application
│   ├── app/
│   │   ├── api/            # REST Endpoints
│   │   ├── services/       # Business Logic (Video Engine, Social, Ledger)
│   │   ├── training/       # AI Training Scripts
│   │   └── data/           # Data Processing
│   └── main.py             # Entry Point
├── src/                    # React Frontend
│   ├── components/         # UI Components (VideoPlayer, Social, etc.)
│   ├── hooks/              # Custom Hooks (useSoundEffects)
│   └── lib/                # Utilities & API Clients
├── docker-compose.yml      # Orchestration
└── Dockerfile              # Frontend Build
```

## 🤝 Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.
