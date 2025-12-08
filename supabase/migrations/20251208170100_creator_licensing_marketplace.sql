-- ==========================================
-- Creator Licensing Marketplace Schema
-- Migration: 20251208170100_creator_licensing_marketplace.sql
-- ==========================================

-- ==========================================
-- Content Licenses Table
-- Allows creators to license their content to others
-- ==========================================
CREATE TABLE IF NOT EXISTS public.content_licenses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Content being licensed
    content_type text NOT NULL CHECK (content_type IN ('video', 'style_pack', 'voice', 'music', 'template')),
    content_id uuid NOT NULL,
    content_title text NOT NULL,
    content_preview_url text,
    
    -- Creator (licensor)
    creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- License terms
    license_type text NOT NULL CHECK (license_type IN (
        'royalty_free',      -- One-time payment, unlimited use
        'rights_managed',    -- Per-use or time-limited
        'editorial',         -- News/education only
        'commercial',        -- Full commercial rights
        'exclusive'          -- Buyer gets exclusive rights
    )),
    
    -- Usage restrictions
    usage_rights jsonb NOT NULL DEFAULT '["web", "social", "broadcast"]'::jsonb,
    -- Options: web, social, broadcast, print, merchandise, nft, ai_training
    
    max_impressions integer, -- NULL = unlimited
    duration_days integer, -- NULL = perpetual
    territory text[] NOT NULL DEFAULT '{worldwide}',
    
    -- Pricing
    price_cents integer NOT NULL CHECK (price_cents >= 0),
    currency text NOT NULL DEFAULT 'USD',
    
    -- Royalties (for rights_managed)
    royalty_percentage numeric(5, 2) NOT NULL DEFAULT 0 CHECK (royalty_percentage >= 0 AND royalty_percentage <= 50),
    
    -- Attribution
    requires_attribution boolean NOT NULL DEFAULT false,
    attribution_text text,
    
    -- AI/Training restrictions
    allows_ai_training boolean NOT NULL DEFAULT false,
    allows_derivative_works boolean NOT NULL DEFAULT true,
    
    -- Status
    is_active boolean NOT NULL DEFAULT true,
    is_featured boolean NOT NULL DEFAULT false,
    
    -- Analytics
    view_count integer NOT NULL DEFAULT 0,
    total_purchases integer NOT NULL DEFAULT 0,
    total_revenue_cents bigint NOT NULL DEFAULT 0,
    
    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    
    -- Unique constraint to prevent duplicate licenses
    UNIQUE(content_type, content_id, license_type)
);

COMMENT ON TABLE public.content_licenses IS 'Content licensing marketplace - creators can sell licenses for their content';
COMMENT ON COLUMN public.content_licenses.license_type IS 'Type of license: royalty_free (one-time), rights_managed (per-use), editorial, commercial, exclusive';
COMMENT ON COLUMN public.content_licenses.royalty_percentage IS 'For rights_managed: ongoing royalty percentage (0-50%)';

-- ==========================================
-- License Purchases Table
-- Records of purchased licenses
-- ==========================================
CREATE TABLE IF NOT EXISTS public.license_purchases (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- License being purchased
    license_id uuid NOT NULL REFERENCES public.content_licenses(id) ON DELETE RESTRICT,
    
    -- Buyer
    buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    buyer_company_name text,
    
    -- Transaction
    amount_paid_cents integer NOT NULL,
    currency text NOT NULL DEFAULT 'USD',
    stripe_payment_intent_id text,
    
    -- Revenue split (70% creator, 30% platform)
    creator_earnings_cents integer NOT NULL,
    platform_fee_cents integer NOT NULL,
    
    -- License specifics for this purchase
    license_key text NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
    
    -- Usage limits (copied from license at time of purchase)
    usage_limit integer, -- NULL = unlimited
    usage_count integer NOT NULL DEFAULT 0,
    impressions_limit integer,
    impressions_count integer NOT NULL DEFAULT 0,
    
    -- Validity
    valid_from timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz, -- NULL = perpetual
    
    -- Status
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'refunded')),
    
    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),
    
    -- Prevent duplicate purchases of exclusive licenses
    UNIQUE(license_id, buyer_id) -- One purchase per buyer per license
);

