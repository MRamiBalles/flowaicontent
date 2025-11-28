import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Verify authentication
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('Missing authorization header')
        }

        // 2. Create admin client (bypass RLS)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // 3. Create user client (validate permissions)
        const supabaseUser = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: { headers: { Authorization: authHeader } },
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // 4. Get current user
        const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
        if (userError || !user) {
            throw new Error('Unauthorized')
        }

        // 5. Parse and validate input
        const { nftId, shares, action, price } = await req.json()

        if (!nftId || !shares || !action) {
            throw new Error('Missing required fields: nftId, shares, action')
        }

        if (shares <= 0) {
            throw new Error('Shares must be positive')
        }

        if (!['buy', 'sell'].includes(action)) {
            throw new Error('Action must be "buy" or "sell"')
        }

        // 6. Verify NFT exists
        const { data: nft, error: nftError } = await supabaseAdmin
            .from('nfts')
            .select('id, total_shares')
            .eq('id', nftId)
            .single()

        if (nftError || !nft) {
            throw new Error('NFT not found')
        }

        // 7. Get user's wallet address (from user metadata or Web3 connection)
        const userAddress = user.user_metadata?.wallet_address
        if (!userAddress) {
            throw new Error('User wallet address not found')
        }

        // 8. Perform transaction
        if (action === 'buy') {
            // Check if seller has enough shares
            const { data: availableShares } = await supabaseAdmin
                .from('nft_shares')
                .select('shares')
                .eq('nft_id', nftId)
                .neq('owner_address', userAddress)
                .order('shares', { ascending: false })
                .limit(1)
                .single()

            if (!availableShares || availableShares.shares < shares) {
                throw new Error('Not enough shares available for purchase')
            }

            // Update or create user's share record
            const { data: existingShare } = await supabaseAdmin
                .from('nft_shares')
                .select('id, shares')
                .eq('nft_id', nftId)
                .eq('owner_address', userAddress)
                .single()

            if (existingShare) {
                await supabaseAdmin
                    .from('nft_shares')
                    .update({ shares: existingShare.shares + shares })
                    .eq('id', existingShare.id)
            } else {
                await supabaseAdmin
                    .from('nft_shares')
                    .insert({
                        nft_id: nftId,
                        owner_address: userAddress,
                        shares: shares
                    })
            }
        } else {
            // Sell: Verify user has enough shares
            const { data: userShare } = await supabaseAdmin
                .from('nft_shares')
                .select('id, shares')
                .eq('nft_id', nftId)
                .eq('owner_address', userAddress)
                .single()

            if (!userShare || userShare.shares < shares) {
                throw new Error('Insufficient shares to sell')
            }

            // Update user's shares
            const newShares = userShare.shares - shares
            if (newShares === 0) {
                await supabaseAdmin
                    .from('nft_shares')
                    .delete()
                    .eq('id', userShare.id)
            } else {
                await supabaseAdmin
                    .from('nft_shares')
                    .update({ shares: newShares })
                    .eq('id', userShare.id)
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: `Successfully ${action === 'buy' ? 'purchased' : 'sold'} ${shares} shares`
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
        console.error('Error in manage-nft-shares:', error)
        return new Response(
            JSON.stringify({ error: errorMessage }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
