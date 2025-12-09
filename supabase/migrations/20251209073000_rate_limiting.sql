-- ==========================================
-- Rate Limiting System
-- Migration: 20251209073000_rate_limiting.sql
-- Adds generic rate limiting capabilities via RPC
-- ==========================================

-- 1. Create rate_limits table (transient state)
CREATE TABLE IF NOT EXISTS public.rate_limits (
    key text PRIMARY KEY,
    points integer NOT NULL DEFAULT 0,
    window_start timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz DEFAULT now()
);

-- No RLS needed as this is only accessed via SECURITY DEFINER function
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- 2. Create RPC function for atomic rate limiting (Fixed Window)
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_key text,
    p_limit integer,
    p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_points integer;
    v_window_start timestamptz;
    v_now timestamptz := now();
    v_window_interval interval := (p_window_seconds || ' seconds')::interval;
BEGIN
    -- Delete expired records (cleanup) - 1% chance to run cleanup to avoid performance hit
    IF random() < 0.01 THEN
        DELETE FROM public.rate_limits WHERE window_start < (v_now - v_window_interval);
    END IF;

    -- Upsert and return current state
    INSERT INTO public.rate_limits (key, points, window_start)
    VALUES (p_key, 1, v_now)
    ON CONFLICT (key) DO UPDATE
    SET
        -- Reset if window passed, otherwise increment
        points = CASE 
            WHEN rate_limits.window_start < (EXCLUDED.window_start - v_window_interval) THEN 1
            ELSE rate_limits.points + 1
        END,
        -- Reset window start if window passed
        window_start = CASE 
            WHEN rate_limits.window_start < (EXCLUDED.window_start - v_window_interval) THEN EXCLUDED.window_start
            ELSE rate_limits.window_start
        END
    RETURNING points INTO v_points;

    -- Return true if under limit
    RETURN v_points <= p_limit;
END;
$$;
