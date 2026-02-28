import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createErrorResponse } from "../_shared/error-sanitizer.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const actionSchema = z.enum(['stake', 'unstake', 'claim_rewards', 'create_proposal', 'vote', 'get_stats']);
const stakeSchema = z.object({
    pool_id: z.string().uuid(),
    amount: z.number().positive().max(1_000_000_000),
});
const voteSchema = z.object({
    proposal_id: z.string().uuid(),
    vote_type: z.enum(['for', 'against']),
});
const stakeIdSchema = z.object({ stake_id: z.string().uuid() });

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Authorization required' }), {
                status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Invalid token' }), {
                status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const body = await req.json();
        const actionResult = actionSchema.safeParse(body.action);
        if (!actionResult.success) {
            return new Response(JSON.stringify({ error: 'Invalid action' }), {
                status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const action = actionResult.data;
        const data = body.data || {};

        switch (action) {
            case 'stake': {
                const v = stakeSchema.safeParse(data);
                if (!v.success) {
                    return new Response(JSON.stringify({ error: 'Invalid stake parameters', details: v.error.issues.map(i => i.message) }), {
                        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                const { pool_id, amount } = v.data;
                const { data: pool } = await supabase.from('staking_pools').select('*').eq('id', pool_id).single();
                if (!pool) {
                    return new Response(JSON.stringify({ error: 'Pool not found' }), {
                        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                if (pool.min_stake_amount && amount < pool.min_stake_amount) {
                    return new Response(JSON.stringify({ error: `Minimum stake is ${pool.min_stake_amount}` }), {
                        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                const { data: stake, error } = await supabase.from('user_stakes').insert({
                    user_id: user.id, pool_id, amount,
                    unlocks_at: pool.lock_period_days > 0
                        ? new Date(Date.now() + pool.lock_period_days * 86400000).toISOString()
                        : null,
                }).select().single();

                if (error) throw error;
                return new Response(JSON.stringify({ success: true, stake }), {
                    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            case 'claim_rewards': {
                const v = stakeIdSchema.safeParse(data);
                if (!v.success) {
                    return new Response(JSON.stringify({ error: 'Valid stake_id required' }), {
                        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                const { data: rewards, error: calcError } = await supabase
                    .rpc('calculate_rewards', { p_stake_id: v.data.stake_id });
                if (calcError) throw calcError;

                return new Response(JSON.stringify({ success: true, claimed: rewards || 0 }), {
                    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            case 'vote': {
                const v = voteSchema.safeParse(data);
                if (!v.success) {
                    return new Response(JSON.stringify({ error: 'Valid proposal_id and vote_type required' }), {
                        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                const { data: stakes } = await supabase.from('user_stakes')
                    .select('amount').eq('user_id', user.id).eq('status', 'active');
                const votingPower = stakes?.reduce((sum, s) => sum + Number(s.amount), 0) || 0;

                if (votingPower <= 0) {
                    return new Response(JSON.stringify({ error: 'No voting power (stake tokens to vote)' }), {
                        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                const { data: vote, error } = await supabase.from('governance_votes').insert({
                    proposal_id: v.data.proposal_id, user_id: user.id,
                    vote_type: v.data.vote_type, voting_power: votingPower
                }).select().single();

                if (error) {
                    if (error.code === '23505') {
                        return new Response(JSON.stringify({ error: 'Already voted on this proposal' }), {
                            status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                        });
                    }
                    throw error;
                }

                return new Response(JSON.stringify({ success: true, vote }), {
                    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            case 'get_stats': {
                const { data: stakes } = await supabase.from('user_stakes')
                    .select('amount, rewards_earned').eq('user_id', user.id).eq('status', 'active');

                const totalStaked = stakes?.reduce((sum, s) => sum + Number(s.amount), 0) || 0;
                const totalRewards = stakes?.reduce((sum, s) => sum + Number(s.rewards_earned), 0) || 0;

                return new Response(JSON.stringify({ success: true, stats: { totalStaked, totalRewards } }), {
                    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            case 'unstake':
            case 'create_proposal':
                return new Response(JSON.stringify({ error: 'Action not yet implemented' }), {
                    status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
        }
    } catch (error) {
        return createErrorResponse(error, corsHeaders, { functionName: 'token-governance' });
    }
});
