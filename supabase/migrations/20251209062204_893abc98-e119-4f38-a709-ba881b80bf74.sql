-- =============================================
-- Create missing feature tables for Mobile App and Token Staking
-- =============================================

-- 1. Mobile Devices table
CREATE TABLE IF NOT EXISTS public.mobile_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_name TEXT NOT NULL,
    device_type TEXT NOT NULL DEFAULT 'unknown',
    device_token TEXT,
    platform TEXT CHECK (platform IN ('ios', 'android', 'web')),
    last_active_at TIMESTAMPTZ DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for mobile_devices
ALTER TABLE public.mobile_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own devices"
    ON public.mobile_devices FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own devices"
    ON public.mobile_devices FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own devices"
    ON public.mobile_devices FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own devices"
    ON public.mobile_devices FOR DELETE
    USING (auth.uid() = user_id);

-- 2. Staking Pools table
CREATE TABLE IF NOT EXISTS public.staking_pools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    apy_percentage NUMERIC NOT NULL DEFAULT 0,
    lock_period_days INTEGER NOT NULL DEFAULT 0,
    min_stake_amount NUMERIC NOT NULL DEFAULT 0,
    total_staked NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for staking_pools (public read, admin write)
ALTER TABLE public.staking_pools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view staking pools"
    ON public.staking_pools FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage staking pools"
    ON public.staking_pools FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

-- 3. User Stakes table
CREATE TABLE IF NOT EXISTS public.user_stakes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pool_id UUID NOT NULL REFERENCES public.staking_pools(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL DEFAULT 0,
    rewards_earned NUMERIC DEFAULT 0,
    staked_at TIMESTAMPTZ DEFAULT now(),
    unlocks_at TIMESTAMPTZ,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'withdrawn', 'pending')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for user_stakes
ALTER TABLE public.user_stakes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stakes"
    ON public.user_stakes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create stakes"
    ON public.user_stakes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stakes"
    ON public.user_stakes FOR UPDATE
    USING (auth.uid() = user_id);

-- 4. Governance Proposals table
CREATE TABLE IF NOT EXISTS public.governance_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES auth.users(id),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    end_time TIMESTAMPTZ NOT NULL,
    votes_for NUMERIC DEFAULT 0,
    votes_against NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'passed', 'rejected', 'executed')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for governance_proposals
ALTER TABLE public.governance_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view proposals"
    ON public.governance_proposals FOR SELECT
    USING (true);

CREATE POLICY "Users with stakes can create proposals"
    ON public.governance_proposals FOR INSERT
    WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own proposals"
    ON public.governance_proposals FOR UPDATE
    USING (auth.uid() = creator_id);

-- 5. Governance Votes table
CREATE TABLE IF NOT EXISTS public.governance_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID NOT NULL REFERENCES public.governance_proposals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('for', 'against')),
    voting_power NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(proposal_id, user_id)
);

-- RLS for governance_votes
ALTER TABLE public.governance_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view votes"
    ON public.governance_votes FOR SELECT
    USING (true);

CREATE POLICY "Users can cast votes"
    ON public.governance_votes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 6. Mobile Sync Events table (for offline sync)
CREATE TABLE IF NOT EXISTS public.mobile_sync_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id UUID REFERENCES public.mobile_devices(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_data JSONB DEFAULT '{}',
    synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for mobile_sync_events
ALTER TABLE public.mobile_sync_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sync events"
    ON public.mobile_sync_events FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create sync events"
    ON public.mobile_sync_events FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sync events"
    ON public.mobile_sync_events FOR UPDATE
    USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_mobile_devices_user_id ON public.mobile_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stakes_user_id ON public.user_stakes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stakes_pool_id ON public.user_stakes(pool_id);
CREATE INDEX IF NOT EXISTS idx_governance_votes_proposal_id ON public.governance_votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_mobile_sync_events_user_id ON public.mobile_sync_events(user_id);