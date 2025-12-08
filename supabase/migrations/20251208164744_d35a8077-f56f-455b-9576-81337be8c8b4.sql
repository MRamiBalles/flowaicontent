-- =============================================
-- PREMIUM FEATURES DATABASE MIGRATION
-- Creates all missing tables for premium features
-- =============================================

-- 1. CREATOR MEDIA KITS (Brand Deals Feature)
CREATE TABLE IF NOT EXISTS public.creator_media_kits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    bio TEXT,
    total_followers INTEGER DEFAULT 0,
    engagement_rate NUMERIC(5,2) DEFAULT 0,
    content_niches TEXT[] DEFAULT '{}',
    rate_per_post_min INTEGER DEFAULT 0,
    rate_per_post_max INTEGER DEFAULT 0,
    portfolio_urls TEXT[] DEFAULT '{}',
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

-- 2. BRAND PROFILES (Brand Deals Feature)
CREATE TABLE IF NOT EXISTS public.brand_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    logo_url TEXT,
    website_url TEXT,
    industry TEXT,
    description TEXT,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

-- 3. BRAND CAMPAIGNS (Brand Deals Feature)
CREATE TABLE IF NOT EXISTS public.brand_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES public.brand_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    content_type TEXT NOT NULL,
    budget_per_creator INTEGER NOT NULL,
    total_budget INTEGER,
    target_niches TEXT[] DEFAULT '{}',
    min_followers INTEGER DEFAULT 0,
    content_deadline TIMESTAMPTZ,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. BRAND DEALS (Brand Deals Feature)
CREATE TABLE IF NOT EXISTS public.brand_deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.brand_campaigns(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    agreed_amount_cents INTEGER,
    match_score NUMERIC(5,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. DEVELOPER ACCOUNTS (API Platform Feature)
CREATE TABLE IF NOT EXISTS public.developer_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT,
    website_url TEXT,
    description TEXT,
    tier TEXT DEFAULT 'free',
    status TEXT DEFAULT 'active',
    api_calls_limit INTEGER DEFAULT 1000,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

-- 6. API KEYS (API Platform Feature)
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    developer_id UUID NOT NULL REFERENCES public.developer_accounts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    key_prefix TEXT NOT NULL,
    scopes TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMPTZ,
    total_requests INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. API USAGE LOGS (API Platform Feature)
CREATE TABLE IF NOT EXISTS public.api_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER,
    response_time_ms INTEGER,
    credits_consumed INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. ENTERPRISE TENANTS (Enterprise Feature)
CREATE TABLE IF NOT EXISTS public.enterprise_tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#6366f1',
    custom_domain TEXT,
    user_limit INTEGER DEFAULT 10,
    status TEXT DEFAULT 'active',
    features JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. ENTERPRISE USERS (Enterprise Feature)
CREATE TABLE IF NOT EXISTS public.enterprise_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.enterprise_tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'member',
    status TEXT DEFAULT 'active',
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, user_id)
);

-- 10. ENTERPRISE AUDIT LOGS (Enterprise Feature)
CREATE TABLE IF NOT EXISTS public.enterprise_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.enterprise_tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    details JSONB DEFAULT '{}',
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. ENTERPRISE API KEYS (Enterprise Feature)
CREATE TABLE IF NOT EXISTS public.enterprise_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.enterprise_tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    key_prefix TEXT NOT NULL,
    scopes TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    rate_limit INTEGER DEFAULT 1000,
    created_by UUID REFERENCES auth.users(id),
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. INTERACTIVE STORIES (Interactive Experiences Feature)
CREATE TABLE IF NOT EXISTS public.interactive_stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    total_scenes INTEGER DEFAULT 0,
    total_endings INTEGER DEFAULT 0,
    total_plays INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 13. STORY SCENES (Interactive Experiences Feature)
CREATE TABLE IF NOT EXISTS public.story_scenes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES public.interactive_stories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    video_url TEXT,
    video_duration_seconds INTEGER DEFAULT 0,
    choice_appears_at_seconds INTEGER,
    choice_timeout_seconds INTEGER DEFAULT 10,
    scene_type TEXT DEFAULT 'normal',
    ending_type TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 14. SCENE CHOICES (Interactive Experiences Feature)
