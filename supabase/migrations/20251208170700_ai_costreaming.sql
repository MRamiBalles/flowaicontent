-- ==========================================
-- Live AI Co-Streaming Schema
-- Migration: 20251208170700_ai_costreaming.sql
-- Real-time AI companions for live streams
-- ==========================================

-- ==========================================
-- AI Stream Companions
-- Configured AI personalities for streaming
-- ==========================================
CREATE TABLE IF NOT EXISTS public.ai_stream_companions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Companion identity
    name text NOT NULL,
    avatar_url text,
    personality text NOT NULL, -- friendly, sarcastic, educational, hype, calm
    
    -- Voice config
    voice_id uuid, -- Reference to cloned voice
    voice_provider text DEFAULT 'elevenlabs',
    voice_settings jsonb DEFAULT '{}',
    
    -- Behavior settings
    response_style text DEFAULT 'conversational',
    response_length text DEFAULT 'medium' CHECK (response_length IN ('short', 'medium', 'long')),
    humor_level integer DEFAULT 5 CHECK (humor_level >= 0 AND humor_level <= 10),
    formality_level integer DEFAULT 5 CHECK (formality_level >= 0 AND formality_level <= 10),
    
    -- Knowledge base
    custom_knowledge jsonb DEFAULT '[]', -- Array of facts the AI knows
    context_memory_size integer DEFAULT 20, -- Messages to remember
    
    -- Triggers and automation
    auto_greet_viewers boolean DEFAULT true,
    auto_respond_questions boolean DEFAULT true,
    auto_moderate boolean DEFAULT false,
    banned_words text[] DEFAULT '{}',
    
    -- Appearance in stream
    position text DEFAULT 'bottom-right',
    size text DEFAULT 'medium' CHECK (size IN ('small', 'medium', 'large')),
    animation_style text DEFAULT 'bounce',
    
    -- Usage limits
    max_responses_per_minute integer DEFAULT 10,
    cooldown_seconds integer DEFAULT 3,
    
    -- Status
    is_active boolean DEFAULT true,
    
    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.ai_stream_companions IS 'AI personalities for live streaming';

-- ==========================================
-- Co-Stream Sessions
-- Active streaming sessions with AI
-- ==========================================
CREATE TABLE IF NOT EXISTS public.costream_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    companion_id uuid NOT NULL REFERENCES public.ai_stream_companions(id) ON DELETE CASCADE,
    
    -- Session info
    title text,
    platform text, -- twitch, youtube, tiktok, custom
    stream_url text,
    
    -- Realtime connection
    realtime_channel_id text UNIQUE,
    
    -- Stats
    viewer_count integer DEFAULT 0,
    peak_viewers integer DEFAULT 0,
    total_messages integer DEFAULT 0,
    ai_responses integer DEFAULT 0,
    
    -- Duration
    started_at timestamptz NOT NULL DEFAULT now(),
    ended_at timestamptz,
    
    -- Status
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended'))
);

COMMENT ON TABLE public.costream_sessions IS 'Active co-streaming sessions';

-- ==========================================
-- Stream Chat Messages
-- Real-time chat with AI responses
-- ==========================================
CREATE TABLE IF NOT EXISTS public.stream_chat_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    session_id uuid NOT NULL REFERENCES public.costream_sessions(id) ON DELETE CASCADE,
    
    -- Message source
    sender_type text NOT NULL CHECK (sender_type IN ('viewer', 'streamer', 'ai', 'system')),
    sender_id text, -- Platform user ID
    sender_name text NOT NULL,
    
    -- Content
    message text NOT NULL,
    message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'command', 'donation', 'sub', 'raid')),
    
    -- AI response metadata
    is_ai_response boolean DEFAULT false,
    ai_model text,
    ai_latency_ms integer,
    
    -- Moderation
    is_moderated boolean DEFAULT false,
    moderation_reason text,
    
    -- Timestamp
    created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.stream_chat_messages IS 'Chat messages during co-stream';

