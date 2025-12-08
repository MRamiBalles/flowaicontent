-- ==========================================
-- AI Voice Cloning Feature Schema
-- Migration: 20251208170000_voice_cloning_feature.sql
-- ==========================================

-- Storage bucket for voice samples
INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-samples', 'voice-samples', false)
ON CONFLICT (id) DO NOTHING;

-- Storage bucket for generated audio
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-audio', 'generated-audio', false)
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- Voice Clones Table
-- Stores user's cloned voices linked to ElevenLabs
-- ==========================================
CREATE TABLE IF NOT EXISTS public.voice_clones (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- ElevenLabs integration
    elevenlabs_voice_id text NOT NULL,
    
    -- Voice metadata
    name text NOT NULL,
    description text,
    language text NOT NULL DEFAULT 'en',
    
    -- Sample audio
    sample_audio_url text NOT NULL,
    
    -- Settings
    is_default boolean DEFAULT false,
    stability numeric(3, 2) DEFAULT 0.5 CHECK (stability >= 0 AND stability <= 1),
    similarity_boost numeric(3, 2) DEFAULT 0.75 CHECK (similarity_boost >= 0 AND similarity_boost <= 1),
    
    -- Usage tracking
    credits_used integer NOT NULL DEFAULT 0,
    total_generations integer NOT NULL DEFAULT 0,
    
    -- Status
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'processing', 'failed', 'deleted')),
    
    -- Legal consent (GDPR/CCPA compliance)
    consent_given boolean NOT NULL DEFAULT false,
    consent_timestamp timestamptz,
    consent_ip_address inet,
    
    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    
    -- Constraints
    UNIQUE(user_id, name)
);

-- Add helpful comments for data dictionary
COMMENT ON TABLE public.voice_clones IS 'Stores AI voice clones created by users via ElevenLabs integration';
COMMENT ON COLUMN public.voice_clones.elevenlabs_voice_id IS 'External ID from ElevenLabs API for this voice clone';
COMMENT ON COLUMN public.voice_clones.consent_given IS 'REQUIRED: User must confirm they own the voice or have permission';
COMMENT ON COLUMN public.voice_clones.stability IS 'ElevenLabs parameter: Higher = more consistent, lower = more expressive';
COMMENT ON COLUMN public.voice_clones.similarity_boost IS 'ElevenLabs parameter: Higher = closer to original voice';

-- ==========================================
-- Voice Generations Table
-- Tracks all TTS generations using cloned voices
-- ==========================================
CREATE TABLE IF NOT EXISTS public.voice_generations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    voice_clone_id uuid NOT NULL REFERENCES public.voice_clones(id) ON DELETE CASCADE,
    
    -- Input/Output
    input_text text NOT NULL,
    output_audio_url text NOT NULL,
    
    -- Audio metadata
    duration_seconds numeric(10, 2) NOT NULL,
    character_count integer NOT NULL,
    
    -- Billing
    credits_consumed integer NOT NULL,
    
    -- Model info
    model_used text NOT NULL DEFAULT 'eleven_multilingual_v2',
    output_format text NOT NULL DEFAULT 'mp3',
    
    -- Optional: linked to video
    video_id uuid,
    
    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.voice_generations IS 'Audit log of all text-to-speech generations using voice clones';
COMMENT ON COLUMN public.voice_generations.credits_consumed IS 'ElevenLabs credits consumed for this generation';

-- ==========================================
-- Voice Credits Balance Table
-- Tracks user's available voice generation credits
-- ==========================================
CREATE TABLE IF NOT EXISTS public.voice_credits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- Credit balance
    available_credits integer NOT NULL DEFAULT 0,
    lifetime_credits integer NOT NULL DEFAULT 0,
    
    -- Monthly limits based on subscription
    monthly_limit integer NOT NULL DEFAULT 0,
    monthly_used integer NOT NULL DEFAULT 0,
    period_reset_at timestamptz NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month'),
    
    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.voice_credits IS 'Tracks voice generation credits per user';

-- ==========================================
-- Row Level Security Policies
-- ==========================================

ALTER TABLE public.voice_clones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_credits ENABLE ROW LEVEL SECURITY;

-- Voice Clones: Users can only manage their own
CREATE POLICY "Users can view own voice clones"
ON public.voice_clones FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own voice clones"
ON public.voice_clones FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own voice clones"
ON public.voice_clones FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own voice clones"
ON public.voice_clones FOR DELETE
USING (auth.uid() = user_id);

-- Voice Generations: Users can only view their own
CREATE POLICY "Users can view own voice generations"
ON public.voice_generations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own voice generations"
ON public.voice_generations FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Voice Credits: Users can only view their own
CREATE POLICY "Users can view own voice credits"
ON public.voice_credits FOR SELECT
USING (auth.uid() = user_id);

-- ==========================================
-- Storage Policies
-- ==========================================

-- Voice samples: Users can only access their own
CREATE POLICY "Users can upload own voice samples"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'voice-samples' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own voice samples"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'voice-samples' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own voice samples"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'voice-samples' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Generated audio: Users can access their own
CREATE POLICY "Users can upload generated audio"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'generated-audio' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own generated audio"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'generated-audio' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ==========================================
-- Performance Indexes
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_voice_clones_user_id 
ON public.voice_clones(user_id);

CREATE INDEX IF NOT EXISTS idx_voice_clones_status 
ON public.voice_clones(status) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_voice_generations_user_id 
ON public.voice_generations(user_id);

CREATE INDEX IF NOT EXISTS idx_voice_generations_created_at 
ON public.voice_generations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_voice_generations_voice_clone_id 
ON public.voice_generations(voice_clone_id);

CREATE INDEX IF NOT EXISTS idx_voice_credits_user_id 
ON public.voice_credits(user_id);

-- ==========================================
-- Triggers for updated_at
-- ==========================================

CREATE TRIGGER update_voice_clones_updated_at
    BEFORE UPDATE ON public.voice_clones
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_voice_credits_updated_at
    BEFORE UPDATE ON public.voice_credits
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- Function to check voice credit balance
-- ==========================================

CREATE OR REPLACE FUNCTION public.check_voice_credits(
    p_user_id uuid,
    p_credits_needed integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_available integer;
    v_monthly_remaining integer;
BEGIN
    SELECT 
        available_credits,
        monthly_limit - monthly_used
    INTO v_available, v_monthly_remaining
    FROM public.voice_credits
    WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Check both available credits AND monthly limit
    RETURN (v_available >= p_credits_needed) AND (v_monthly_remaining >= p_credits_needed);
END;
$$;

-- ==========================================
-- Function to consume voice credits
-- ==========================================

CREATE OR REPLACE FUNCTION public.consume_voice_credits(
    p_user_id uuid,
    p_credits integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if user has enough credits
    IF NOT public.check_voice_credits(p_user_id, p_credits) THEN
        RETURN false;
    END IF;
    
    -- Deduct credits
    UPDATE public.voice_credits
    SET 
        available_credits = available_credits - p_credits,
        monthly_used = monthly_used + p_credits,
        updated_at = now()
    WHERE user_id = p_user_id;
    
    RETURN true;
END;
$$;

-- ==========================================
-- Function to reset monthly voice credits
-- (Call via cron job at start of each month)
-- ==========================================

CREATE OR REPLACE FUNCTION public.reset_monthly_voice_credits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.voice_credits
    SET 
        monthly_used = 0,
        period_reset_at = date_trunc('month', now()) + interval '1 month',
        updated_at = now()
    WHERE period_reset_at <= now();
END;
$$;
