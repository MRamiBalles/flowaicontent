-- ==========================================
-- AI Video Editor Pro Schema
-- Migration: 20251208170200_video_editor_pro.sql
-- Remotion-based video editing with cloud rendering
-- ==========================================

-- ==========================================
-- Video Projects Table
-- Main table for video editing projects
-- ==========================================
CREATE TABLE IF NOT EXISTS public.video_projects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Project metadata
    name text NOT NULL,
    description text,
    thumbnail_url text,
    
    -- Video settings
    width integer NOT NULL DEFAULT 1920,
    height integer NOT NULL DEFAULT 1080,
    fps integer NOT NULL DEFAULT 30,
    duration_frames integer NOT NULL DEFAULT 300, -- 10 seconds at 30fps
    
    -- Composition data (Remotion format)
    composition_id text NOT NULL DEFAULT 'main',
    composition_data jsonb NOT NULL DEFAULT '{}',
    
    -- Assets reference
    assets jsonb NOT NULL DEFAULT '[]',
    
    -- Rendering
    render_status text NOT NULL DEFAULT 'draft' CHECK (render_status IN ('draft', 'queued', 'rendering', 'completed', 'failed')),
    render_progress integer DEFAULT 0,
    rendered_video_url text,
    render_started_at timestamptz,
    render_completed_at timestamptz,
    render_error text,
    
    -- AWS Lambda rendering
    lambda_render_id text,
    s3_output_bucket text,
    
    -- Template
    template_id uuid,
    is_template boolean NOT NULL DEFAULT false,
    template_category text,
    
    -- Analytics
    view_count integer NOT NULL DEFAULT 0,
    download_count integer NOT NULL DEFAULT 0,
    
    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.video_projects IS 'Video editing projects with Remotion composition data';
COMMENT ON COLUMN public.video_projects.composition_data IS 'JSON containing Remotion composition structure (tracks, clips, effects)';
COMMENT ON COLUMN public.video_projects.assets IS 'Array of asset references used in this project';

-- ==========================================
-- Video Timeline Tracks
-- Individual tracks in the video timeline
-- ==========================================
CREATE TABLE IF NOT EXISTS public.video_tracks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES public.video_projects(id) ON DELETE CASCADE,
    
    -- Track properties
    track_type text NOT NULL CHECK (track_type IN ('video', 'audio', 'text', 'image', 'shape', 'effect')),
    name text NOT NULL,
    order_index integer NOT NULL DEFAULT 0,
    
    -- Track settings
    is_locked boolean NOT NULL DEFAULT false,
    is_visible boolean NOT NULL DEFAULT true,
    is_muted boolean NOT NULL DEFAULT false,
    volume numeric(3, 2) DEFAULT 1.0,
    opacity numeric(3, 2) DEFAULT 1.0,
    
    -- Blend mode for compositing
    blend_mode text DEFAULT 'normal',
    
    created_at timestamptz NOT NULL DEFAULT now(),
    
    UNIQUE(project_id, order_index)
);

COMMENT ON TABLE public.video_tracks IS 'Timeline tracks for organizing clips in layers';

-- ==========================================
-- Video Clips
-- Individual clips placed on tracks
-- ==========================================
CREATE TABLE IF NOT EXISTS public.video_clips (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id uuid NOT NULL REFERENCES public.video_tracks(id) ON DELETE CASCADE,
    
    -- Clip type
    clip_type text NOT NULL CHECK (clip_type IN ('video', 'audio', 'text', 'image', 'shape', 'ai_generated', 'voice_over')),
    
    -- Timeline position (in frames)
    start_frame integer NOT NULL,
    end_frame integer NOT NULL CHECK (end_frame > start_frame),
    
    -- Source media
    source_url text,
    source_start_frame integer DEFAULT 0, -- For trimming
    source_end_frame integer,
    
    -- Transform
    position_x numeric DEFAULT 0,
    position_y numeric DEFAULT 0,
    scale_x numeric DEFAULT 1,
    scale_y numeric DEFAULT 1,
    rotation numeric DEFAULT 0,
    anchor_x numeric DEFAULT 0.5,
    anchor_y numeric DEFAULT 0.5,
    
    -- Effects and styling
    effects jsonb DEFAULT '[]',
    styles jsonb DEFAULT '{}',
    
    -- Text-specific (for text clips)
    text_content text,
    font_family text DEFAULT 'Inter',
    font_size integer DEFAULT 48,
    font_weight integer DEFAULT 400,
    text_color text DEFAULT '#ffffff',
    text_align text DEFAULT 'center',
    
    -- Audio-specific
    volume numeric(3, 2) DEFAULT 1.0,
    fade_in_frames integer DEFAULT 0,
    fade_out_frames integer DEFAULT 0,
    
    -- AI-specific
    ai_prompt text,
    ai_style_pack_id uuid,
    
    -- Voice over specific
    voice_clone_id uuid,
    
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.video_clips IS 'Individual clips placed on timeline tracks';

-- ==========================================
-- Video Keyframes
-- Animation keyframes for clip properties
-- ==========================================
CREATE TABLE IF NOT EXISTS public.video_keyframes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    clip_id uuid NOT NULL REFERENCES public.video_clips(id) ON DELETE CASCADE,
    
    -- Keyframe position
    frame integer NOT NULL,
    
    -- Animated property
    property text NOT NULL, -- e.g., 'opacity', 'position_x', 'scale'
    value numeric NOT NULL,
    
    -- Easing function
    easing text DEFAULT 'linear', -- linear, ease-in, ease-out, ease-in-out, cubic-bezier
    easing_params jsonb,
    
    created_at timestamptz NOT NULL DEFAULT now(),
    
    UNIQUE(clip_id, frame, property)
);

