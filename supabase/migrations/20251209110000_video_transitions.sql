-- ==========================================
-- Video Editor Pro: Transitions
-- Migration: 20251209110000_video_transitions.sql
-- ==========================================

CREATE TABLE IF NOT EXISTS public.video_transitions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES public.video_projects(id) ON DELETE CASCADE,
    
    -- The transition happens between these two clips
    -- If from_clip_id is null, it's a fade in at start
    -- If to_clip_id is null, it's a fade out at end
    from_clip_id uuid REFERENCES public.video_clips(id) ON DELETE SET NULL,
    to_clip_id uuid REFERENCES public.video_clips(id) ON DELETE SET NULL,
    
    -- Transition properties
    transition_type text NOT NULL CHECK (transition_type IN ('fade', 'dissolve', 'wipe', 'slide', 'zoom')),
    duration_frames integer NOT NULL DEFAULT 15, -- 0.5s at 30fps
    
    created_at timestamptz DEFAULT now(),
    
    -- Validation: prevent self-transition
    CONSTRAINT different_clips CHECK (from_clip_id != to_clip_id)
);

-- RLS Policies
ALTER TABLE public.video_transitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage transitions for their projects"
    ON public.video_transitions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.video_projects
            WHERE id = video_transitions.project_id
            AND user_id = auth.uid()
        )
    );

-- Index for faster loading
CREATE INDEX idx_transitions_project ON public.video_transitions(project_id);
