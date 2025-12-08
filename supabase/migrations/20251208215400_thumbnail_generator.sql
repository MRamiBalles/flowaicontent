-- ==========================================
-- AI Thumbnail Generator
-- Migration: 20251208215400_thumbnail_generator.sql
-- AI-powered thumbnail creation for content
-- ==========================================

-- Thumbnail Templates (pre-made styles)
CREATE TABLE IF NOT EXISTS public.thumbnail_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    category text NOT NULL CHECK (category IN ('gaming', 'vlog', 'tutorial', 'podcast', 'music', 'news', 'lifestyle', 'tech')),
    style_prompt text NOT NULL, -- Base prompt for this style
    example_url text,
    is_premium boolean DEFAULT false,
    is_active boolean DEFAULT true,
    usage_count integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- Thumbnail Generations (user's generated thumbnails)
CREATE TABLE IF NOT EXISTS public.thumbnail_generations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Input
    title text NOT NULL,
    description text,
    template_id uuid REFERENCES public.thumbnail_templates(id),
    custom_prompt text,
    style_preset text DEFAULT 'vibrant' CHECK (style_preset IN ('vibrant', 'minimal', 'dramatic', 'retro', 'neon', 'professional')),
    
    -- Output
    image_url text,
    variations jsonb DEFAULT '[]', -- Array of alternative versions
    
    -- Status
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
    error_message text,
    
    -- Metrics
    credits_used integer DEFAULT 1,
    
    -- Timestamps
    created_at timestamptz DEFAULT now(),
    completed_at timestamptz
);

-- RLS
ALTER TABLE public.thumbnail_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thumbnail_generations ENABLE ROW LEVEL SECURITY;

-- Templates are public read
CREATE POLICY "Anyone can view active templates"
ON public.thumbnail_templates FOR SELECT
USING (is_active = true);

-- Users manage own generations
CREATE POLICY "Users can manage own thumbnails"
ON public.thumbnail_generations FOR ALL
USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_thumbnail_generations_user ON public.thumbnail_generations(user_id, created_at DESC);
CREATE INDEX idx_thumbnail_templates_category ON public.thumbnail_templates(category);

-- Seed default templates
INSERT INTO public.thumbnail_templates (name, category, style_prompt, description) VALUES
    ('Gaming Epic', 'gaming', 'Epic gaming thumbnail with dramatic lighting, bold text overlay space, action-packed composition', 'Perfect for gaming highlights and streams'),
    ('Vlog Clean', 'vlog', 'Clean modern vlog thumbnail, bright colors, friendly expression space, minimalist design', 'Great for daily vlogs and lifestyle content'),
    ('Tutorial Pro', 'tutorial', 'Professional tutorial thumbnail, step indicators, clear visual hierarchy, educational feel', 'Ideal for how-to and educational content'),
    ('Podcast Wave', 'podcast', 'Podcast thumbnail with audio waveform elements, speaker silhouette space, gradient background', 'Best for podcast episodes and audio content'),
    ('Tech Review', 'tech', 'Sleek tech review thumbnail, product focus area, specs highlight zones, modern gradient', 'Perfect for tech reviews and unboxings'),
    ('Music Vibe', 'music', 'Music video thumbnail, artistic lighting, emotional atmosphere, cinematic feel', 'Great for music videos and covers'),
    ('News Alert', 'news', 'Breaking news style thumbnail, urgency elements, headline text space, professional layout', 'Ideal for news and current events'),
    ('Lifestyle Glow', 'lifestyle', 'Aesthetic lifestyle thumbnail, soft lighting, aspirational mood, pastel accents', 'Best for lifestyle and wellness content')
ON CONFLICT DO NOTHING;
