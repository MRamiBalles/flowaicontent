-- ==========================================
-- $FLOW Token Staking & Governance
-- Migration: 20251208170800_token_staking.sql
-- Staking pools, user stakes, and DAO governance
-- ==========================================

-- ==========================================
-- Staking Pools
-- Different pools with varying APY and lock periods
-- ==========================================
CREATE TABLE IF NOT EXISTS public.staking_pools (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    name text NOT NULL,
    description text,
    
    -- Staking config
    apy_percentage numeric(5, 2) NOT NULL, -- e.g., 12.50
    lock_period_days integer DEFAULT 0,
    min_stake_amount numeric(20, 8) DEFAULT 0,
    max_stake_amount numeric(20, 8),
    total_staked numeric(20, 8) DEFAULT 0,
    
    -- Status
    is_active boolean DEFAULT true,
    
    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.staking_pools IS 'Staking pools for $FLOW';

-- ==========================================
-- User Stakes
-- Active stakes by users
-- ==========================================
CREATE TABLE IF NOT EXISTS public.user_stakes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pool_id uuid NOT NULL REFERENCES public.staking_pools(id) ON DELETE CASCADE,
    
    -- Amount
    amount numeric(20, 8) NOT NULL,
    rewards_earned numeric(20, 8) DEFAULT 0,
    
    -- Timing
    staked_at timestamptz NOT NULL DEFAULT now(),
    unlocks_at timestamptz,
    last_rewards_claimed_at timestamptz DEFAULT now(),
    
    -- Status
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unstaked'))
);

COMMENT ON TABLE public.user_stakes IS 'User staking records';

-- ==========================================
-- Governance Proposals
-- DAO proposals for voting
-- ==========================================
CREATE TABLE IF NOT EXISTS public.governance_proposals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    title text NOT NULL,
    description text NOT NULL,
    category text NOT NULL CHECK (category IN ('platform', 'token', 'content', 'technical')),
    
    -- Voting
    start_time timestamptz NOT NULL DEFAULT now(),
    end_time timestamptz NOT NULL,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'passed', 'rejected', 'executed')),
    
    -- Results
    votes_for numeric(20, 8) DEFAULT 0,
    votes_against numeric(20, 8) DEFAULT 0,
    
    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.governance_proposals IS 'DAO governance proposals';

-- ==========================================
-- Governance Votes
-- User votes on proposals
-- ==========================================
CREATE TABLE IF NOT EXISTS public.governance_votes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    proposal_id uuid NOT NULL REFERENCES public.governance_proposals(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Vote
    vote_type text NOT NULL CHECK (vote_type IN ('for', 'against')),
    voting_power numeric(20, 8) NOT NULL, -- Snapshot of staked amount at time of vote
    
    -- Timestamp
    created_at timestamptz NOT NULL DEFAULT now(),
    
    UNIQUE(proposal_id, user_id)
);

COMMENT ON TABLE public.governance_votes IS 'User votes on proposals';

-- ==========================================
-- Functions & Triggers
-- ==========================================

-- Function to calculate current rewards
CREATE OR REPLACE FUNCTION public.calculate_rewards(p_stake_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_stake public.user_stakes%ROWTYPE;
    v_pool public.staking_pools%ROWTYPE;
    v_days_staked numeric;
    v_daily_rate numeric;
    v_rewards numeric;
BEGIN
    SELECT * INTO v_stake FROM public.user_stakes WHERE id = p_stake_id;
    SELECT * INTO v_pool FROM public.staking_pools WHERE id = v_stake.pool_id;
    
    -- Calculate days since last claim
    v_days_staked := EXTRACT(EPOCH FROM (now() - v_stake.last_rewards_claimed_at)) / 86400;
    
    -- Daily rate = APY / 365
    v_daily_rate := (v_pool.apy_percentage / 100) / 365;
    
    -- Rewards = Amount * Daily Rate * Days
    v_rewards := v_stake.amount * v_daily_rate * v_days_staked;
    
    RETURN TRUNC(v_rewards, 8);
END;
$$;

-- RLS Policies
ALTER TABLE public.staking_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_votes ENABLE ROW LEVEL SECURITY;

-- Pools: Everyone reads, Admins manage
CREATE POLICY "Public pools view" ON public.staking_pools FOR SELECT USING (true);

-- User Stakes: Users own
CREATE POLICY "Users view own stakes" ON public.user_stakes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create stakes" ON public.user_stakes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Proposals: Public read, Members create
CREATE POLICY "Public proposals view" ON public.governance_proposals FOR SELECT USING (true);
CREATE POLICY "Users create proposals" ON public.governance_proposals FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Votes: Public read, Members vote
CREATE POLICY "Public votes view" ON public.governance_votes FOR SELECT USING (true);
CREATE POLICY "Users cast votes" ON public.governance_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
