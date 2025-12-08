-- ==========================================
-- AI Video Dubbing Feature
-- Migration: 20251208214400_video_dubbing.sql
-- Auto-translate and dub videos in 29 languages
-- ==========================================

-- Supported languages reference
CREATE TABLE IF NOT EXISTS public.dub_languages (
    code text PRIMARY KEY,
    name text NOT NULL,
    native_name text NOT NULL,
    elevenlabs_code text NOT NULL,
    is_active boolean DEFAULT true
);

-- Insert supported languages
INSERT INTO public.dub_languages (code, name, native_name, elevenlabs_code) VALUES
    ('en', 'English', 'English', 'en'),
    ('es', 'Spanish', 'Español', 'es'),
    ('fr', 'French', 'Français', 'fr'),
    ('de', 'German', 'Deutsch', 'de'),
    ('it', 'Italian', 'Italiano', 'it'),
    ('pt', 'Portuguese', 'Português', 'pt'),
    ('pl', 'Polish', 'Polski', 'pl'),
    ('nl', 'Dutch', 'Nederlands', 'nl'),
    ('ru', 'Russian', 'Русский', 'ru'),
    ('ja', 'Japanese', '日本語', 'ja'),
    ('ko', 'Korean', '한국어', 'ko'),
    ('zh', 'Chinese', '中文', 'zh'),
    ('ar', 'Arabic', 'العربية', 'ar'),
    ('hi', 'Hindi', 'हिन्दी', 'hi'),
    ('tr', 'Turkish', 'Türkçe', 'tr'),
    ('sv', 'Swedish', 'Svenska', 'sv'),
    ('da', 'Danish', 'Dansk', 'da'),
    ('fi', 'Finnish', 'Suomi', 'fi'),
    ('no', 'Norwegian', 'Norsk', 'no'),
    ('cs', 'Czech', 'Čeština', 'cs'),
    ('ro', 'Romanian', 'Română', 'ro'),
    ('el', 'Greek', 'Ελληνικά', 'el'),
    ('hu', 'Hungarian', 'Magyar', 'hu'),
    ('uk', 'Ukrainian', 'Українська', 'uk'),
    ('id', 'Indonesian', 'Bahasa Indonesia', 'id'),
    ('ms', 'Malay', 'Bahasa Melayu', 'ms'),
    ('th', 'Thai', 'ไทย', 'th'),
    ('vi', 'Vietnamese', 'Tiếng Việt', 'vi'),
    ('bg', 'Bulgarian', 'Български', 'bg')
ON CONFLICT (code) DO NOTHING;

-- Video dubbing jobs
CREATE TABLE IF NOT EXISTS public.video_dub_jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Source video
    source_video_url text NOT NULL,
    source_language text NOT NULL REFERENCES public.dub_languages(code),
    source_duration_seconds integer,
    
    -- Target languages
    target_languages text[] NOT NULL,
    
    -- Voice settings
    voice_clone_id uuid REFERENCES public.voice_clones(id),
    use_original_voice boolean DEFAULT true,
    
    -- Processing status
    status text NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'transcribing', 'translating', 'generating_audio', 
        'syncing', 'completed', 'failed'
    )),
    progress_percentage integer DEFAULT 0,
    error_message text,
    
    -- Outputs
    outputs jsonb DEFAULT '[]', -- Array of {language, audio_url, video_url}
    
    -- Credits
    credits_used integer DEFAULT 0,
    estimated_credits integer,
    
    -- Timestamps
    started_at timestamptz,
    completed_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Dubbing history for analytics
CREATE TABLE IF NOT EXISTS public.video_dub_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid NOT NULL REFERENCES public.video_dub_jobs(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    language_code text NOT NULL REFERENCES public.dub_languages(code),
    
    -- Results
    translated_text text,
    audio_url text,
    video_url text,
    duration_seconds integer,
    
    -- Quality metrics
    sync_score numeric(3,2), -- How well audio syncs with video (0-1)
    
    created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_dub_jobs_user ON public.video_dub_jobs(user_id, created_at DESC);
CREATE INDEX idx_dub_jobs_status ON public.video_dub_jobs(status);
CREATE INDEX idx_dub_history_job ON public.video_dub_history(job_id);

-- RLS Policies
ALTER TABLE public.dub_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_dub_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_dub_history ENABLE ROW LEVEL SECURITY;

-- Languages are public read
CREATE POLICY "Anyone can view languages"
ON public.dub_languages FOR SELECT
USING (true);

-- Users can manage their own dub jobs
CREATE POLICY "Users can manage own dub jobs"
ON public.video_dub_jobs FOR ALL
USING (auth.uid() = user_id);

-- Users can view their dub history
CREATE POLICY "Users can view own dub history"
ON public.video_dub_history FOR SELECT
USING (auth.uid() = user_id);

-- Function to estimate credits for dubbing
CREATE OR REPLACE FUNCTION public.estimate_dub_credits(
    p_duration_seconds integer,
    p_language_count integer
)
RETURNS integer
LANGUAGE plpgsql
AS $$
BEGIN
    -- Base: 1 credit per second of audio per language
    -- Plus 10% overhead for processing
    RETURN CEIL((p_duration_seconds * p_language_count) * 1.1);
END;
$$;