COMMENT ON TABLE public.video_keyframes IS 'Animation keyframes for smooth property transitions';

-- ==========================================
-- Video Templates
-- Pre-built templates users can start from
-- ==========================================
CREATE TABLE IF NOT EXISTS public.video_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Template info
    name text NOT NULL,
    description text,
    thumbnail_url text,
    preview_video_url text,
    
    -- Category for discovery
    category text NOT NULL CHECK (category IN ('social', 'youtube', 'tiktok', 'ads', 'music', 'corporate', 'education', 'custom')),
    tags text[] DEFAULT '{}',
    
    -- Template data (serialized project)
    template_data jsonb NOT NULL,
    
    -- Dimensions
    width integer NOT NULL,
    height integer NOT NULL,
    duration_frames integer NOT NULL,
    fps integer NOT NULL,
    
    -- Creator
    creator_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    is_official boolean NOT NULL DEFAULT false,
    
    -- Pricing
    is_premium boolean NOT NULL DEFAULT false,
    price_cents integer DEFAULT 0,
    
    -- Analytics
    use_count integer NOT NULL DEFAULT 0,
    
    -- Status
    is_active boolean NOT NULL DEFAULT true,
    
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.video_templates IS 'Pre-built video templates for quick starts';

-- ==========================================
-- Render Queue
-- Background rendering job queue
-- ==========================================
CREATE TABLE IF NOT EXISTS public.render_queue (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    project_id uuid NOT NULL REFERENCES public.video_projects(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Render settings
    output_format text NOT NULL DEFAULT 'mp4',
    output_quality text NOT NULL DEFAULT 'high' CHECK (output_quality IN ('draft', 'medium', 'high', 'ultra')),
    output_codec text DEFAULT 'h264',
    
    -- Priority (higher = sooner)
    priority integer NOT NULL DEFAULT 0,
    
    -- Status
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    progress integer DEFAULT 0,
    
    -- AWS Lambda
    lambda_function_name text,
    lambda_request_id text,
    
    -- Timing
    estimated_duration_ms integer,
    actual_duration_ms integer,
    started_at timestamptz,
    completed_at timestamptz,
    
    -- Output
    output_url text,
    output_size_bytes bigint,
    
    -- Error handling
    error_message text,
    retry_count integer DEFAULT 0,
    max_retries integer DEFAULT 3,
    
    created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.render_queue IS 'Background video rendering job queue';

-- ==========================================
-- Row Level Security
-- ==========================================

ALTER TABLE public.video_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_keyframes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.render_queue ENABLE ROW LEVEL SECURITY;

-- Video Projects: Owner access + template visibility
CREATE POLICY "Users can manage own projects"
ON public.video_projects FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public templates"
ON public.video_projects FOR SELECT
USING (is_template = true);

-- Video Tracks: Through project ownership
CREATE POLICY "Users can manage tracks of own projects"
ON public.video_tracks FOR ALL
USING (
    project_id IN (
        SELECT id FROM public.video_projects WHERE user_id = auth.uid()
    )
);

-- Video Clips: Through track ownership
CREATE POLICY "Users can manage clips on own tracks"
ON public.video_clips FOR ALL
USING (
    track_id IN (
        SELECT t.id FROM public.video_tracks t
        JOIN public.video_projects p ON t.project_id = p.id
        WHERE p.user_id = auth.uid()
    )
);

-- Video Keyframes: Through clip ownership
CREATE POLICY "Users can manage keyframes on own clips"
ON public.video_keyframes FOR ALL
USING (
    clip_id IN (
        SELECT c.id FROM public.video_clips c
        JOIN public.video_tracks t ON c.track_id = t.id
        JOIN public.video_projects p ON t.project_id = p.id
        WHERE p.user_id = auth.uid()
    )
);

-- Video Templates: Public read, creator/admin write
CREATE POLICY "Anyone can view active templates"
ON public.video_templates FOR SELECT
USING (is_active = true);

CREATE POLICY "Creators can manage own templates"
ON public.video_templates FOR ALL
USING (auth.uid() = creator_id);

-- Render Queue: Owner only
CREATE POLICY "Users can manage own render jobs"
ON public.render_queue FOR ALL
USING (auth.uid() = user_id);

-- ==========================================
-- Indexes
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_video_projects_user 
ON public.video_projects(user_id);

CREATE INDEX IF NOT EXISTS idx_video_projects_status 
ON public.video_projects(render_status);

CREATE INDEX IF NOT EXISTS idx_video_projects_template 
ON public.video_projects(is_template) WHERE is_template = true;

CREATE INDEX IF NOT EXISTS idx_video_tracks_project 
ON public.video_tracks(project_id);

CREATE INDEX IF NOT EXISTS idx_video_clips_track 
ON public.video_clips(track_id);

CREATE INDEX IF NOT EXISTS idx_video_clips_frames 
ON public.video_clips(start_frame, end_frame);

CREATE INDEX IF NOT EXISTS idx_video_keyframes_clip 
ON public.video_keyframes(clip_id);

CREATE INDEX IF NOT EXISTS idx_video_templates_category 
ON public.video_templates(category);

CREATE INDEX IF NOT EXISTS idx_video_templates_active 
ON public.video_templates(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_render_queue_status 
ON public.render_queue(status);

CREATE INDEX IF NOT EXISTS idx_render_queue_priority 
ON public.render_queue(priority DESC, created_at ASC);

-- ==========================================
-- Triggers
-- ==========================================

CREATE TRIGGER update_video_projects_updated_at
    BEFORE UPDATE ON public.video_projects
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_video_clips_updated_at
    BEFORE UPDATE ON public.video_clips
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_video_templates_updated_at
    BEFORE UPDATE ON public.video_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- Helper Functions
-- ==========================================

-- Get project with all tracks and clips
CREATE OR REPLACE FUNCTION public.get_full_project(p_project_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'project', row_to_json(p),
        'tracks', (
            SELECT COALESCE(jsonb_agg(
                jsonb_build_object(
                    'track', row_to_json(t),
                    'clips', (
                        SELECT COALESCE(jsonb_agg(
                            jsonb_build_object(
                                'clip', row_to_json(c),
                                'keyframes', (
                                    SELECT COALESCE(jsonb_agg(row_to_json(k) ORDER BY k.frame), '[]'::jsonb)
                                    FROM public.video_keyframes k
                                    WHERE k.clip_id = c.id
                                )
                            ) ORDER BY c.start_frame
                        ), '[]'::jsonb)
                        FROM public.video_clips c
                        WHERE c.track_id = t.id
                    )
                ) ORDER BY t.order_index
            ), '[]'::jsonb)
            FROM public.video_tracks t
            WHERE t.project_id = p.id
        )
    ) INTO v_result
    FROM public.video_projects p
    WHERE p.id = p_project_id;
    
    RETURN v_result;
END;
$$;

-- Queue a render job
CREATE OR REPLACE FUNCTION public.queue_render(
    p_project_id uuid,
    p_quality text DEFAULT 'high',
    p_format text DEFAULT 'mp4'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_render_id uuid;
BEGIN
    -- Get project owner
    SELECT user_id INTO v_user_id
    FROM public.video_projects
    WHERE id = p_project_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Project not found';
    END IF;
    
    -- Check if user owns the project
    IF v_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    -- Update project status
    UPDATE public.video_projects
    SET render_status = 'queued', updated_at = now()
    WHERE id = p_project_id;
    
    -- Create render job
    INSERT INTO public.render_queue (
        project_id,
        user_id,
        output_format,
        output_quality,
        status,
        priority
    ) VALUES (
        p_project_id,
        v_user_id,
        p_format,
        p_quality,
        'pending',
        0
    )
    RETURNING id INTO v_render_id;
    
    RETURN v_render_id;
END;
$$;
