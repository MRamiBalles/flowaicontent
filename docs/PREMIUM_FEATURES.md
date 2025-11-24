# Premium Features Technical Brief

This document provides a technical roadmap for implementing the proposed "Unicorn" features.

## 1. AI Hyper-Personalization: Voice Cloning 🗣️

**Goal**: Allow creators to narrate videos with their own AI-cloned voice.

### Technical Approach
- **External API (Fastest)**: Integration with **ElevenLabs Instant Voice Cloning**.
    - **Input**: User uploads 1-3 minutes of clean audio.
    - **Process**: Send to ElevenLabs API -> Receive `voice_id`.
    - **Storage**: Store `voice_id` in Supabase `user_profiles`.
    - **Usage**: When generating video, pass `voice_id` to TTS service.
- **Self-Hosted (Cheaper/Private)**: **OpenVoice** or **Coqui TTS**.
    - **Infrastructure**: Requires dedicated GPU inference (RunPod/Modal).
    - **Model**: Fine-tune a base TTS model per user (higher latency).

### Database Schema Update
```sql
ALTER TABLE user_profiles ADD COLUMN voice_clone_id TEXT;
ALTER TABLE user_profiles ADD COLUMN voice_clone_status TEXT DEFAULT 'none'; -- processing, ready, failed
```

---

## 2. Advanced Creative Tools: In-Browser Editor 🎬

**Goal**: A non-linear video editor running in the browser.

### Tech Stack
- **Core Engine**: **Remotion** (React-based video) or **@ffmpeg/ffmpeg** (WASM).
- **UI Framework**: React + Tailwind.

### Architecture
1.  **Client-Side (Preview)**:
    - Use `Remotion Player` to render the timeline in real-time using React components.
    - Assets (images, videos) are loaded from S3.
    - "Magic Cut": Use `transformers.js` in the browser to detect silence or scenes.
2.  **Server-Side (Render)**:
    - User clicks "Export".
    - JSON representation of the timeline is sent to a Lambda/Cloud Run instance.
    - Server runs headless browser/FFmpeg to render high-quality MP4.

---

## 3. Web3: Fractionalized NFTs (Viral Shares) 💎

**Goal**: Allow fans to buy "shares" of a viral video and earn royalties.

### Smart Contract Logic
- **Vault Contract**: Holds the original NFT.
- **Share Token (ERC-20)**: Minted when NFT is locked.
    - Example: 1 NFT -> 1,000,000 $SHARE tokens.
- **Royalty Distribution**:
    - Platform revenue from the video (ads/tips) is sent to the Vault.
    - $SHARE holders can claim their pro-rata share of the revenue.

### Integration
- **Frontend**: "Invest in this Video" button.
- **Backend**: `RoyaltyService` to calculate earnings and deposit FLOW to the contract.

---

## 4. Enterprise: White-Label Instances 🏢

**Goal**: Branded versions of FlowAI for large corporations.

### Multi-Tenant Architecture
- **Routing**: Subdomain-based (`nike.flowai.com` or `ai.nike.com`).
- **Theming**:
    - Store brand config (logo, colors, fonts) in a `tenants` table.
    - Frontend fetches config on load and applies CSS variables.
- **Data Isolation**:
    - **Soft Isolation**: `tenant_id` column in every table (easier to maintain).
    - **Hard Isolation**: Separate Postgres schemas or databases per tenant (higher security).

### API Strategy
- Enterprise API keys with higher rate limits.
- Webhooks for integration with internal corporate tools (Slack, CRM).