-- ==========================================
-- AI Response Templates
-- Pre-configured responses for events
-- ==========================================
CREATE TABLE IF NOT EXISTS public.ai_response_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    companion_id uuid NOT NULL REFERENCES public.ai_stream_companions(id) ON DELETE CASCADE,
    
    -- Trigger
    trigger_type text NOT NULL CHECK (trigger_type IN (
        'new_viewer',
        'new_follower',
        'new_subscriber',
        'donation',
        'raid',
        'keyword',
        'command',
        'question',
        'milestone'
    )),
    trigger_value text, -- For keyword/command triggers
    
    -- Response variations
    responses text[] NOT NULL DEFAULT '{}', -- Random selection
    
    -- Conditions
    min_amount integer, -- For donations
    
    -- Settings
    cooldown_seconds integer DEFAULT 30,
    is_enabled boolean DEFAULT true,
    
    -- Stats
    times_triggered integer DEFAULT 0,
    last_triggered_at timestamptz,
    
    -- Timestamp
    created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.ai_response_templates IS 'Event-triggered AI responses';

-- ==========================================
-- Stream Commands
-- Custom chat commands for AI
-- ==========================================
CREATE TABLE IF NOT EXISTS public.stream_commands (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    companion_id uuid NOT NULL REFERENCES public.ai_stream_companions(id) ON DELETE CASCADE,
    
    -- Command
    command_name text NOT NULL, -- Without prefix, e.g., "joke"
    description text,
    
    -- Response
    response_type text NOT NULL DEFAULT 'text' CHECK (response_type IN ('text', 'ai_generate', 'api_call')),
    response_content text, -- Static text or prompt template
    api_endpoint text, -- For api_call type
    
    -- Permissions
    mod_only boolean DEFAULT false,
    subscriber_only boolean DEFAULT false,
    
    -- Limits
    cooldown_seconds integer DEFAULT 10,
    max_uses_per_stream integer,
    
    -- Stats
    times_used integer DEFAULT 0,
    
    -- Status
    is_enabled boolean DEFAULT true,
    
    -- Timestamp
    created_at timestamptz NOT NULL DEFAULT now(),
    
    UNIQUE(companion_id, command_name)
);

COMMENT ON TABLE public.stream_commands IS 'Custom chat commands';

-- ==========================================
-- Stream Analytics
-- Per-session analytics
-- ==========================================
CREATE TABLE IF NOT EXISTS public.stream_analytics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    session_id uuid NOT NULL REFERENCES public.costream_sessions(id) ON DELETE CASCADE UNIQUE,
    
    -- Engagement metrics
    total_chat_messages integer DEFAULT 0,
    unique_chatters integer DEFAULT 0,
    ai_interaction_rate numeric(5, 2), -- % of messages AI responded to
    avg_response_time_ms integer,
    
    -- Content metrics
    questions_answered integer DEFAULT 0,
    commands_executed integer DEFAULT 0,
    moderation_actions integer DEFAULT 0,
    
    -- Sentiment
    positive_messages integer DEFAULT 0,
    negative_messages integer DEFAULT 0,
    neutral_messages integer DEFAULT 0,
    
    -- Viewer metrics
    avg_viewers numeric(10, 2),
    watch_time_minutes integer DEFAULT 0,
    new_followers integer DEFAULT 0,
    
    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.stream_analytics IS 'Analytics per stream session';

-- ==========================================
-- Row Level Security
-- ==========================================

ALTER TABLE public.ai_stream_companions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.costream_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_response_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_analytics ENABLE ROW LEVEL SECURITY;

-- Companions: User owns
CREATE POLICY "Users manage their companions"
ON public.ai_stream_companions FOR ALL
USING (auth.uid() = user_id);

-- Sessions: User owns
CREATE POLICY "Users manage their sessions"
ON public.costream_sessions FOR ALL
USING (auth.uid() = user_id);