COMMENT ON TABLE public.license_purchases IS 'Records of license purchases with usage tracking';
COMMENT ON COLUMN public.license_purchases.license_key IS 'Unique key that proves license ownership';

-- ==========================================
-- Royalty Transactions Table
-- Tracks ongoing royalty payments for rights_managed licenses
-- ==========================================
CREATE TABLE IF NOT EXISTS public.royalty_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Related records
    license_purchase_id uuid NOT NULL REFERENCES public.license_purchases(id) ON DELETE CASCADE,
    license_id uuid NOT NULL REFERENCES public.content_licenses(id) ON DELETE CASCADE,
    creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Usage that triggered royalty
    usage_type text NOT NULL CHECK (usage_type IN ('impression', 'download', 'stream', 'embed', 'api_call')),
    usage_count integer NOT NULL DEFAULT 1,
    
    -- Royalty calculation
    base_amount_cents integer NOT NULL, -- e.g., $0.01 per impression
    royalty_rate numeric(5, 2) NOT NULL,
    royalty_amount_cents integer NOT NULL,
    
    -- Payment status
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed')),
    
    -- Payout info (when status = 'paid')
    payout_batch_id uuid,
    paid_at timestamptz,
    
    -- Period
    period_start date NOT NULL,
    period_end date NOT NULL,
    
    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.royalty_transactions IS 'Ongoing royalty payments for rights-managed content';

-- ==========================================
-- Creator Payouts Table
-- Batch payouts to creators
-- ==========================================
CREATE TABLE IF NOT EXISTS public.creator_payouts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Amount
    total_amount_cents integer NOT NULL CHECK (total_amount_cents > 0),
    currency text NOT NULL DEFAULT 'USD',
    
    -- Breakdown
    license_earnings_cents integer NOT NULL DEFAULT 0,
    royalty_earnings_cents integer NOT NULL DEFAULT 0,
    tip_earnings_cents integer NOT NULL DEFAULT 0,
    
    -- Payout method
    payout_method text NOT NULL CHECK (payout_method IN ('stripe_connect', 'paypal', 'bank_transfer', 'crypto')),
    payout_destination text, -- Account ID/address
    
    -- Status
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    
    -- External reference
    stripe_transfer_id text,
    
    -- Processing
    initiated_at timestamptz,
    completed_at timestamptz,
    failure_reason text,
    
    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.creator_payouts IS 'Batch payouts to creators for all earnings';

-- ==========================================
-- License Analytics Table
-- Detailed analytics for license usage
-- ==========================================
CREATE TABLE IF NOT EXISTS public.license_analytics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    license_purchase_id uuid NOT NULL REFERENCES public.license_purchases(id) ON DELETE CASCADE,
    
    -- Event info
    event_type text NOT NULL CHECK (event_type IN ('view', 'download', 'embed', 'api_use', 'attribution')),
    
    -- Context
    ip_address inet,
    user_agent text,
    referer_url text,
    country_code text,
    
    -- Metadata
    metadata jsonb DEFAULT '{}',
    
    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.license_analytics IS 'Analytics for license usage tracking';

-- ==========================================
-- Row Level Security Policies
-- ==========================================

ALTER TABLE public.content_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.royalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_analytics ENABLE ROW LEVEL SECURITY;

-- Content Licenses: Public read, creator manages own
CREATE POLICY "Anyone can view active licenses"
ON public.content_licenses FOR SELECT
USING (is_active = true);

CREATE POLICY "Creators can manage own licenses"
ON public.content_licenses FOR ALL
USING (auth.uid() = creator_id);

-- License Purchases: Buyer and creator can view
CREATE POLICY "Buyers can view own purchases"
ON public.license_purchases FOR SELECT
USING (auth.uid() = buyer_id);

