-- ==========================================
-- Interactive AI Experiences Schema
-- Migration: 20251208170600_interactive_experiences.sql
-- Choice-based branching video content
-- ==========================================

-- ==========================================
-- Interactive Stories
-- Main container for branching video experiences
-- ==========================================
CREATE TABLE IF NOT EXISTS public.interactive_stories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Story info
    title text NOT NULL,
    description text,
    thumbnail_url text,
    cover_video_url text,
    
    -- Genre & settings
    genre text[] DEFAULT '{}',
    tags text[] DEFAULT '{}',
    language text DEFAULT 'en',
    
    -- Settings
    allow_saves boolean DEFAULT true, -- Save progress
    allow_rewind boolean DEFAULT true, -- Go back to choices
    show_choice_timer boolean DEFAULT false,
    default_choice_timeout_seconds integer DEFAULT 10,
    
    -- Stats
    total_scenes integer DEFAULT 0,
    total_endings integer DEFAULT 0,
    avg_completion_time_minutes integer,
    total_plays integer DEFAULT 0,
    total_completions integer DEFAULT 0,
    
    -- Monetization
    is_premium boolean DEFAULT false,
    price_cents integer DEFAULT 0,
    
    -- Status
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'archived')),
    published_at timestamptz,
    
    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.interactive_stories IS 'Branching narrative experiences';

-- ==========================================
-- Story Scenes
-- Individual video segments with choice points
-- ==========================================
CREATE TABLE IF NOT EXISTS public.story_scenes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    story_id uuid NOT NULL REFERENCES public.interactive_stories(id) ON DELETE CASCADE,
    
    -- Scene info
    name text NOT NULL,
    description text,
    scene_order integer NOT NULL DEFAULT 0,
    
    -- Video content
    video_url text NOT NULL,
    video_duration_seconds integer NOT NULL,
    
    -- Choice timing
    choice_appears_at_seconds integer, -- When to show choices
    choice_timeout_seconds integer, -- Override story default
    
    -- Scene type
    scene_type text NOT NULL DEFAULT 'normal' CHECK (scene_type IN (
        'intro', -- First scene
        'normal', -- Regular scene
        'ending', -- Story ending
        'death', -- Game over
        'checkpoint' -- Save point
    )),
    
    -- For endings
    ending_type text CHECK (ending_type IN ('good', 'bad', 'neutral', 'secret')),
    ending_score integer, -- Achievement score
    
    -- AI features
    ai_narration_enabled boolean DEFAULT false,
    ai_voice_id uuid, -- Reference to cloned voice
    
    -- Metadata
    metadata jsonb DEFAULT '{}',
    
    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.story_scenes IS 'Video segments in interactive stories';

-- ==========================================
-- Scene Choices
-- Decision points with branching paths
-- ==========================================
CREATE TABLE IF NOT EXISTS public.scene_choices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    scene_id uuid NOT NULL REFERENCES public.story_scenes(id) ON DELETE CASCADE,
    
    -- Choice info
    choice_text text NOT NULL,
    choice_order integer NOT NULL DEFAULT 0,
    
    -- Visual styling
    choice_icon text, -- Icon name
    choice_color text DEFAULT '#6366f1',
    
    -- Target scene
    next_scene_id uuid REFERENCES public.story_scenes(id) ON DELETE SET NULL,
    
    -- Conditions (for advanced logic)
    requires_items text[], -- Inventory items needed
    requires_stats jsonb, -- { "courage": 5, "wisdom": 3 }
    hidden_until jsonb, -- Show only if condition met
    
    -- Effects on player state
    grants_items text[],
    modifies_stats jsonb, -- { "health": -10, "gold": 50 }
    
    -- Analytics
    times_selected integer DEFAULT 0,
    
    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.scene_choices IS 'Decision options with branching paths';

-- ==========================================
-- Player Progress
-- Track viewer progress & choices
-- ==========================================
CREATE TABLE IF NOT EXISTS public.player_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    story_id uuid NOT NULL REFERENCES public.interactive_stories(id) ON DELETE CASCADE,
    
    -- Current position
    current_scene_id uuid REFERENCES public.story_scenes(id) ON DELETE SET NULL,
    
    -- Progress tracking
    scenes_visited uuid[] DEFAULT '{}',
    choices_made uuid[] DEFAULT '{}',
    endings_unlocked text[] DEFAULT '{}',
    
    -- Game state
    inventory text[] DEFAULT '{}',
    stats jsonb DEFAULT '{}',
    
    -- Saved positions
    checkpoints jsonb DEFAULT '[]', -- Array of save points
    
    -- Completion
    is_completed boolean DEFAULT false,
    completion_ending text,
    completion_score integer,
    total_watch_time_seconds integer DEFAULT 0,
    
    -- Timestamps
    started_at timestamptz NOT NULL DEFAULT now(),
    last_played_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz,
    
    UNIQUE(user_id, story_id)
);

