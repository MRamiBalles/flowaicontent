-- ==========================================
-- Missing Feature Tables Migration
-- Migration: 20251208215200_add_missing_feature_tables.sql
-- Adds tables for Mobile App and Token Staking features
-- ==========================================

-- ========================================
-- 1. MOBILE DEVICES (for Mobile App feature)
-- ========================================

CREATE TABLE IF NOT EXISTS public.mobile_devices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_name text NOT NULL,
    device_type text NOT NULL CHECK (device_type IN ('ios', 'android', 'web')),
    device_model text,
    os_version text,
    app_version text,
    fcm_token text,
    apns_token text,
    is_active boolean DEFAULT true,
    sync_notifications boolean DEFAULT true,
    sync_chat boolean DEFAULT true,
    background_refresh boolean DEFAULT true,
    last_active_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.mobile_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own devices"
ON public.mobile_devices FOR ALL
USING (auth.uid() = user_id);

CREATE INDEX idx_mobile_devices_user ON public.mobile_devices(user_id);

-- ========================================
-- 2. MOBILE SYNC EVENTS (for offline sync)
-- ========================================

CREATE TABLE IF NOT EXISTS public.mobile_sync_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id uuid REFERENCES public.mobile_devices(id) ON DELETE SET NULL,
    event_type text NOT NULL,
    payload jsonb NOT NULL,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
    attempts integer DEFAULT 0,
    next_retry_at timestamptz,
    processed_at timestamptz,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.mobile_sync_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sync events"
ON public.mobile_sync_events FOR ALL
USING (auth.uid() = user_id);

CREATE INDEX idx_mobile_sync_events_user ON public.mobile_sync_events(user_id, created_at DESC);
CREATE INDEX idx_mobile_sync_events_status ON public.mobile_sync_events(status);

-- ========================================
-- 3. STAKING POOLS (for Token Staking feature)
-- ========================================

CREATE TABLE IF NOT EXISTS public.staking_pools (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    apy_percentage numeric(5,2) NOT NULL,
    min_stake_amount numeric(20,8) DEFAULT 0,
    max_stake_amount numeric(20,8),
    lock_period_days integer DEFAULT 0,
    total_staked numeric(20,8) DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.staking_pools ENABLE ROW LEVEL SECURITY;

-- Everyone can view active pools
CREATE POLICY "Anyone can view active pools"
ON public.staking_pools FOR SELECT
USING (is_active = true);

-- Insert default pools
INSERT INTO public.staking_pools (name, description, apy_percentage, lock_period_days) VALUES
    ('Flexible', 'No lock period, withdraw anytime', 5.00, 0),
    ('30-Day Lock', 'Higher rewards for 30-day commitment', 12.00, 30),
    ('90-Day Lock', 'Premium rewards for 90-day commitment', 18.00, 90),
    ('180-Day Lock', 'Maximum rewards for 6-month commitment', 25.00, 180)
ON CONFLICT DO NOTHING;

-- ========================================
-- 4. USER STAKES (for tracking user staking)
-- ========================================

CREATE TABLE IF NOT EXISTS public.user_stakes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pool_id uuid NOT NULL REFERENCES public.staking_pools(id) ON DELETE CASCADE,
    amount numeric(20,8) NOT NULL,
    status text DEFAULT 'active' CHECK (status IN ('active', 'unstaking', 'completed', 'cancelled')),
    rewards_earned numeric(20,8) DEFAULT 0,
    last_rewards_claimed_at timestamptz,
    staked_at timestamptz DEFAULT now(),
    unlocks_at timestamptz,
    UNIQUE(user_id, pool_id, staked_at)
);

ALTER TABLE public.user_stakes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own stakes"
ON public.user_stakes FOR ALL
USING (auth.uid() = user_id);

CREATE INDEX idx_user_stakes_user ON public.user_stakes(user_id);
CREATE INDEX idx_user_stakes_pool ON public.user_stakes(pool_id);

-- ========================================
-- 5. GOVERNANCE PROPOSALS (for DAO voting)
-- ========================================

CREATE TABLE IF NOT EXISTS public.governance_proposals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text NOT NULL,
    category text NOT NULL CHECK (category IN ('feature', 'budget', 'governance', 'partnership', 'other')),
    status text DEFAULT 'active' CHECK (status IN ('draft', 'active', 'passed', 'rejected', 'executed')),
    votes_for integer DEFAULT 0,
    votes_against integer DEFAULT 0,
    start_time timestamptz DEFAULT now(),
    end_time timestamptz NOT NULL,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.governance_proposals ENABLE ROW LEVEL SECURITY;

-- Anyone can view proposals
CREATE POLICY "Anyone can view proposals"
ON public.governance_proposals FOR SELECT
USING (true);

-- Stakers can create proposals (simplified - in production check stake amount)
CREATE POLICY "Users can create proposals"
ON public.governance_proposals FOR INSERT
WITH CHECK (auth.uid() = author_id);

-- Authors can update their draft proposals
CREATE POLICY "Authors can update drafts"
ON public.governance_proposals FOR UPDATE
USING (auth.uid() = author_id AND status = 'draft');

CREATE INDEX idx_governance_proposals_status ON public.governance_proposals(status, end_time);

-- ========================================
-- GOVERNANCE VOTES (for tracking votes)
-- ========================================

CREATE TABLE IF NOT EXISTS public.governance_votes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id uuid NOT NULL REFERENCES public.governance_proposals(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vote_type text NOT NULL CHECK (vote_type IN ('for', 'against', 'abstain')),
    voting_power numeric(20,8) NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(proposal_id, user_id)
);

ALTER TABLE public.governance_votes ENABLE ROW LEVEL SECURITY;

-- Users can view all votes (transparency)
CREATE POLICY "Anyone can view votes"
ON public.governance_votes FOR SELECT
USING (true);

-- Users can cast their own vote
CREATE POLICY "Users can vote"
ON public.governance_votes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_governance_votes_proposal ON public.governance_votes(proposal_id);
