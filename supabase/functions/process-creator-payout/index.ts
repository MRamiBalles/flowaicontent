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

        // 5. Verify user is admin
        const { data: userRole } = await supabaseAdmin
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('role', 'admin')
            .single()

        if (!userRole) {
            throw new Error('Forbidden: Admin access required')
        }

        // 6. Parse and validate input
        const { purchaseId } = await req.json()

        if (!purchaseId) {
            throw new Error('Missing required field: purchaseId')
        }

        // 7. Get purchase details
        const { data: purchase, error: purchaseError } = await supabaseAdmin
            .from('style_pack_purchases')
            .select(`
        id,
        style_pack_id,
        buyer_id,
        price_paid_cents,
        user_style_packs (
          creator_id
        )
      `)
            .eq('id', purchaseId)
            .single()

        if (purchaseError || !purchase) {
            throw new Error('Purchase not found')
        }

        // 8. Check if payout already exists
        const { data: existingPayout } = await supabaseAdmin
            .from('creator_earnings')
            .select('id')
            .eq('purchase_id', purchaseId)
            .single()

        if (existingPayout) {
            throw new Error('Payout already processed for this purchase')
        }

        // 9. Calculate 70/30 split (70% to creator, 30% platform fee)
        const totalAmount = purchase.price_paid_cents
        const creatorAmount = Math.floor(totalAmount * 0.7)
        const platformFee = totalAmount - creatorAmount

        // @ts-ignore - TypeScript doesn't recognize the nested relation
        const creatorId = purchase.user_style_packs.creator_id

        // 10. Insert creator earnings record
        const { data: earning, error: earningError } = await supabaseAdmin
            .from('creator_earnings')
            .insert({
                creator_id: creatorId,
                style_pack_id: purchase.style_pack_id,
                purchase_id: purchase.id,
                amount_cents: creatorAmount,
                platform_fee_cents: platformFee,
                status: 'pending',
                payout_method: null, // To be set when creator requests payout
            })
            .select()
            .single()

        if (earningError) {
            throw new Error(`Failed to create earnings record: ${earningError.message}`)
        }

        // 11. Log the payout for audit
        await supabaseAdmin
            .from('admin_audit_logs')
            .insert({
                admin_id: user.id,
                action: 'process_creator_payout',
                resource_type: 'creator_earnings',
                resource_id: earning.id,
                details: {
                    purchase_id: purchaseId,
                    creator_id: creatorId,
                    amount_cents: creatorAmount,
                    platform_fee_cents: platformFee
                }
            })

        console.log('Creator payout processed:', {
            earning_id: earning.id,
            creator_id: creatorId,
            amount: creatorAmount,
            admin: user.email
        })

        return new Response(
            JSON.stringify({
                success: true,
                earning: earning
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        console.error('Error in process-creator-payout:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: error.message.includes('Forbidden') ? 403 : 400,
            }
        )
    }
})
