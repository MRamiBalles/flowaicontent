-- ==========================================
-- Seed Data: Governance Proposals & Votes
-- Migration: 20251209080000_seed_governance.sql
-- Populates the Token Staking dashboard with demo data
-- ==========================================

-- Only insert if we have at least one user to act as author
DO $$
DECLARE
    v_author_id uuid;
    v_proposal_id_1 uuid;
    v_proposal_id_2 uuid;
    v_proposal_id_3 uuid;
BEGIN
    SELECT id INTO v_author_id FROM auth.users LIMIT 1;

    IF v_author_id IS NOT NULL THEN
        
        -- 1. Insert Proposals
        INSERT INTO public.governance_proposals 
            (title, description, category, status, votes_for, votes_against, end_time, author_id)
        VALUES 
            (
                'Increase Staking APY for 90-Day Pool', 
                'We propose increasing the Annual Percentage Yield (APY) for the 90-day lock period from 18% to 20% to incentivize longer-term holding of $FLOW tokens. This change is sustainable based on current platform revenue.', 
                'governance', 'active', 15420, 3210, 
                now() + interval '3 days', 
                v_author_id
            )
        RETURNING id INTO v_proposal_id_1;

        INSERT INTO public.governance_proposals 
            (title, description, category, status, votes_for, votes_against, end_time, author_id)
        VALUES 
            (
                'Add Solana Chain Support for NFTs', 
                'Expand our Creator Economy features to support Solana (SOL) alongside Polygon. This will lower minting costs and increase transaction speed for high-volume creators.', 
                'feature', 'active', 8500, 1200, 
                now() + interval '5 days', 
                v_author_id
            )
        RETURNING id INTO v_proposal_id_2;

        INSERT INTO public.governance_proposals 
            (title, description, category, status, votes_for, votes_against, end_time, author_id)
        VALUES 
            (
                'Q1 2026 Marketing Budget Allocation', 
                'Proposal to allocate 15% of the treasury fund (approx. $50k) towards influencer marketing campaigns on TikTok and YouTube to drive user acquisition.', 
                'budget', 'passed', 25000, 500, 
                now() - interval '2 days', 
                v_author_id
            )
        RETURNING id INTO v_proposal_id_3;

        -- 2. Insert Votes (Mocking user votes requires knowing user IDs, so we just rely on the counters in proposals for now, 
        -- or we can insert one vote for the current author)
        
        -- Vote for Proposal 1
        INSERT INTO public.governance_votes (proposal_id, user_id, vote_type, voting_power)
        VALUES (v_proposal_id_1, v_author_id, 'for', 1000)
        ON CONFLICT DO NOTHING;

    END IF;
END $$;
