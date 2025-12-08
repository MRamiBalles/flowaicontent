-- ==========================================
-- Multi-Platform Syndication
-- Migration: 20251208215700_syndication.sql
-- Auto-publish to YouTube, TikTok, Instagram, Twitter
-- ==========================================

-- Connected Platform Accounts
CREATE TABLE IF NOT EXISTS public.connected_platforms (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    platform text NOT NULL CHECK (platform IN ('youtube', 'tiktok', 'instagram', 'twitter', 'facebook', 'linkedin')),
    
    -- OAuth tokens (encrypted in production)
    access_token text,
    refresh_token text,
    token_expires_at timestamptz,
    
    -- Account info
    platform_user_id text,
    platform_username text,
    platform_avatar_url text,
    account_type text, -- 'personal', 'business', 'creator'
    
    -- Status
    is_active boolean DEFAULT true,
    last_synced_at timestamptz,
    
    -- Metadata
    scopes text[],
    metadata jsonb DEFAULT '{}',
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    UNIQUE(user_id, platform, platform_user_id)
);

-- Syndication Posts (content to publish)
CREATE TABLE IF NOT EXISTS public.syndication_posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Content
    title text NOT NULL,
    description text,
    content_url text, -- Video/image URL
    content_type text NOT NULL CHECK (content_type IN ('video', 'image', 'text', 'reel', 'short')),
    thumbnail_url text,
    
    -- Target platforms
    target_platforms text[] NOT NULL,
    
    -- Platform-specific settings
    platform_settings jsonb DEFAULT '{}', -- { youtube: { visibility: 'public' }, tiktok: { duet: true } }
    
    -- Scheduling
    scheduled_at timestamptz,
    is_scheduled boolean DEFAULT false,
    
    -- Status
    status text DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'publishing', 'published', 'partial', 'failed')),
    
    -- Results
    publish_results jsonb DEFAULT '{}', -- { youtube: { success: true, url: '...' }, tiktok: { success: false, error: '...' } }
    
    created_at timestamptz DEFAULT now(),
    published_at timestamptz
);

-- Platform-specific post records
CREATE TABLE IF NOT EXISTS public.syndication_post_platforms (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid NOT NULL REFERENCES public.syndication_posts(id) ON DELETE CASCADE,
    platform_id uuid NOT NULL REFERENCES public.connected_platforms(id) ON DELETE CASCADE,
    
    -- Result
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'publishing', 'published', 'failed')),
    platform_post_id text,
    platform_post_url text,
    error_message text,
    
    -- Metrics (updated periodically)
    views integer DEFAULT 0,
    likes integer DEFAULT 0,
    comments integer DEFAULT 0,
    shares integer DEFAULT 0,
    
    published_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- Scheduling templates
CREATE TABLE IF NOT EXISTS public.syndication_schedules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    name text NOT NULL,
    description text,
    
    -- Schedule pattern
    platforms text[] NOT NULL,
    days_of_week integer[] DEFAULT '{1,2,3,4,5}', -- 0=Sun, 1=Mon, etc
    time_of_day time NOT NULL,
    timezone text DEFAULT 'UTC',
    
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_connected_platforms_user ON public.connected_platforms(user_id);
CREATE INDEX idx_syndication_posts_user ON public.syndication_posts(user_id, created_at DESC);
CREATE INDEX idx_syndication_posts_scheduled ON public.syndication_posts(scheduled_at) WHERE is_scheduled = true;
CREATE INDEX idx_post_platforms_post ON public.syndication_post_platforms(post_id);

-- RLS
ALTER TABLE public.connected_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syndication_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syndication_post_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syndication_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own connected platforms"
ON public.connected_platforms FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own syndication posts"
ON public.syndication_posts FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Users can view own post platforms"
ON public.syndication_post_platforms FOR SELECT
USING (
    post_id IN (SELECT id FROM public.syndication_posts WHERE user_id = auth.uid())
);

CREATE POLICY "Users can manage own schedules"
ON public.syndication_schedules FOR ALL
USING (auth.uid() = user_id);
