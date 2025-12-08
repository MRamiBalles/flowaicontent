-- ==========================================
-- AI Brand Deal Matchmaking Schema
-- Migration: 20251208170400_brand_deal_matchmaking.sql
-- AI-powered creator-brand matching with campaign management
-- ==========================================

-- ==========================================
-- Brand Profiles Table
-- Companies seeking creator partnerships
-- ==========================================
CREATE TABLE IF NOT EXISTS public.brand_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Brand identity
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    logo_url text,
    cover_image_url text,
    website_url text,
    
    -- Company info
    industry text NOT NULL,
    company_size text CHECK (company_size IN ('startup', 'small', 'medium', 'large', 'enterprise')),
    founded_year integer,
    headquarters_country text,
    
    -- Contact
    contact_email text NOT NULL,
    contact_name text,
    contact_phone text,
    
    -- Brand values and preferences
    brand_values text[] DEFAULT '{}',
    target_demographics text[] DEFAULT '{}',
    preferred_content_types text[] DEFAULT '{}',
    
    -- Budget
    monthly_budget_min integer, -- cents
    monthly_budget_max integer, -- cents
    currency text DEFAULT 'USD',
    
    -- Verification
    is_verified boolean DEFAULT false,
    verified_at timestamptz,
    verification_documents text[],
    
    -- Billing
    stripe_customer_id text,
    
    -- Status
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'suspended')),
    
    -- Ownership
    owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.brand_profiles IS 'Brand/company profiles for creator partnerships';

-- ==========================================
-- Creator Media Kits
-- Professional portfolios for brands to review
-- ==========================================
CREATE TABLE IF NOT EXISTS public.creator_media_kits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- Professional info
    display_name text NOT NULL,
    bio text,
    tagline text,
    profile_image_url text,
    
    -- Social links
    social_links jsonb DEFAULT '{}',
    -- { youtube: "...", instagram: "...", tiktok: "...", twitter: "..." }
    
    -- Content niches
    content_niches text[] NOT NULL DEFAULT '{}',
    content_types text[] NOT NULL DEFAULT '{}',
    
    -- Audience metrics
    total_followers integer DEFAULT 0,
    average_views integer DEFAULT 0,
    engagement_rate numeric(5, 2) DEFAULT 0,
    audience_demographics jsonb DEFAULT '{}',
    -- { age_groups: {...}, gender: {...}, countries: {...} }
    
    -- Pricing
    rate_per_post_min integer, -- cents
    rate_per_post_max integer,
    rate_per_video_min integer,
    rate_per_video_max integer,
    accepts_barter boolean DEFAULT false,
    
    -- Availability
    is_available boolean DEFAULT true,
    availability_notes text,
    response_time_hours integer DEFAULT 48,
    
    -- Portfolio
    featured_works jsonb DEFAULT '[]',
    -- Array of { title, url, thumbnail, metrics }
    
    -- Preferences
    preferred_industries text[] DEFAULT '{}',
    excluded_industries text[] DEFAULT '{}',
    minimum_deal_value integer, -- cents
    
    -- AI matching vector
    matching_embedding vector(1536), -- For semantic matching
    
    -- Stats
    total_deals_completed integer DEFAULT 0,
    total_earnings_cents bigint DEFAULT 0,
    average_rating numeric(3, 2) DEFAULT 0,
    
    -- Status
    is_public boolean DEFAULT true,
    featured_until timestamptz,
    
    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.creator_media_kits IS 'Creator portfolios and rate cards for brand partnerships';
COMMENT ON COLUMN public.creator_media_kits.matching_embedding IS 'OpenAI embedding for AI-powered matching';

