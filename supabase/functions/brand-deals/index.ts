// Brand Deals Edge Function
// Manages brand partnerships and AI matching

/**
 * Edge Function: brand-deals
 * 
 * Marketplace for brand partnerships with creators.
 * 
 * Actions:
 * - get_active_deals: List available brand deals
 * - apply_to_deal: Creator applies to partnership
 * - get_my_applications: Creator's deal applications
 * - create_deal: Brand creates deal (brand-only)
 * - accept_application: Brand accepts creator (brand-only)
 * 
 * Deal Structure:
 * - Brand posts requirements (niche, followers, engagement)
 * - Creators apply with portfolio
 * - Brand reviews and accepts
 * - Payment via escrow on completion
 * 
 * Revenue Model:
 * - 10% platform fee on all deals
 * - Payment held in escrow until delivery
 * - Automatic release after approval
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BrandDealsRequest {
    action:
    | 'get_matching_campaigns'
    | 'apply_to_campaign'
    | 'update_deal_status'
    | 'send_message'
    | 'submit_deliverable'
    | 'get_my_deals'
    | 'get_campaign_applications';
    data?: Record<string, unknown>;
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Authorization required'
            }), {
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
            return new Response(JSON.stringify({
                success: false,
                error: 'Invalid token'
            }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const body: BrandDealsRequest = await req.json();
        const { action, data } = body;

        switch (action) {
            case 'get_matching_campaigns': {
                // Get campaigns matching this creator's profile
                const { data: campaigns, error } = await supabase
                    .rpc('get_matching_campaigns', {
                        p_creator_id: user.id,
                        p_limit: (data?.limit as number) || 10
                    });

                if (error) throw error;

                return new Response(JSON.stringify({
                    success: true,
                    campaigns,
                }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            case 'apply_to_campaign': {
                if (!data?.campaign_id) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'campaign_id required'
                    }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                // Check if creator has a media kit
                const { data: mediaKit } = await supabase
                    .from('creator_media_kits')
                    .select('id')
                    .eq('user_id', user.id)
                    .single();

                if (!mediaKit) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Please create your media kit before applying to campaigns'
                    }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                const result = await supabase.rpc('apply_to_campaign', {
                    p_campaign_id: data.campaign_id as string,
                    p_proposed_rate: data.proposed_rate as number,
                });

                if (result.error) throw result.error;

                return new Response(JSON.stringify(result.data), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            case 'get_my_deals': {
                // Get all deals for this user (as creator)
                const { data: deals, error } = await supabase
                    .from('brand_deals')
                    .select(`
            *,
            campaign:campaign_id(title, content_type, content_deadline),
            brand:brand_id(name, logo_url)
          `)
                    .eq('creator_id', user.id)
                    .order('updated_at', { ascending: false });

                if (error) throw error;

                return new Response(JSON.stringify({
                    success: true,
                    deals,
                }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            case 'get_campaign_applications': {
                if (!data?.campaign_id) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'campaign_id required'
                    }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                // Verify user owns the brand for this campaign
                const { data: campaign } = await supabase
                    .from('brand_campaigns')
                    .select('brand_id')
                    .eq('id', data.campaign_id)
                    .single();

                if (!campaign) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Campaign not found'
                    }), {
                        status: 404,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                const { data: brand } = await supabase
                    .from('brand_profiles')
                    .select('owner_user_id')
                    .eq('id', campaign.brand_id)
                    .single();

                if (brand?.owner_user_id !== user.id) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Access denied'
                    }), {
                        status: 403,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                // Get applications
                const { data: applications, error } = await supabase
                    .from('brand_deals')
                    .select(`
            *,
            creator:creator_id(email),
            media_kit:creator_id(
              display_name,
              profile_image_url,
              total_followers,
              engagement_rate,
              average_rating
            )
          `)
                    .eq('campaign_id', data.campaign_id)
                    .order('match_score', { ascending: false });

                if (error) throw error;

                return new Response(JSON.stringify({
                    success: true,
                    applications,
                }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            case 'update_deal_status': {
                if (!data?.deal_id || !data?.status) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'deal_id and status required'
                    }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                // Get the deal
                const { data: deal } = await supabase
                    .from('brand_deals')
                    .select('*, brand:brand_id(owner_user_id)')
                    .eq('id', data.deal_id)
                    .single();

                if (!deal) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Deal not found'
                    }), {
                        status: 404,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                // Check authorization
                const isBrand = deal.brand?.owner_user_id === user.id;
                const isCreator = deal.creator_id === user.id;

                if (!isBrand && !isCreator) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Access denied'
                    }), {
                        status: 403,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                // Validate status transition
                const validTransitions: Record<string, string[]> = {
                    pending: ['accepted', 'negotiating', 'cancelled'],
                    negotiating: ['accepted', 'cancelled'],
                    accepted: ['in_progress', 'cancelled'],
                    in_progress: ['review', 'cancelled'],
                    review: ['revision_requested', 'approved'],
                    revision_requested: ['review'],
                    approved: ['published'],
                    published: ['completed'],
                };

                if (!validTransitions[deal.status]?.includes(data.status as string)) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: `Cannot transition from ${deal.status} to ${data.status}`
                    }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                // Update timestamps based on status
                const updates: Record<string, unknown> = {
                    status: data.status,
                    updated_at: new Date().toISOString(),
                };

                if (data.status === 'accepted') updates.accepted_at = new Date().toISOString();
                if (data.status === 'in_progress') updates.started_at = new Date().toISOString();
                if (data.status === 'review') updates.submitted_at = new Date().toISOString();
                if (data.status === 'approved') updates.approved_at = new Date().toISOString();
                if (data.status === 'completed') updates.completed_at = new Date().toISOString();

                const { error: updateError } = await supabase
                    .from('brand_deals')
                    .update(updates)
                    .eq('id', data.deal_id);

                if (updateError) throw updateError;

                // Update campaign counts if accepted
                if (data.status === 'accepted') {
                    await supabase
                        .from('brand_campaigns')
                        .update({ accepted_count: deal.campaign?.accepted_count + 1 })
                        .eq('id', deal.campaign_id);
                }

                return new Response(JSON.stringify({
                    success: true,
                    new_status: data.status,
                }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            case 'send_message': {
                if (!data?.deal_id || !data?.message) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'deal_id and message required'
                    }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                // Create message
                const { data: message, error } = await supabase
                    .from('deal_messages')
                    .insert({
                        deal_id: data.deal_id as string,
                        sender_id: user.id,
                        message: data.message as string,
                        attachments: data.attachments || [],
                    })
                    .select()
                    .single();

                if (error) throw error;

                // Update deal message count
                await supabase
                    .from('brand_deals')
                    .update({
                        messages_count: supabase.rpc('increment', { row_count: 1 }),
                        last_message_at: new Date().toISOString()
                    })
                    .eq('id', data.deal_id);

                return new Response(JSON.stringify({
                    success: true,
                    message,
                }), {
                    status: 201,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            default:
                return new Response(JSON.stringify({
                    success: false,
                    error: `Unknown action: ${action}`
                }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
        }

    } catch (error) {
        console.error('Brand deals error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';

        return new Response(JSON.stringify({
            success: false,
            error: message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