CREATE TABLE IF NOT EXISTS public.scene_choices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scene_id UUID NOT NULL REFERENCES public.story_scenes(id) ON DELETE CASCADE,
    choice_text TEXT NOT NULL,
    choice_order INTEGER DEFAULT 0,
    choice_color TEXT,
    next_scene_id UUID REFERENCES public.story_scenes(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 15. CONTENT LICENSES (Licensing Marketplace Feature)
CREATE TABLE IF NOT EXISTS public.content_licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL,
    content_id TEXT NOT NULL,
    content_title TEXT NOT NULL,
    content_preview_url TEXT,
    license_type TEXT NOT NULL,
    price_cents INTEGER NOT NULL DEFAULT 0,
    usage_rights TEXT[] DEFAULT '{}',
    duration_days INTEGER,
    territory TEXT[] DEFAULT '{}',
    royalty_percentage INTEGER DEFAULT 0,
    requires_attribution BOOLEAN DEFAULT false,
    allows_ai_training BOOLEAN DEFAULT false,
    total_purchases INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 16. LICENSE PURCHASES (Licensing Marketplace Feature)
CREATE TABLE IF NOT EXISTS public.license_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_id UUID NOT NULL REFERENCES public.content_licenses(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    license_key TEXT NOT NULL UNIQUE,
    amount_paid_cents INTEGER NOT NULL,
    status TEXT DEFAULT 'active',
    expires_at TIMESTAMPTZ,
    usage_count INTEGER DEFAULT 0,
    usage_limit INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 17. VIDEO PROJECTS (Video Editor Pro Feature)
CREATE TABLE IF NOT EXISTS public.video_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Untitled Project',
    width INTEGER DEFAULT 1920,
    height INTEGER DEFAULT 1080,
    fps INTEGER DEFAULT 30,
    duration_frames INTEGER DEFAULT 300,
    composition_data JSONB DEFAULT '{}',
    render_status TEXT DEFAULT 'idle',
    render_progress INTEGER DEFAULT 0,
    rendered_video_url TEXT,
    is_template BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 18. VIDEO TRACKS (Video Editor Pro Feature)
CREATE TABLE IF NOT EXISTS public.video_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.video_projects(id) ON DELETE CASCADE,
    track_type TEXT NOT NULL,
    name TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    is_locked BOOLEAN DEFAULT false,
    is_visible BOOLEAN DEFAULT true,
    is_muted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 19. VIDEO CLIPS (Video Editor Pro Feature)
CREATE TABLE IF NOT EXISTS public.video_clips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id UUID NOT NULL REFERENCES public.video_tracks(id) ON DELETE CASCADE,
    clip_type TEXT NOT NULL,
    start_frame INTEGER NOT NULL,
    end_frame INTEGER NOT NULL,
    source_url TEXT,
    text_content TEXT,
    transform JSONB DEFAULT '{}',
    effects JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 20. VOICE CLONES (Voice Studio Feature)
CREATE TABLE IF NOT EXISTS public.voice_clones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    language TEXT DEFAULT 'en',
    sample_audio_url TEXT,
    external_voice_id TEXT,
    status TEXT DEFAULT 'processing',
    total_generations INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 21. VOICE CREDITS (Voice Studio Feature)
CREATE TABLE IF NOT EXISTS public.voice_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    available_credits INTEGER DEFAULT 0,
    monthly_limit INTEGER DEFAULT 600,
    monthly_used INTEGER DEFAULT 0,
    reset_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

-- 22. VOICE GENERATIONS (Voice Studio Feature)
CREATE TABLE IF NOT EXISTS public.voice_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    voice_id UUID REFERENCES public.voice_clones(id) ON DELETE SET NULL,
    text_input TEXT NOT NULL,
    audio_url TEXT,
    duration_seconds INTEGER DEFAULT 0,
    credits_used INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- ENABLE RLS ON ALL NEW TABLES
-- =============================================

ALTER TABLE public.creator_media_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developer_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactive_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scene_choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_clones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_generations ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES FOR PREMIUM FEATURES
-- =============================================

-- Creator Media Kits
CREATE POLICY "Users can view all media kits" ON public.creator_media_kits FOR SELECT USING (true);
CREATE POLICY "Users can manage own media kit" ON public.creator_media_kits FOR ALL USING (auth.uid() = user_id);

-- Brand Profiles
CREATE POLICY "Anyone can view brand profiles" ON public.brand_profiles FOR SELECT USING (true);
CREATE POLICY "Users can manage own brand profile" ON public.brand_profiles FOR ALL USING (auth.uid() = user_id);

-- Brand Campaigns
CREATE POLICY "Anyone can view active campaigns" ON public.brand_campaigns FOR SELECT USING (status = 'active');
CREATE POLICY "Brands can manage own campaigns" ON public.brand_campaigns FOR ALL USING (
    EXISTS (SELECT 1 FROM public.brand_profiles WHERE id = brand_id AND user_id = auth.uid())
);

-- Brand Deals
CREATE POLICY "Creators can view own deals" ON public.brand_deals FOR SELECT USING (auth.uid() = creator_id);
CREATE POLICY "Brands can view deals for their campaigns" ON public.brand_deals FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.brand_campaigns bc 
            JOIN public.brand_profiles bp ON bc.brand_id = bp.id 
            WHERE bc.id = campaign_id AND bp.user_id = auth.uid())
);
CREATE POLICY "Creators can create deals" ON public.brand_deals FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Participants can update deals" ON public.brand_deals FOR UPDATE USING (
    auth.uid() = creator_id OR 
    EXISTS (SELECT 1 FROM public.brand_campaigns bc 
            JOIN public.brand_profiles bp ON bc.brand_id = bp.id 
            WHERE bc.id = campaign_id AND bp.user_id = auth.uid())
);