-- ==========================================
-- Brand Campaigns
-- Active partnership campaigns from brands
-- ==========================================
CREATE TABLE IF NOT EXISTS public.brand_campaigns (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    brand_id uuid NOT NULL REFERENCES public.brand_profiles(id) ON DELETE CASCADE,
    
    -- Campaign details
    title text NOT NULL,
    description text NOT NULL,
    objectives text[] NOT NULL DEFAULT '{}',
    
    -- Requirements
    content_type text NOT NULL, -- video, post, story, reel, live
    content_requirements text,
    deliverables text[] NOT NULL DEFAULT '{}',
    hashtags text[] DEFAULT '{}',
    
    -- Target creators
    min_followers integer DEFAULT 0,
    max_followers integer,
    required_niches text[] DEFAULT '{}',
    preferred_demographics jsonb DEFAULT '{}',
    
    -- Budget
    budget_per_creator_cents integer NOT NULL,
    total_budget_cents integer NOT NULL,
    max_creators integer DEFAULT 10,
    
    -- Timeline
    application_deadline timestamptz NOT NULL,
    content_deadline timestamptz NOT NULL,
    publish_window_start timestamptz,
    publish_window_end timestamptz,
    
    -- AI matching
    matching_embedding vector(1536), -- For semantic matching
    
    -- Progress
    applications_count integer DEFAULT 0,
    accepted_count integer DEFAULT 0,
    completed_count integer DEFAULT 0,
    
    -- Status
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
    
    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.brand_campaigns IS 'Brand partnership campaigns seeking creators';

-- ==========================================
-- Brand Deals
-- Matched partnerships between brands and creators
-- ==========================================
CREATE TABLE IF NOT EXISTS public.brand_deals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    campaign_id uuid NOT NULL REFERENCES public.brand_campaigns(id) ON DELETE CASCADE,
    creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    brand_id uuid NOT NULL REFERENCES public.brand_profiles(id) ON DELETE CASCADE,
    
    -- AI matching score
    match_score numeric(5, 2), -- 0-100
    match_reasons jsonb DEFAULT '[]', -- Array of matching reasons
    
    -- Deal terms
    agreed_amount_cents integer NOT NULL,
    platform_fee_cents integer NOT NULL, -- 15% platform fee
    creator_payout_cents integer NOT NULL,
    
    -- Deliverables tracking
    deliverables jsonb NOT NULL DEFAULT '[]',
    -- Array of { type, description, status, due_date, submitted_url }
    
    -- Communication
    messages_count integer DEFAULT 0,
    last_message_at timestamptz,
    
    -- Status workflow
    status text NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', -- Brand sent offer
        'negotiating', -- Creator counter-offered
        'accepted', -- Both parties agreed
        'in_progress', -- Work started
        'review', -- Content submitted for review
        'revision_requested', -- Brand requested changes
        'approved', -- Brand approved content
        'published', -- Content is live
        'completed', -- Deal fulfilled
        'cancelled', -- Deal cancelled
        'disputed' -- In dispute
    )),
    
    -- Important dates
    offer_sent_at timestamptz DEFAULT now(),
    accepted_at timestamptz,
    started_at timestamptz,
    submitted_at timestamptz,
    approved_at timestamptz,
    completed_at timestamptz,
    
    -- Payment
    payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'escrowed', 'released', 'refunded')),
    escrow_transaction_id text,
    payout_transaction_id text,
    
    -- Ratings
    brand_rating integer CHECK (brand_rating >= 1 AND brand_rating <= 5),
    brand_review text,
    creator_rating integer CHECK (creator_rating >= 1 AND creator_rating <= 5),
    creator_review text,
    
    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    
    UNIQUE(campaign_id, creator_id)
);

COMMENT ON TABLE public.brand_deals IS 'Active partnerships between brands and creators';

-- ==========================================
-- Deal Messages
-- Communication within deals
-- ==========================================
CREATE TABLE IF NOT EXISTS public.deal_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    deal_id uuid NOT NULL REFERENCES public.brand_deals(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Message content
    message text NOT NULL,
    attachments jsonb DEFAULT '[]',
    
    -- Read status
    is_read boolean DEFAULT false,
    read_at timestamptz,
    
    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.deal_messages IS 'In-deal messaging between brands and creators';

-- ==========================================
-- AI Match Suggestions
-- AI-generated partnership recommendations
-- ==========================================
CREATE TABLE IF NOT EXISTS public.ai_match_suggestions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Match between
    campaign_id uuid REFERENCES public.brand_campaigns(id) ON DELETE CASCADE,
    creator_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- AI analysis
    match_score numeric(5, 2) NOT NULL,
    confidence numeric(5, 2) NOT NULL,
    match_reasons jsonb NOT NULL DEFAULT '[]',
    
    -- Recommendation text
    ai_summary text,
    suggested_rate_cents integer,
    
    -- Status
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'contacted', 'dismissed')),
    viewed_at timestamptz,
    
    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days')
);

COMMENT ON TABLE public.ai_match_suggestions IS 'AI-generated creator-brand match recommendations';

-- ==========================================
-- Row Level Security
-- ==========================================

ALTER TABLE public.brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_media_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_match_suggestions ENABLE ROW LEVEL SECURITY;

-- Brand Profiles: Public read for active, owner can manage
CREATE POLICY "Anyone can view active brands"
ON public.brand_profiles FOR SELECT
USING (status = 'active' AND is_verified = true);

CREATE POLICY "Brand owners can manage their brand"
ON public.brand_profiles FOR ALL
USING (auth.uid() = owner_user_id);

-- Creator Media Kits: Public read for active, owner can manage
CREATE POLICY "Anyone can view public media kits"
ON public.creator_media_kits FOR SELECT
USING (is_public = true);