-- Messages: Session owner can view, anyone can insert to active sessions
CREATE POLICY "Session owners can view messages"
ON public.stream_chat_messages FOR SELECT
USING (
    session_id IN (
        SELECT id FROM public.costream_sessions WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Messages can be inserted to active sessions"
ON public.stream_chat_messages FOR INSERT
WITH CHECK (
    session_id IN (
        SELECT id FROM public.costream_sessions WHERE status = 'active'
    )
);

-- Templates: Companion owner
CREATE POLICY "Users manage their templates"
ON public.ai_response_templates FOR ALL
USING (
    companion_id IN (
        SELECT id FROM public.ai_stream_companions WHERE user_id = auth.uid()
    )
);

-- Commands: Companion owner
CREATE POLICY "Users manage their commands"
ON public.stream_commands FOR ALL
USING (
    companion_id IN (
        SELECT id FROM public.ai_stream_companions WHERE user_id = auth.uid()
    )
);

-- Analytics: Session owner
CREATE POLICY "Session owners view analytics"
ON public.stream_analytics FOR ALL
USING (
    session_id IN (
        SELECT id FROM public.costream_sessions WHERE user_id = auth.uid()
    )
);

-- ==========================================
-- Indexes
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_companions_user 
ON public.ai_stream_companions(user_id);

CREATE INDEX IF NOT EXISTS idx_sessions_user 
ON public.costream_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_sessions_status 
ON public.costream_sessions(status);

CREATE INDEX IF NOT EXISTS idx_sessions_channel 
ON public.costream_sessions(realtime_channel_id);

CREATE INDEX IF NOT EXISTS idx_messages_session 
ON public.stream_chat_messages(session_id);

CREATE INDEX IF NOT EXISTS idx_messages_created 
ON public.stream_chat_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_templates_companion 
ON public.ai_response_templates(companion_id);

CREATE INDEX IF NOT EXISTS idx_commands_companion 
ON public.stream_commands(companion_id);

-- ==========================================
-- Triggers
-- ==========================================

CREATE TRIGGER update_companions_updated_at
    BEFORE UPDATE ON public.ai_stream_companions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_analytics_updated_at
    BEFORE UPDATE ON public.stream_analytics
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- Helper Functions
-- ==========================================

-- Start a co-stream session
CREATE OR REPLACE FUNCTION public.start_costream_session(
    p_companion_id uuid,
    p_title text DEFAULT NULL,
    p_platform text DEFAULT 'custom'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_session_id uuid;
    v_channel_id text;
BEGIN
    -- Verify companion ownership
    IF NOT EXISTS (
        SELECT 1 FROM public.ai_stream_companions 
        WHERE id = p_companion_id AND user_id = auth.uid()
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Companion not found');
    END IF;
    
    -- Generate unique channel ID
    v_channel_id := 'costream_' || gen_random_uuid()::text;
    
    -- Create session
    INSERT INTO public.costream_sessions (
        user_id,
        companion_id,
        title,
        platform,
        realtime_channel_id
    ) VALUES (
        auth.uid(),
        p_companion_id,
        p_title,
        p_platform,
        v_channel_id
    )
    RETURNING id INTO v_session_id;
    
    -- Create analytics record
    INSERT INTO public.stream_analytics (session_id)
    VALUES (v_session_id);
    
    RETURN jsonb_build_object(
        'success', true,
        'session_id', v_session_id,
        'channel_id', v_channel_id
    );
END;
$$;

-- End a co-stream session
CREATE OR REPLACE FUNCTION public.end_costream_session(p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_session public.costream_sessions%ROWTYPE;
BEGIN
    SELECT * INTO v_session
    FROM public.costream_sessions
    WHERE id = p_session_id AND user_id = auth.uid();
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Session not found');
    END IF;
    
    -- Update session
    UPDATE public.costream_sessions
    SET status = 'ended', ended_at = now()
    WHERE id = p_session_id;
    
    -- Calculate final analytics
    UPDATE public.stream_analytics
    SET 
        total_chat_messages = (SELECT COUNT(*) FROM public.stream_chat_messages WHERE session_id = p_session_id),
        unique_chatters = (SELECT COUNT(DISTINCT sender_id) FROM public.stream_chat_messages WHERE session_id = p_session_id AND sender_type = 'viewer')
    WHERE session_id = p_session_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'duration_minutes', EXTRACT(EPOCH FROM (now() - v_session.started_at)) / 60
    );
END;
$$;