-- Developer Accounts
CREATE POLICY "Users can view own developer account" ON public.developer_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own developer account" ON public.developer_accounts FOR ALL USING (auth.uid() = user_id);

-- API Keys
CREATE POLICY "Developers can view own keys" ON public.api_keys FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.developer_accounts WHERE id = developer_id AND user_id = auth.uid())
);
CREATE POLICY "Developers can manage own keys" ON public.api_keys FOR ALL USING (
    EXISTS (SELECT 1 FROM public.developer_accounts WHERE id = developer_id AND user_id = auth.uid())
);

-- API Usage Logs
CREATE POLICY "Developers can view own logs" ON public.api_usage_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.api_keys ak 
            JOIN public.developer_accounts da ON ak.developer_id = da.id 
            WHERE ak.id = api_key_id AND da.user_id = auth.uid())
);

-- Enterprise Tenants
CREATE POLICY "Tenant members can view tenant" ON public.enterprise_tenants FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.enterprise_users WHERE tenant_id = id AND user_id = auth.uid() AND status = 'active')
);
CREATE POLICY "Tenant owners can update tenant" ON public.enterprise_tenants FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.enterprise_users WHERE tenant_id = id AND user_id = auth.uid() AND role = 'owner')
);

-- Enterprise Users
CREATE POLICY "Tenant members can view colleagues" ON public.enterprise_users FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.enterprise_users eu WHERE eu.tenant_id = tenant_id AND eu.user_id = auth.uid() AND eu.status = 'active')
);
CREATE POLICY "Admins can manage users" ON public.enterprise_users FOR ALL USING (
    EXISTS (SELECT 1 FROM public.enterprise_users eu WHERE eu.tenant_id = tenant_id AND eu.user_id = auth.uid() AND eu.role IN ('owner', 'admin'))
);

-- Enterprise Audit Logs
CREATE POLICY "Admins can view audit logs" ON public.enterprise_audit_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.enterprise_users eu WHERE eu.tenant_id = tenant_id AND eu.user_id = auth.uid() AND eu.role IN ('owner', 'admin'))
);

-- Enterprise API Keys
CREATE POLICY "Admins can view enterprise keys" ON public.enterprise_api_keys FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.enterprise_users eu WHERE eu.tenant_id = tenant_id AND eu.user_id = auth.uid() AND eu.role IN ('owner', 'admin'))
);
CREATE POLICY "Admins can manage enterprise keys" ON public.enterprise_api_keys FOR ALL USING (
    EXISTS (SELECT 1 FROM public.enterprise_users eu WHERE eu.tenant_id = tenant_id AND eu.user_id = auth.uid() AND eu.role IN ('owner', 'admin'))
);

-- Interactive Stories
CREATE POLICY "Anyone can view published stories" ON public.interactive_stories FOR SELECT USING (status = 'published');
CREATE POLICY "Creators can view own stories" ON public.interactive_stories FOR SELECT USING (auth.uid() = creator_id);
CREATE POLICY "Creators can manage own stories" ON public.interactive_stories FOR ALL USING (auth.uid() = creator_id);

