# 🛠️ FlowAI Technical Documentation

## 1. System Architecture
FlowAI follows a **Serverless-First** architecture leveraging the T3 Stack philosophy (Typescript, Tailwind, tRPC-like patterns).

### Frontend
-   **Framework**: React (Vite)
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS + Shadcn UI
-   **State**: React Query (server state), Zustand (local state)
-   **Routing**: React Router v6

### Backend (BaaS)
-   **Provider**: Supabase
-   **Database**: PostgreSQL
-   **Auth**: Supabase Auth (JWT)
-   **Storage**: Supabase Storage (S3-compatible) for video/image assets
-   **Compute**: Supabase Edge Functions (Deno) for custom logic (Stripe, AI, NFTs)

### AI Pipeline
1.  User sends prompt -> `supabase/functions/video-generate`
2.  Input passed to `detectPromptInjection` (Security)
3.  Valid prompt sent to AI Model Provider (e.g., Runway/Stability API)
4.  Result stored in Storage Bucket
5.  Record inserted into `generations` table

## 2. Database Schema (Key Tables)
-   `profiles`: User data (tier, xp, credits)
-   `nfts`: Minted assets (references Storage URL)
-   `subscriptions`: Stripe subscription status map
-   `admin_audit_logs`: Security trail for admin actions
-   `generation_attempts`: Rate limit tracking
-   `categories`: Content classification with "Learn-to-Earn" multipliers
-   `followers`: Social graph (Follow/Unfollow relationships)

## 3. Security Implementation
-   **Row Level Security (RLS)**: Enabled on ALL tables. Users can only SELECT/UPDATE their own data.
    -   *Exception*: `nfts` table is readable by everyone (Marketplace).
-   **Edge Function Security**:
    -   All functions verify `Authorization` header (JWT).
    -   `service_role` key used ONLY within trusted server-side code.
-   **Payment Security**:
    -   Stripe Checkout used for PCI compliance.
    -   Server-side webhook verification (`stripe-signature`).

## 4. Development Workflow
-   **Build**: `npm run build` (Vite)
-   **Lint**: `npm run lint` (ESLint)
-   **Deploy**:
    -   Frontend: Vercel/Netlify connected to Git.
    -   Backend: `supabase functions deploy [name]`

## 5. Environment Variables
-   `VITE_SUPABASE_URL`: Public API URL
-   `VITE_SUPABASE_ANON_KEY`: Safe for client-side
-   `SUPABASE_SERVICE_ROLE_KEY`: **SECRET** (Edge Functions only)
-   `STRIPE_SECRET_KEY`: **SECRET** (Edge Functions only)
-   `OPENAI_API_KEY`: **SECRET** (Edge Functions only)
