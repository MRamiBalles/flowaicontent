// Token Governance Edge Function
// Manages $FLOW staking, rewards, and DAO voting

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GovernanceRequest {
    action:
    | 'stake'
    | 'unstake'
    | 'claim_rewards'
    | 'create_proposal'
    | 'vote'
    | 'get_stats';
    data?: Record<string, unknown>;
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Authorization required' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        // Verify user
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Invalid token' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const body: GovernanceRequest = await req.json();
        const { action, data } = body;

        switch (action) {
            case 'stake': {
                if (!data?.pool_id || !data?.amount) {
                    throw new Error('pool_id and amount required');
                }

                const amount = Number(data.amount);
                if (amount <= 0) throw new Error('Invalid stake amount');

                // Check if pool exists and constraints
                const { data: pool } = await supabase
                    .from('staking_pools')
                    .select('*')
                    .eq('id', data.pool_id)
                    .single();

                if (!pool) throw new Error('Pool not found');
                if (pool.min_stake_amount && amount < pool.min_stake_amount) {
                    throw new Error(`Minimum stake is ${pool.min_stake_amount}`);
                }

                // Create stake
                const { data: stake, error } = await supabase
                    .from('user_stakes')
                    .insert({
                        user_id: user.id,
                        pool_id: data.pool_id as string,
                        amount: amount,
                        unlocks_at: pool.lock_period_days > 0
                            ? new Date(Date.now() + pool.lock_period_days * 86400000).toISOString()
                            : null,
                    })
                    .select()
                    .single();

                if (error) throw error;

                // Update pool total
                await supabase.rpc('increment_pool_stake', {
                    p_pool_id: data.pool_id,
                    p_amount: amount
                });

                return new Response(JSON.stringify({ success: true, stake }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            case 'claim_rewards': {
                if (!data?.stake_id) throw new Error('stake_id required');

                // Calculate rewards
                const { data: rewards, error: calcError } = await supabase
                    .rpc('calculate_rewards', { p_stake_id: data.stake_id });

                if (calcError) throw calcError;

                if (rewards > 0) {
                    // Update stake: add rewards to claimed, reset timer
                    const { error: updateError } = await supabase
                        .from('user_stakes')
                        .update({
                            rewards_earned: supabase.rpc('increment', { x: rewards }),
                            last_rewards_claimed_at: new Date().toISOString()
                        })
                        .eq('id', data.stake_id)
                        .eq('user_id', user.id);

                    if (updateError) throw updateError;
                }

                return new Response(JSON.stringify({
                    success: true,
                    claimed: rewards
                }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            case 'vote': {
                if (!data?.proposal_id || !data?.vote_type) {
                    throw new Error('proposal_id and vote_type required');
                }

                // Calculate voting power (total active staked amount)
                const { data: stakes } = await supabase
                    .from('user_stakes')
                    .select('amount')
                    .eq('user_id', user.id)
                    .eq('status', 'active');

                const votingPower = stakes?.reduce((sum, s) => sum + Number(s.amount), 0) || 0;

                if (votingPower <= 0) {
                    throw new Error('No voting power (stake tokens to vote)');
                }

                // Cast vote
                const { data: vote, error } = await supabase
                    .from('governance_votes')
                    .insert({
                        proposal_id: data.proposal_id as string,
                        user_id: user.id,
                        vote_type: data.vote_type as string,
                        voting_power: votingPower
                    })
                    .select()
                    .single();

                if (error) {
                    if (error.code === '23505') throw new Error('Already voted on this proposal');
                    throw error;
                }

                // Update proposal stats
                const column = data.vote_type === 'for' ? 'votes_for' : 'votes_against';
                await supabase.rpc('increment_proposal_votes', {
                    p_proposal_id: data.proposal_id,
                    p_column: column,
                    p_amount: votingPower
                });

                return new Response(JSON.stringify({ success: true, vote }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            case 'get_stats': {
                // Get user global stats
                const { data: stakes } = await supabase
                    .from('user_stakes')
                    .select('amount, rewards_earned')
                    .eq('user_id', user.id)
                    .eq('status', 'active');

                const totalStaked = stakes?.reduce((sum, s) => sum + Number(s.amount), 0) || 0;
                const totalRewards = stakes?.reduce((sum, s) => sum + Number(s.rewards_earned), 0) || 0;

                return new Response(JSON.stringify({
                    success: true,
                    stats: { totalStaked, totalRewards }
                }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            default:
                throw new Error(`Unknown action: ${action}`);
        }

    } catch (error) {
        console.error('Governance error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';

        return new Response(JSON.stringify({
            success: false,
            error: message
        }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
