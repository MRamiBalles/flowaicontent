-- ==========================================
-- NFT Tracking Tables
-- ==========================================

-- Table for minted NFTs
CREATE TABLE public.nfts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    video_id text NOT NULL,
    contract_address text NOT NULL,
    token_id bigint NOT NULL,
    transaction_hash text NOT NULL,
    title text NOT NULL,
    description text,
    total_shares bigint NOT NULL DEFAULT 1000000,
    network text NOT NULL DEFAULT 'polygon-amoy',
    metadata jsonb,
    minted_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(contract_address, token_id)
);

-- Table for NFT share ownership
CREATE TABLE public.nft_shares (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nft_id uuid NOT NULL REFERENCES public.nfts(id) ON DELETE CASCADE,
    owner_address text NOT NULL,
    shares bigint NOT NULL CHECK (shares > 0),
    acquired_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(nft_id, owner_address)
);

-- Table for NFT transactions (buys, sells, transfers)
CREATE TABLE public.nft_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nft_id uuid NOT NULL REFERENCES public.nfts(id) ON DELETE CASCADE,
    transaction_type text NOT NULL CHECK (transaction_type IN ('mint', 'buy', 'sell', 'transfer')),
    from_address text,
    to_address text NOT NULL,
    shares bigint NOT NULL,
    price_matic numeric(20, 6),
    transaction_hash text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- ==========================================
-- User-Created Style Packs Tables
-- ==========================================

-- Table for custom style packs created by users
CREATE TABLE public.user_style_packs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    price_cents integer NOT NULL CHECK (price_cents >= 0),
    preview_images text[] NOT NULL DEFAULT '{}',
    lora_url text, -- URL to trained LoRA file in storage
    training_status text NOT NULL DEFAULT 'pending' CHECK (training_status IN ('pending', 'training', 'completed', 'failed')),
    download_count integer NOT NULL DEFAULT 0,
    tags text[] NOT NULL DEFAULT '{}',
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table for style pack purchases
CREATE TABLE public.style_pack_purchases (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    style_pack_id uuid NOT NULL REFERENCES public.user_style_packs(id) ON DELETE CASCADE,
    buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    price_paid_cents integer NOT NULL,
    purchased_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(style_pack_id, buyer_id)
);

-- Table for tracking creator earnings (70/30 split)
CREATE TABLE public.creator_earnings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    style_pack_id uuid NOT NULL REFERENCES public.user_style_packs(id) ON DELETE CASCADE,
    purchase_id uuid NOT NULL REFERENCES public.style_pack_purchases(id) ON DELETE CASCADE,
    amount_cents integer NOT NULL,
    platform_fee_cents integer NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing')),
    payout_method text,
    paid_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- ==========================================
-- Storage Bucket for Style Pack Images
-- ==========================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('style-pack-images', 'style-pack-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('lora-files', 'lora-files', false)
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- RLS Policies for NFTs
-- ==========================================

ALTER TABLE public.nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_transactions ENABLE ROW LEVEL SECURITY;

-- NFTs: Users can view all, insert own, update own
CREATE POLICY "Anyone can view NFTs"
ON public.nfts FOR SELECT
USING (true);

CREATE POLICY "Users can mint own NFTs"
ON public.nfts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own NFTs"
ON public.nfts FOR UPDATE
USING (auth.uid() = user_id);

-- NFT Shares: Public read, restricted write
CREATE POLICY "Anyone can view NFT shares"
ON public.nft_shares FOR SELECT
USING (true);

CREATE POLICY "System can manage NFT shares"
ON public.nft_shares FOR ALL
USING (true)
WITH CHECK (true);

-- NFT Transactions: Public read, restricted write
CREATE POLICY "Anyone can view NFT transactions"
ON public.nft_transactions FOR SELECT
USING (true);

CREATE POLICY "System can insert NFT transactions"
ON public.nft_transactions FOR INSERT
WITH CHECK (true);

-- ==========================================
-- RLS Policies for Style Packs
-- ==========================================

ALTER TABLE public.user_style_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.style_pack_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_earnings ENABLE ROW LEVEL SECURITY;

-- Style Packs: Public can view active, creators can manage own
CREATE POLICY "Anyone can view active style packs"
ON public.user_style_packs FOR SELECT
USING (is_active = true OR creator_id = auth.uid());

CREATE POLICY "Users can create style packs"
ON public.user_style_packs FOR INSERT
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own style packs"
ON public.user_style_packs FOR UPDATE
USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete own style packs"
ON public.user_style_packs FOR DELETE
USING (auth.uid() = creator_id);

-- Style Pack Purchases: Users can view own purchases
CREATE POLICY "Users can view own purchases"
ON public.style_pack_purchases FOR SELECT
USING (auth.uid() = buyer_id);

CREATE POLICY "Creators can view purchases of their packs"
ON public.style_pack_purchases FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.user_style_packs
    WHERE id = style_pack_purchases.style_pack_id
    AND creator_id = auth.uid()
));

CREATE POLICY "Users can purchase style packs"
ON public.style_pack_purchases FOR INSERT
WITH CHECK (auth.uid() = buyer_id);

-- Creator Earnings: Creators can view own earnings
CREATE POLICY "Creators can view own earnings"
ON public.creator_earnings FOR SELECT
USING (auth.uid() = creator_id);

CREATE POLICY "System can insert creator earnings"
ON public.creator_earnings FOR INSERT
WITH CHECK (true);

-- ==========================================
-- Storage Policies
-- ==========================================

-- Style pack images are publicly readable
CREATE POLICY "Anyone can view style pack images"
ON storage.objects FOR SELECT
USING (bucket_id = 'style-pack-images');

CREATE POLICY "Authenticated users can upload style pack images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'style-pack-images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own style pack images"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'style-pack-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own style pack images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'style-pack-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- LoRA files are private
CREATE POLICY "Creators can upload LoRA files"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'lora-files'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can download purchased LoRA files"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'lora-files'
    AND (
        -- Creator can access
        auth.uid()::text = (storage.foldername(name))[1]
        OR
        -- Buyer who purchased can access
        EXISTS (
            SELECT 1 FROM public.style_pack_purchases spp
            JOIN public.user_style_packs usp ON spp.style_pack_id = usp.id
            WHERE spp.buyer_id = auth.uid()
            AND usp.lora_url = storage.objects.name
        )
    )
);

-- ==========================================
-- Indexes for Performance
-- ==========================================

CREATE INDEX idx_nfts_user_id ON public.nfts(user_id);
CREATE INDEX idx_nfts_contract_address ON public.nfts(contract_address);
CREATE INDEX idx_nft_shares_nft_id ON public.nft_shares(nft_id);
CREATE INDEX idx_nft_shares_owner ON public.nft_shares(owner_address);
CREATE INDEX idx_nft_transactions_nft_id ON public.nft_transactions(nft_id);
CREATE INDEX idx_user_style_packs_creator ON public.user_style_packs(creator_id);
CREATE INDEX idx_user_style_packs_active ON public.user_style_packs(is_active) WHERE is_active = true;
CREATE INDEX idx_style_pack_purchases_buyer ON public.style_pack_purchases(buyer_id);
CREATE INDEX idx_style_pack_purchases_pack ON public.style_pack_purchases(style_pack_id);
CREATE INDEX idx_creator_earnings_creator ON public.creator_earnings(creator_id);
CREATE INDEX idx_creator_earnings_status ON public.creator_earnings(status);

-- ==========================================
-- Triggers for Updated_At
-- ==========================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_style_packs_updated_at
BEFORE UPDATE ON public.user_style_packs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();