COMMENT ON TABLE public.player_progress IS 'Player progress and save states';

-- ==========================================
-- Choice Analytics
-- Track choice patterns for insights
-- ==========================================
CREATE TABLE IF NOT EXISTS public.choice_analytics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    story_id uuid NOT NULL REFERENCES public.interactive_stories(id) ON DELETE CASCADE,
    scene_id uuid NOT NULL REFERENCES public.story_scenes(id) ON DELETE CASCADE,
    choice_id uuid NOT NULL REFERENCES public.scene_choices(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Analytics data
    time_to_decide_seconds integer,
    was_timeout boolean DEFAULT false, -- Auto-selected due to timeout
    
    -- Context
    session_id text,
    
    -- Timestamp
    created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.choice_analytics IS 'Analytics on viewer choices';

-- ==========================================
-- Story Templates
-- Pre-made interactive story structures
-- ==========================================
CREATE TABLE IF NOT EXISTS public.story_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Template info
    name text NOT NULL,
    description text,
    thumbnail_url text,
    category text NOT NULL,
    
    -- Template data
    template_structure jsonb NOT NULL, -- Scenes, choices, flow
    
    -- Metadata
    difficulty text CHECK (difficulty IN ('simple', 'moderate', 'complex')),
    estimated_scenes integer,
    estimated_endings integer,
    
    -- Pricing
    is_free boolean DEFAULT true,
    price_cents integer DEFAULT 0,
    
    -- Stats
    times_used integer DEFAULT 0,
    
    -- Status
    is_active boolean DEFAULT true,
    
    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.story_templates IS 'Pre-made story structures';

-- ==========================================
-- Row Level Security
-- ==========================================

ALTER TABLE public.interactive_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scene_choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.choice_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_templates ENABLE ROW LEVEL SECURITY;

-- Stories: Owner manages, anyone can view published
CREATE POLICY "Anyone can view published stories"
ON public.interactive_stories FOR SELECT
USING (status = 'published' OR user_id = auth.uid());

CREATE POLICY "Users can manage their stories"
ON public.interactive_stories FOR ALL
USING (auth.uid() = user_id);

-- Scenes: Follow story access
CREATE POLICY "Scene access follows story access"
ON public.story_scenes FOR SELECT
USING (
    story_id IN (
        SELECT id FROM public.interactive_stories 
        WHERE status = 'published' OR user_id = auth.uid()
    )
);

CREATE POLICY "Creators can manage scenes"
ON public.story_scenes FOR ALL
USING (
    story_id IN (
        SELECT id FROM public.interactive_stories WHERE user_id = auth.uid()
    )
);

-- Choices: Follow scene access
CREATE POLICY "Choice access follows scene access"
ON public.scene_choices FOR SELECT
USING (
    scene_id IN (
        SELECT id FROM public.story_scenes WHERE story_id IN (
            SELECT id FROM public.interactive_stories 
            WHERE status = 'published' OR user_id = auth.uid()
        )
    )
);

CREATE POLICY "Creators can manage choices"
ON public.scene_choices FOR ALL
USING (
    scene_id IN (
        SELECT id FROM public.story_scenes WHERE story_id IN (
            SELECT id FROM public.interactive_stories WHERE user_id = auth.uid()
        )
    )
);

-- Player Progress: User owns their progress
CREATE POLICY "Users manage their progress"
ON public.player_progress FOR ALL
USING (auth.uid() = user_id);

-- Analytics: Creators view their story analytics
CREATE POLICY "Creators view their analytics"
ON public.choice_analytics FOR SELECT
USING (
    story_id IN (
        SELECT id FROM public.interactive_stories WHERE user_id = auth.uid()
    )
);

-- Templates: Public read
CREATE POLICY "Anyone can view templates"
ON public.story_templates FOR SELECT
USING (is_active = true);

-- ==========================================
-- Indexes
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_stories_user 
ON public.interactive_stories(user_id);

CREATE INDEX IF NOT EXISTS idx_stories_status 
ON public.interactive_stories(status);

CREATE INDEX IF NOT EXISTS idx_scenes_story 
ON public.story_scenes(story_id);

CREATE INDEX IF NOT EXISTS idx_scenes_order 
ON public.story_scenes(story_id, scene_order);

CREATE INDEX IF NOT EXISTS idx_choices_scene 
ON public.scene_choices(scene_id);

CREATE INDEX IF NOT EXISTS idx_progress_user 
ON public.player_progress(user_id);

CREATE INDEX IF NOT EXISTS idx_progress_story 
ON public.player_progress(story_id);

CREATE INDEX IF NOT EXISTS idx_analytics_story 
ON public.choice_analytics(story_id);

-- ==========================================
-- Triggers
-- ==========================================

CREATE TRIGGER update_stories_updated_at
    BEFORE UPDATE ON public.interactive_stories
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scenes_updated_at
    BEFORE UPDATE ON public.story_scenes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Update story stats when scenes change
CREATE OR REPLACE FUNCTION update_story_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.interactive_stories
    SET 
        total_scenes = (SELECT COUNT(*) FROM public.story_scenes WHERE story_id = COALESCE(NEW.story_id, OLD.story_id)),
        total_endings = (SELECT COUNT(*) FROM public.story_scenes WHERE story_id = COALESCE(NEW.story_id, OLD.story_id) AND scene_type = 'ending')
    WHERE id = COALESCE(NEW.story_id, OLD.story_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_story_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.story_scenes
    FOR EACH ROW
    EXECUTE FUNCTION update_story_stats();

-- ==========================================
-- Helper Functions
-- ==========================================

-- Get story structure as tree
CREATE OR REPLACE FUNCTION public.get_story_tree(p_story_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'story', s.*,
        'scenes', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'scene', sc,
                    'choices', (
                        SELECT jsonb_agg(ch ORDER BY ch.choice_order)
                        FROM public.scene_choices ch
                        WHERE ch.scene_id = sc.id
                    )
                ) ORDER BY sc.scene_order
            )
            FROM public.story_scenes sc
            WHERE sc.story_id = s.id
        )
    ) INTO v_result
    FROM public.interactive_stories s
    WHERE s.id = p_story_id;
    
    RETURN v_result;
