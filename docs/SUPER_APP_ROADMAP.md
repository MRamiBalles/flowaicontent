# 🌍 FlowAI Super App: Roadmap & Strategy (V3)

## 1. Vision: The "Constructive" Creator Economy
FlowAI evolves from a tool into a **Network**. We compete with YouTube/Twitch (Content), Facebook (Social), and Azar (Discovery), but with a core differentiator: **Value-Based Monetization**.

**Core Philosophy**: "Earn more by learning and teaching."
-   **Creators**: Earn tokens/fiat based on *engagement + educational value* (not just views).
-   **Viewers**: Earn "Flow Points" for consuming constructive content (verified by AI quizzes or watch time on "High Value" categories).

## 2. Gap Analysis
| Feature Area | Current Status | Required for Super App | Gap |
| :--- | :--- | :--- | :--- |
| **Video Hosting** | Simple Storage | Streaming Infrastructure (HLS/DASH), CDNs | **Huge** |
| **Live Streaming** | Basic WebRTC (Co-Stream) | RTMP Ingest, Chat Scale, OBS integration | **Large** |
| **Social Graph** | Basic User Profiles | Follows, Feeds, Algorithms, dMs | **Medium** |
| **Random Chat** | N/A | Global Matching, WebRTC Mesh/SFU, Trust Score | **New** |
| **Learn-to-Earn** | N/A | Category Weighting, Token Economy, Wallet Integration | **New** |

## 3. Sprint Roadmap

### Phase 1: Social Foundation (Sprint 3) ✅
*Goal: Turn tool users into a network.*
-   **Social Graph**: Follow/Unfollow system. ✅
-   **The Feed**: "For You" algorithm promoting content based on user interests. ✅
-   **Categories V1**: Database implementation of content categories with "Value Weights". ✅
-   **Viewer Wallet**: Internal ledger for tracking "Flow Points" earned by watching. (Partial)

### Phase 2: The Streaming Platform (Sprint 5) 🚧
*Goal: Compete with Twitch/Kick.*
-   **Live Ingest**: Support for OBS streaming (RTMP to WebRTC).
-   **Live Chat**: High-performance websocket chat.
-   **Donations**: Crypto/Fiat tipping on stream.
-   **"Constructive" Algorithim**: AI analysis of stream transcript.

### Phase 3: "Flow Roulette" (Sprint 4) ✅
*Goal: Compete with Azar/Omegle (Discovery).*
-   **Random Match**: 1v1 Video chat using WebRTC. ✅
-   **Ice-Breaker AI**: AI suggests conversation topics based on user profiles.
-   **Safety**: Real-time NSFW detection stub.
-   **Monetized Meetings**: Option to pay for "Expert Matching".

## 4. Technical Architecture Updates
To support this scale, we need:
1.  **Media Server**: A dedicated SFU (Selective Forwarding Unit) like **LiveKit** or **Mediasoup** for hosting thousands of streams (Supabase alone won't handle video routing).
2.  **Vector Database**: For the "Educational Algorithm" to semanically understand content (e.g., Pinecone or pgvector).
3.  **Governance Token**: Smart contracts (Polygon) for the "Earn" mechanics if we move beyond internal points.

## 5. Marketing & Legal (Super App)
-   **Legal**: "Learn-to-Earn" brings us closer to Fintech. Needs strict Terms of Service regarding "Points" not being "Shares".
-   **Marketing**: "The Anti-Doomscrolling App". Market it as the place where you *gain* value (knowledge + money) instead of losing time.

## 6. Immediate Action Items (Sprint 3)
1.  **Database Update**: Add `categories` table with `value_multiplier` column.
2.  **Profile Update**: Add `interests` and `followers` tables.
3.  **UI**: Create the "Feed" page.
