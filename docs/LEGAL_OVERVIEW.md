# ⚖️ FlowAI Legal & Compliance Overview

## 1. Regulatory Status
FlowAI operates at the intersection of AI and Web3. We are committed to compliance with evolving regulations in both sectors.

## 2. Data Privacy (GDPR/CCPA)
-   **Data Controller**: FlowAI Inc.
-   **Data Processor**: We use Supabase (db), Stripe (payments), and OpenAI (inference).
-   **User Rights**:
    -   **Right to Access**: Users can request a dump of their data via Settings.
    -   **Right to Erasure**: "Delete Account" button permanently removes PII locally.
    -   **Consent**: Explicit opt-in for marketing emails and "Train on my data" settings.

## 3. Intellectual Property (IP) Terms
-   **User Output**: Users own the copyright to content they generate (subject to AI model licenses).
-   **Platform Assets**: FlowAI owns the interface, code, and branding.
-   **NFT Rights**: Minting an NFT transfers ownership of the *token*, but does not necessarily transfer IP rights to the underlying visual unless specified in the metadata license.

## 4. AI Ethics & Safety
-   **Content Moderation**: Automated filtering (OpenAI Moderation Endpoint) prevents generation of NSFW, hate speech, or gore.
-   **Deepfakes**: We prohibit the cloning of public figures or non-consenting individuals.
-   **Transparency**: All AI-generated content is metadata-tagged to indicate it is synthetic.

## 5. Web3 & Financial Compliance
-   **Tokens**: Our internal "Credits" are utility tokens, not securities.
-   **NFTs**: Marketed as digital collectibles, not investment contracts.
-   **KYC/AML**: Fiat payments via Stripe utilize standard anti-fraud checks. Crypto payments (if added) will screen wallet addresses against blocked lists.

## 6. Official Documents
-   [Terms of Service](/terms) (`src/pages/Terms.tsx`)
-   [Privacy Policy](/privacy) (`src/pages/Privacy.tsx`)