CREATE POLICY "Creators can manage their media kit"
ON public.creator_media_kits FOR ALL
USING (auth.uid() = user_id);

-- Brand Campaigns: Creators can see active, brands manage theirs
CREATE POLICY "Creators can view active campaigns"
ON public.brand_campaigns FOR SELECT
USING (status = 'active' AND application_deadline > now());

CREATE POLICY "Brands can manage their campaigns"
ON public.brand_campaigns FOR ALL
USING (
    brand_id IN (
        SELECT id FROM public.brand_profiles WHERE owner_user_id = auth.uid()
    )
);

-- Brand Deals: Participants can view and update
CREATE POLICY "Participants can view their deals"
ON public.brand_deals FOR SELECT
USING (
    creator_id = auth.uid() OR
    brand_id IN (SELECT id FROM public.brand_profiles WHERE owner_user_id = auth.uid())
);

CREATE POLICY "Participants can update their deals"
ON public.brand_deals FOR UPDATE
USING (
    creator_id = auth.uid() OR
    brand_id IN (SELECT id FROM public.brand_profiles WHERE owner_user_id = auth.uid())
);

-- Deal Messages: Participants only
CREATE POLICY "Deal participants can manage messages"
ON public.deal_messages FOR ALL
USING (
    deal_id IN (
        SELECT id FROM public.brand_deals 
        WHERE creator_id = auth.uid() OR 
              brand_id IN (SELECT id FROM public.brand_profiles WHERE owner_user_id = auth.uid())
    )
);

-- AI Match Suggestions: Creators see their matches
CREATE POLICY "Creators can view their suggestions"
ON public.ai_match_suggestions FOR SELECT
USING (creator_id = auth.uid());

CREATE POLICY "Brands can view suggestions for their campaigns"
ON public.ai_match_suggestions FOR SELECT
USING (
    campaign_id IN (
        SELECT id FROM public.brand_campaigns 
        WHERE brand_id IN (SELECT id FROM public.brand_profiles WHERE owner_user_id = auth.uid())
    )
);

-- ==========================================
-- Indexes
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_brand_profiles_status 
ON public.brand_profiles(status);

CREATE INDEX IF NOT EXISTS idx_brand_profiles_industry 
ON public.brand_profiles(industry);

CREATE INDEX IF NOT EXISTS idx_creator_media_kits_public 
ON public.creator_media_kits(is_public) WHERE is_public = true;

CREATE INDEX IF NOT EXISTS idx_creator_media_kits_niches 
ON public.creator_media_kits USING GIN(content_niches);

CREATE INDEX IF NOT EXISTS idx_brand_campaigns_status 
ON public.brand_campaigns(status);

CREATE INDEX IF NOT EXISTS idx_brand_campaigns_deadline 
ON public.brand_campaigns(application_deadline);

CREATE INDEX IF NOT EXISTS idx_brand_campaigns_niches 
ON public.brand_campaigns USING GIN(required_niches);

CREATE INDEX IF NOT EXISTS idx_brand_deals_status 
ON public.brand_deals(status);

CREATE INDEX IF NOT EXISTS idx_brand_deals_creator 
ON public.brand_deals(creator_id);

CREATE INDEX IF NOT EXISTS idx_brand_deals_brand 
ON public.brand_deals(brand_id);

CREATE INDEX IF NOT EXISTS idx_deal_messages_deal 
ON public.deal_messages(deal_id);

CREATE INDEX IF NOT EXISTS idx_ai_suggestions_creator 
ON public.ai_match_suggestions(creator_id);

CREATE INDEX IF NOT EXISTS idx_ai_suggestions_campaign 
ON public.ai_match_suggestions(campaign_id);

-- ==========================================
-- Triggers
-- ==========================================

CREATE TRIGGER update_brand_profiles_updated_at
    BEFORE UPDATE ON public.brand_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_creator_media_kits_updated_at
    BEFORE UPDATE ON public.creator_media_kits
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_brand_campaigns_updated_at
    BEFORE UPDATE ON public.brand_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_brand_deals_updated_at
    BEFORE UPDATE ON public.brand_deals
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- Helper Functions
-- ==========================================