END;
$$;

-- Record choice and update progress
CREATE OR REPLACE FUNCTION public.make_choice(
    p_story_id uuid,
    p_scene_id uuid,
    p_choice_id uuid,
    p_time_to_decide integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_choice public.scene_choices%ROWTYPE;
    v_next_scene public.story_scenes%ROWTYPE;
    v_progress public.player_progress%ROWTYPE;
BEGIN
    -- Get choice
    SELECT * INTO v_choice FROM public.scene_choices WHERE id = p_choice_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Choice not found');
    END IF;
    
    -- Get next scene
    SELECT * INTO v_next_scene FROM public.story_scenes WHERE id = v_choice.next_scene_id;
    
    -- Update or create progress
    INSERT INTO public.player_progress (user_id, story_id, current_scene_id, scenes_visited, choices_made)
    VALUES (auth.uid(), p_story_id, v_choice.next_scene_id, ARRAY[p_scene_id], ARRAY[p_choice_id])
    ON CONFLICT (user_id, story_id) DO UPDATE SET
        current_scene_id = v_choice.next_scene_id,
        scenes_visited = array_append(player_progress.scenes_visited, p_scene_id),
        choices_made = array_append(player_progress.choices_made, p_choice_id),
        last_played_at = now()
    RETURNING * INTO v_progress;
    
    -- Record analytics
    INSERT INTO public.choice_analytics (story_id, scene_id, choice_id, user_id, time_to_decide_seconds)
    VALUES (p_story_id, p_scene_id, p_choice_id, auth.uid(), p_time_to_decide);
    
    -- Update choice counter
    UPDATE public.scene_choices 
    SET times_selected = times_selected + 1 
    WHERE id = p_choice_id;
    
    -- Check if ending
    IF v_next_scene.scene_type = 'ending' THEN
        UPDATE public.player_progress
        SET 
            is_completed = true,
            completion_ending = v_next_scene.ending_type,
            completion_score = v_next_scene.ending_score,
            completed_at = now(),
            endings_unlocked = array_append(endings_unlocked, v_next_scene.ending_type)
        WHERE id = v_progress.id;
        
        UPDATE public.interactive_stories
        SET total_completions = total_completions + 1
        WHERE id = p_story_id;
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'next_scene', row_to_json(v_next_scene),
        'is_ending', v_next_scene.scene_type = 'ending'
    );
END;
$$;