-- Story Scenes
CREATE POLICY "Anyone can view scenes of published stories" ON public.story_scenes FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.interactive_stories WHERE id = story_id AND status = 'published')
);
CREATE POLICY "Creators can manage scenes" ON public.story_scenes FOR ALL USING (
    EXISTS (SELECT 1 FROM public.interactive_stories WHERE id = story_id AND creator_id = auth.uid())
);

-- Scene Choices
CREATE POLICY "Anyone can view choices of published stories" ON public.scene_choices FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.story_scenes ss 
            JOIN public.interactive_stories ist ON ss.story_id = ist.id 
            WHERE ss.id = scene_id AND ist.status = 'published')
);
CREATE POLICY "Creators can manage choices" ON public.scene_choices FOR ALL USING (
    EXISTS (SELECT 1 FROM public.story_scenes ss 
            JOIN public.interactive_stories ist ON ss.story_id = ist.id 
            WHERE ss.id = scene_id AND ist.creator_id = auth.uid())
);

-- Content Licenses
CREATE POLICY "Anyone can view active licenses" ON public.content_licenses FOR SELECT USING (is_active = true);
CREATE POLICY "Creators can manage own licenses" ON public.content_licenses FOR ALL USING (auth.uid() = creator_id);

-- License Purchases
CREATE POLICY "Buyers can view own purchases" ON public.license_purchases FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Creators can view purchases of their licenses" ON public.license_purchases FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.content_licenses WHERE id = license_id AND creator_id = auth.uid())
);
CREATE POLICY "Users can create purchases" ON public.license_purchases FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Video Projects
CREATE POLICY "Users can view own projects" ON public.video_projects FOR SELECT USING (auth.uid() = user_id OR is_template = true);
CREATE POLICY "Users can manage own projects" ON public.video_projects FOR ALL USING (auth.uid() = user_id);

-- Video Tracks
CREATE POLICY "Users can view tracks of own projects" ON public.video_tracks FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.video_projects WHERE id = project_id AND (user_id = auth.uid() OR is_template = true))
);
CREATE POLICY "Users can manage tracks of own projects" ON public.video_tracks FOR ALL USING (
    EXISTS (SELECT 1 FROM public.video_projects WHERE id = project_id AND user_id = auth.uid())
);

-- Video Clips
CREATE POLICY "Users can view clips of own projects" ON public.video_clips FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.video_tracks vt 
            JOIN public.video_projects vp ON vt.project_id = vp.id 
            WHERE vt.id = track_id AND (vp.user_id = auth.uid() OR vp.is_template = true))
);
CREATE POLICY "Users can manage clips of own projects" ON public.video_clips FOR ALL USING (
    EXISTS (SELECT 1 FROM public.video_tracks vt 
            JOIN public.video_projects vp ON vt.project_id = vp.id 
            WHERE vt.id = track_id AND vp.user_id = auth.uid())
);

-- Voice Clones
CREATE POLICY "Users can view own voice clones" ON public.voice_clones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own voice clones" ON public.voice_clones FOR ALL USING (auth.uid() = user_id);

-- Voice Credits
CREATE POLICY "Users can view own credits" ON public.voice_credits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own credits" ON public.voice_credits FOR ALL USING (auth.uid() = user_id);

-- Voice Generations
CREATE POLICY "Users can view own generations" ON public.voice_generations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create generations" ON public.voice_generations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- FIX EXISTING RLS POLICIES
-- =============================================

-- Add public profile viewing policy (for social features)
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true);

-- Add streamer donation viewing policy
CREATE POLICY "Streamers can view received donations" ON public.donations FOR SELECT USING (auth.uid()::text = streamer_id);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_creator_media_kits_user ON public.creator_media_kits(user_id);
CREATE INDEX IF NOT EXISTS idx_brand_campaigns_status ON public.brand_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_brand_deals_creator ON public.brand_deals(creator_id);
CREATE INDEX IF NOT EXISTS idx_developer_accounts_user ON public.developer_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_users_tenant ON public.enterprise_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_users_user ON public.enterprise_users(user_id);
CREATE INDEX IF NOT EXISTS idx_interactive_stories_status ON public.interactive_stories(status);
CREATE INDEX IF NOT EXISTS idx_content_licenses_active ON public.content_licenses(is_active);
CREATE INDEX IF NOT EXISTS idx_video_projects_user ON public.video_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_clones_user ON public.voice_clones(user_id);