CREATE POLICY "Creators can view purchases of their licenses"
ON public.license_purchases FOR SELECT
USING (
    license_id IN (
        SELECT id FROM public.content_licenses
        WHERE creator_id = auth.uid()
    )
);

CREATE POLICY "Authenticated users can purchase licenses"
ON public.license_purchases FOR INSERT
WITH CHECK (auth.uid() = buyer_id);

-- Royalty Transactions: Creator view only
CREATE POLICY "Creators can view own royalty transactions"
ON public.royalty_transactions FOR SELECT
USING (auth.uid() = creator_id);

-- Creator Payouts: Creator view only
CREATE POLICY "Creators can view own payouts"
ON public.creator_payouts FOR SELECT
USING (auth.uid() = creator_id);

-- License Analytics: Buyers can view their own
CREATE POLICY "Buyers can view own license analytics"
ON public.license_analytics FOR SELECT
USING (
    license_purchase_id IN (
        SELECT id FROM public.license_purchases
        WHERE buyer_id = auth.uid()
    )
);

-- ==========================================
-- Performance Indexes
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_content_licenses_creator 
ON public.content_licenses(creator_id);

CREATE INDEX IF NOT EXISTS idx_content_licenses_type 
ON public.content_licenses(content_type);

CREATE INDEX IF NOT EXISTS idx_content_licenses_active 
ON public.content_licenses(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_content_licenses_featured 
ON public.content_licenses(is_featured) WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS idx_license_purchases_buyer 
ON public.license_purchases(buyer_id);

CREATE INDEX IF NOT EXISTS idx_license_purchases_license 
ON public.license_purchases(license_id);

CREATE INDEX IF NOT EXISTS idx_license_purchases_status 
ON public.license_purchases(status);

CREATE INDEX IF NOT EXISTS idx_royalty_transactions_creator 
ON public.royalty_transactions(creator_id);

CREATE INDEX IF NOT EXISTS idx_royalty_transactions_status 
ON public.royalty_transactions(status);

CREATE INDEX IF NOT EXISTS idx_creator_payouts_creator 
ON public.creator_payouts(creator_id);

CREATE INDEX IF NOT EXISTS idx_creator_payouts_status 
ON public.creator_payouts(status);

-- ==========================================
-- Triggers
-- ==========================================

-- Update license analytics on purchase
CREATE OR REPLACE FUNCTION public.update_license_on_purchase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.content_licenses
    SET 
        total_purchases = total_purchases + 1,
        total_revenue_cents = total_revenue_cents + NEW.amount_paid_cents,
        updated_at = now()
    WHERE id = NEW.license_id;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_license_purchase
    AFTER INSERT ON public.license_purchases
    FOR EACH ROW
    EXECUTE FUNCTION public.update_license_on_purchase();

-- Auto-update updated_at
CREATE TRIGGER update_content_licenses_updated_at
    BEFORE UPDATE ON public.content_licenses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- Helper Functions
-- ==========================================

-- Check if a license purchase is valid (not expired, not exceeded limits)
CREATE OR REPLACE FUNCTION public.is_license_valid(purchase_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_purchase public.license_purchases%ROWTYPE;
BEGIN
    SELECT * INTO v_purchase
    FROM public.license_purchases
    WHERE id = purchase_id;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Check status
    IF v_purchase.status != 'active' THEN
        RETURN false;
    END IF;
    
    -- Check expiration
    IF v_purchase.expires_at IS NOT NULL AND v_purchase.expires_at < now() THEN
        -- Auto-expire the license
        UPDATE public.license_purchases
        SET status = 'expired'
        WHERE id = purchase_id;
        RETURN false;
    END IF;
    
    -- Check usage limits
    IF v_purchase.usage_limit IS NOT NULL AND v_purchase.usage_count >= v_purchase.usage_limit THEN
        RETURN false;
    END IF;
    
    -- Check impression limits
    IF v_purchase.impressions_limit IS NOT NULL AND v_purchase.impressions_count >= v_purchase.impressions_limit THEN
        RETURN false;
    END IF;
    
    RETURN true;
END;
$$;

-- Record license usage and trigger royalty if applicable
CREATE OR REPLACE FUNCTION public.record_license_usage(
    p_purchase_id uuid,
    p_usage_type text,
    p_count integer DEFAULT 1
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_purchase public.license_purchases%ROWTYPE;
    v_license public.content_licenses%ROWTYPE;
    v_base_rate integer;
    v_royalty_amount integer;
BEGIN
    -- Validate license
    IF NOT public.is_license_valid(p_purchase_id) THEN
        RETURN false;
    END IF;
    
    SELECT * INTO v_purchase FROM public.license_purchases WHERE id = p_purchase_id;
    SELECT * INTO v_license FROM public.content_licenses WHERE id = v_purchase.license_id;
    
    -- Update usage counts
    UPDATE public.license_purchases
    SET 
        usage_count = usage_count + p_count,
        impressions_count = CASE 
            WHEN p_usage_type = 'impression' THEN impressions_count + p_count 
            ELSE impressions_count 
        END
    WHERE id = p_purchase_id;
    
    -- Record analytics
    INSERT INTO public.license_analytics (license_purchase_id, event_type)
    VALUES (p_purchase_id, p_usage_type);
    
    -- Calculate royalties for rights_managed licenses
    IF v_license.license_type = 'rights_managed' AND v_license.royalty_percentage > 0 THEN
        -- Base rate: $0.001 per impression, $0.01 per download
        v_base_rate := CASE p_usage_type
            WHEN 'impression' THEN 1  -- $0.001
            WHEN 'download' THEN 10   -- $0.01
            WHEN 'embed' THEN 5       -- $0.005
            ELSE 1
        END;
        
        v_royalty_amount := (v_base_rate * p_count * v_license.royalty_percentage / 100)::integer;
        
        IF v_royalty_amount > 0 THEN
            INSERT INTO public.royalty_transactions (
                license_purchase_id,
                license_id,
                creator_id,
                usage_type,
                usage_count,
                base_amount_cents,
                royalty_rate,
                royalty_amount_cents,
                period_start,
                period_end
            ) VALUES (
                p_purchase_id,
                v_license.id,
                v_license.creator_id,
                p_usage_type,
                p_count,
                v_base_rate * p_count,
                v_license.royalty_percentage,
                v_royalty_amount,
                date_trunc('month', now())::date,
                (date_trunc('month', now()) + interval '1 month' - interval '1 day')::date
            );
        END IF;
    END IF;
    
    RETURN true;
END;
$$;

-- Get creator earnings summary
CREATE OR REPLACE FUNCTION public.get_creator_earnings_summary(p_creator_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'total_licenses', (SELECT COUNT(*) FROM public.content_licenses WHERE creator_id = p_creator_id),
        'active_licenses', (SELECT COUNT(*) FROM public.content_licenses WHERE creator_id = p_creator_id AND is_active = true),
        'total_sales', (
            SELECT COALESCE(SUM(total_purchases), 0) 
            FROM public.content_licenses 
            WHERE creator_id = p_creator_id
        ),
        'total_revenue_cents', (
            SELECT COALESCE(SUM(total_revenue_cents), 0) 
            FROM public.content_licenses 
            WHERE creator_id = p_creator_id
        ),
        'pending_royalties_cents', (
            SELECT COALESCE(SUM(royalty_amount_cents), 0) 
            FROM public.royalty_transactions 
            WHERE creator_id = p_creator_id AND status = 'pending'
        ),
        'total_payouts_cents', (
            SELECT COALESCE(SUM(total_amount_cents), 0) 
            FROM public.creator_payouts 
            WHERE creator_id = p_creator_id AND status = 'completed'
        ),
        'pending_payout_cents', (
            SELECT COALESCE(SUM(total_amount_cents), 0) 
            FROM public.creator_payouts 
            WHERE creator_id = p_creator_id AND status = 'pending'
        )
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;
