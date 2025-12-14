-- Create video_transitions table for VideoEditorPro
CREATE TABLE public.video_transitions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.video_projects(id) ON DELETE CASCADE,
    from_clip_id UUID REFERENCES public.video_clips(id) ON DELETE SET NULL,
    to_clip_id UUID REFERENCES public.video_clips(id) ON DELETE SET NULL,
    transition_type TEXT NOT NULL DEFAULT 'fade',
    duration_frames INTEGER NOT NULL DEFAULT 15,
    easing TEXT DEFAULT 'ease-in-out',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create video_keyframes table for animations
CREATE TABLE public.video_keyframes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    clip_id UUID NOT NULL REFERENCES public.video_clips(id) ON DELETE CASCADE,
    property TEXT NOT NULL,
    frame INTEGER NOT NULL,
    value NUMERIC NOT NULL,
    easing TEXT DEFAULT 'linear',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(clip_id, property, frame)
);

-- Enable RLS
ALTER TABLE public.video_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_keyframes ENABLE ROW LEVEL SECURITY;

-- RLS policies for video_transitions
CREATE POLICY "Users can view transitions of own projects"
    ON public.video_transitions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.video_projects
        WHERE video_projects.id = video_transitions.project_id
        AND video_projects.user_id = auth.uid()
    ));

CREATE POLICY "Users can manage transitions of own projects"
    ON public.video_transitions FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.video_projects
        WHERE video_projects.id = video_transitions.project_id
        AND video_projects.user_id = auth.uid()
    ));

-- RLS policies for video_keyframes
CREATE POLICY "Users can view keyframes of own clips"
    ON public.video_keyframes FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.video_clips
        JOIN public.video_tracks ON video_clips.track_id = video_tracks.id
        JOIN public.video_projects ON video_tracks.project_id = video_projects.id
        WHERE video_clips.id = video_keyframes.clip_id
        AND video_projects.user_id = auth.uid()
    ));

CREATE POLICY "Users can manage keyframes of own clips"
    ON public.video_keyframes FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.video_clips
        JOIN public.video_tracks ON video_clips.track_id = video_tracks.id
        JOIN public.video_projects ON video_tracks.project_id = video_projects.id
        WHERE video_clips.id = video_keyframes.clip_id
        AND video_projects.user_id = auth.uid()
    ));