-- Calculate match score between creator and campaign
CREATE OR REPLACE FUNCTION public.calculate_match_score(
    p_creator_id uuid,
    p_campaign_id uuid
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_creator public.creator_media_kits%ROWTYPE;
    v_campaign public.brand_campaigns%ROWTYPE;
    v_score numeric := 0;
    v_niche_overlap integer;
BEGIN
    -- Get creator
    SELECT * INTO v_creator FROM public.creator_media_kits WHERE user_id = p_creator_id;
    IF NOT FOUND THEN RETURN 0; END IF;
    
    -- Get campaign
    SELECT * INTO v_campaign FROM public.brand_campaigns WHERE id = p_campaign_id;
    IF NOT FOUND THEN RETURN 0; END IF;
    
    -- Follower check (30 points)
    IF v_creator.total_followers >= COALESCE(v_campaign.min_followers, 0) THEN
        IF v_campaign.max_followers IS NULL OR v_creator.total_followers <= v_campaign.max_followers THEN
            v_score := v_score + 30;
        ELSE
            v_score := v_score + 15; -- Over max but acceptable
        END IF;
    END IF;
    
    -- Niche overlap (40 points)
    SELECT COUNT(*) INTO v_niche_overlap
    FROM unnest(v_creator.content_niches) AS cn
    WHERE cn = ANY(v_campaign.required_niches);
    
    IF array_length(v_campaign.required_niches, 1) > 0 THEN
        v_score := v_score + (40 * v_niche_overlap::numeric / array_length(v_campaign.required_niches, 1));
    ELSE
        v_score := v_score + 40; -- No niche requirement
    END IF;
    
    -- Engagement rate bonus (20 points)
    IF v_creator.engagement_rate >= 3.0 THEN
        v_score := v_score + 20;
    ELSIF v_creator.engagement_rate >= 1.5 THEN
        v_score := v_score + 10;
    END IF;
    
    -- Rating bonus (10 points)
    IF v_creator.average_rating >= 4.5 THEN
        v_score := v_score + 10;
    ELSIF v_creator.average_rating >= 4.0 THEN
        v_score := v_score + 5;
    END IF;
    
    RETURN LEAST(v_score, 100);
END;
$$;

-- Get top matching campaigns for a creator
CREATE OR REPLACE FUNCTION public.get_matching_campaigns(
    p_creator_id uuid,
    p_limit integer DEFAULT 10
)
RETURNS TABLE(
    campaign_id uuid,
    title text,
    brand_name text,
    budget_per_creator integer,
    match_score numeric,
    deadline timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id AS campaign_id,
        c.title,
        b.name AS brand_name,
        c.budget_per_creator_cents AS budget_per_creator,
        public.calculate_match_score(p_creator_id, c.id) AS match_score,
        c.application_deadline AS deadline
    FROM public.brand_campaigns c
    JOIN public.brand_profiles b ON c.brand_id = b.id
    WHERE c.status = 'active'
      AND c.application_deadline > now()
      AND c.accepted_count < c.max_creators
    ORDER BY public.calculate_match_score(p_creator_id, c.id) DESC
    LIMIT p_limit;
END;
$$;

-- Apply to campaign
CREATE OR REPLACE FUNCTION public.apply_to_campaign(
    p_campaign_id uuid,
    p_proposed_rate integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_campaign public.brand_campaigns%ROWTYPE;
    v_existing_deal uuid;
    v_deal_id uuid;
    v_match_score numeric;
BEGIN
    -- Get campaign
    SELECT * INTO v_campaign FROM public.brand_campaigns WHERE id = p_campaign_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Campaign not found');
    END IF;
    
    IF v_campaign.status != 'active' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Campaign is not active');
    END IF;
    
    IF v_campaign.application_deadline < now() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Application deadline has passed');
    END IF;
    
    -- Check for existing application
    SELECT id INTO v_existing_deal
    FROM public.brand_deals
    WHERE campaign_id = p_campaign_id AND creator_id = auth.uid();
    
    IF FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'You have already applied to this campaign');
    END IF;
    
    -- Calculate rate
    v_match_score := public.calculate_match_score(auth.uid(), p_campaign_id);
    
    -- Create deal with pending status
    INSERT INTO public.brand_deals (
        campaign_id,
        creator_id,
        brand_id,
        match_score,
        agreed_amount_cents,
        platform_fee_cents,
        creator_payout_cents,
        status
    ) VALUES (
        p_campaign_id,
        auth.uid(),
        v_campaign.brand_id,
        v_match_score,
        COALESCE(p_proposed_rate, v_campaign.budget_per_creator_cents),
        COALESCE(p_proposed_rate, v_campaign.budget_per_creator_cents) * 0.15,
        COALESCE(p_proposed_rate, v_campaign.budget_per_creator_cents) * 0.85,
        'pending'
    )
    RETURNING id INTO v_deal_id;
    
    -- Update campaign stats
    UPDATE public.brand_campaigns
    SET applications_count = applications_count + 1
    WHERE id = p_campaign_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'deal_id', v_deal_id,
        'match_score', v_match_score
    );
END;
$$;
