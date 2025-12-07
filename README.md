# 🌊 FlowAI - Unleash Your Creative Flow

**FlowAI** is a next-generation AI Content Studio that combines professional video generation tools with Web3 ownership and monetization.

![FlowAI Banner](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop)

## 🚀 Key Features
-   **AI Video Studio**: Generate high-quality videos from text prompts using custom Style Packs.
-   **Co-Streaming**: Find match-made collaboration partners with AI.
-   **NFT Marketplace**: Mint your creations and trade fractional ownership.
-   **Pro Subscriptions**: Access advanced models, remove watermarks, and get priority support.

## 📚 Documentation
-   [**Marketing Strategy**](./docs/MARKETING_STRATEGY.md): Growth, Pricing, and USP.
-   [**Technical Docs**](./docs/TECHNICAL_DOCS.md): Architecture, Schema, and Security.
-   [**Legal Overview**](./docs/LEGAL_OVERVIEW.md): Privacy, Terms, and Compliance.
-   [**Implementation Status**](./docs/IMPLEMENTATION_STATUS.md): Progress tracker.

## 🛠️ Tech Stack
-   **Frontend**: React, TypeScript, Tailwind CSS, Shadcn/ui
-   **Backend**: Supabase (Postgres, Auth, Edge Functions)
-   **AI**: Wrapper around Stability/OpenAI APIs
-   **Web3**: Wagmi, RainbowKit, Polygon

## 🏁 Getting Started

1.  **Clone the repo**
    ```bash
    git clone https://github.com/flowai/platform.git
    cd platform
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create `.env` based on `.env.example`:
    ```
    VITE_SUPABASE_URL=...
    VITE_SUPABASE_ANON_KEY=...
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```

## 🔐 Security
We take security seriously. All endpoints are rate-limited, and database access is strictly controlled via RLS (Row Level Security).
See [Technical Docs](./docs/TECHNICAL_DOCS.md) for details.

---
*Built with ❤️ by the FlowAI Team*
