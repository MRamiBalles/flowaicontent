-- ==========================================
-- Creator Analytics Pro
-- Migration: 20251208214000_creator_analytics.sql
-- Advanced creator metrics and AI insights
-- ==========================================

-- Creator Analytics Summary (daily aggregates)
CREATE TABLE IF NOT EXISTS public.creator_analytics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date date NOT NULL,
    
    -- Engagement metrics
    total_views integer DEFAULT 0,
    total_likes integer DEFAULT 0,
    total_comments integer DEFAULT 0,
    total_shares integer DEFAULT 0,
    
    -- Revenue metrics
    revenue_cents integer DEFAULT 0,
    tips_cents integer DEFAULT 0,
    subscriptions_cents integer DEFAULT 0,
    licensing_cents integer DEFAULT 0,
    
    -- Growth metrics
    new_followers integer DEFAULT 0,
    unfollowers integer DEFAULT 0,
    profile_visits integer DEFAULT 0,
    
    -- AI predictions
    predicted_views_next_week integer,
    predicted_revenue_next_month integer,
    trending_score numeric(5,2),
    
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, date)
);

-- Content Performance (per video/content)
CREATE TABLE IF NOT EXISTS public.content_performance (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_id uuid NOT NULL,
    content_type text NOT NULL CHECK (content_type IN ('video', 'short', 'story', 'audio')),
    title text NOT NULL,
    
    -- Performance metrics
    views integer DEFAULT 0,
    watch_time_seconds integer DEFAULT 0,
    average_watch_percentage numeric(5,2),
    likes integer DEFAULT 0,
    dislikes integer DEFAULT 0,
    comments integer DEFAULT 0,
    shares integer DEFAULT 0,
    saves integer DEFAULT 0,
    
    -- Audience insights
    audience_retention jsonb DEFAULT '[]',
    traffic_sources jsonb DEFAULT '{}',
    demographics jsonb DEFAULT '{}',
    
    -- Revenue
    ad_revenue_cents integer DEFAULT 0,
    membership_revenue_cents integer DEFAULT 0,
    
    -- Timestamps
    published_at timestamptz,
    last_updated_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now()
);

-- Platform Metrics (cross-platform comparison)
CREATE TABLE IF NOT EXISTS public.platform_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    platform text NOT NULL CHECK (platform IN ('youtube', 'tiktok', 'instagram', 'twitter', 'flowai')),
    date date NOT NULL,
    
    -- Followers
    followers_count integer DEFAULT 0,
    followers_change integer DEFAULT 0,
    
    -- Engagement
    engagement_rate numeric(5,2),
    avg_views_per_post integer,
    avg_likes_per_post integer,
    
    -- Content
    posts_published integer DEFAULT 0,
    total_impressions integer DEFAULT 0,
    
    -- Connected account
    platform_user_id text,
    is_connected boolean DEFAULT false,
    last_synced_at timestamptz,
    
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, platform, date)
);

-- AI Insights (generated recommendations)
CREATE TABLE IF NOT EXISTS public.ai_analytics_insights (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    insight_type text NOT NULL CHECK (insight_type IN (
        'best_posting_time',
        'content_suggestion',
        'trend_alert',
        'performance_drop',
        'growth_opportunity',
        'monetization_tip'
    )),
    
    title text NOT NULL,
    description text NOT NULL,
    action_suggestion text,
    confidence_score numeric(3,2),
    
    is_read boolean DEFAULT false,
    is_dismissed boolean DEFAULT false,
    
    expires_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_creator_analytics_user_date ON public.creator_analytics(user_id, date DESC);
CREATE INDEX idx_content_performance_user ON public.content_performance(user_id, published_at DESC);
CREATE INDEX idx_platform_metrics_user_date ON public.platform_metrics(user_id, date DESC);
CREATE INDEX idx_ai_insights_user ON public.ai_analytics_insights(user_id, created_at DESC);

-- RLS Policies
ALTER TABLE public.creator_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analytics_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analytics"
ON public.creator_analytics FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view own content performance"
ON public.content_performance FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view own platform metrics"
ON public.platform_metrics FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own insights"
ON public.ai_analytics_insights FOR ALL
USING (auth.uid() = user_id);

-- Function to generate sample analytics data for new users
CREATE OR REPLACE FUNCTION public.seed_sample_analytics(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    i integer;
BEGIN
    FOR i IN 0..29 LOOP
        INSERT INTO public.creator_analytics (
            user_id, date, total_views, total_likes, total_comments,
            revenue_cents, new_followers, trending_score
        ) VALUES (
            p_user_id,
            CURRENT_DATE - i,
            floor(random() * 5000 + 1000)::integer,
            floor(random() * 500 + 100)::integer,
            floor(random() * 50 + 10)::integer,
            floor(random() * 10000 + 500)::integer,
            floor(random() * 50 + 5)::integer,
            (random() * 100)::numeric(5,2)
        ) ON CONFLICT (user_id, date) DO NOTHING;
    END LOOP;
END;
$$;
