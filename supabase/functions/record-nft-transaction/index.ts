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
        const {
            nftId,
            transactionType,
            fromAddress,
            toAddress,
            shares,
            priceMatic,
            transactionHash
        } = await req.json()

        // Validate required fields
        if (!nftId || !transactionType || !toAddress || !shares || !transactionHash) {
            throw new Error('Missing required fields')
        }

        // Validate transaction type
        const validTypes = ['mint', 'buy', 'sell', 'transfer']
        if (!validTypes.includes(transactionType)) {
            throw new Error(`Invalid transaction type. Must be one of: ${validTypes.join(', ')}`)
        }

        // Validate shares
        if (shares <= 0) {
            throw new Error('Shares must be positive')
        }

        // 6. Verify NFT exists
        const { data: nft, error: nftError } = await supabaseAdmin
            .from('nfts')
            .select('id')
            .eq('id', nftId)
            .single()

        if (nftError || !nft) {
            throw new Error('NFT not found')
        }

        // 7. Check for duplicate transaction hash
        const { data: existingTx } = await supabaseAdmin
            .from('nft_transactions')
            .select('id')
            .eq('transaction_hash', transactionHash)
            .single()

        if (existingTx) {
            throw new Error('Transaction already recorded')
        }

        // 8. Insert transaction record
        const { data: transaction, error: txError } = await supabaseAdmin
            .from('nft_transactions')
            .insert({
                nft_id: nftId,
                transaction_type: transactionType,
                from_address: fromAddress,
                to_address: toAddress,
                shares: shares,
                price_matic: priceMatic,
                transaction_hash: transactionHash
            })
            .select()
            .single()

        if (txError) {
            throw new Error(`Failed to record transaction: ${txError.message}`)
        }

        // 9. Log the transaction for audit
        console.log('NFT Transaction recorded:', {
            id: transaction.id,
            type: transactionType,
            hash: transactionHash,
            user: user.email
        })

        return new Response(
            JSON.stringify({
                success: true,
                transaction: transaction
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        console.error('Error in record-nft-transaction:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
