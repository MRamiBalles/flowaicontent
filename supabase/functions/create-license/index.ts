// Create License Edge Function
// Allows creators to list their content for licensing

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateLicenseRequest {
    content_type: 'video' | 'style_pack' | 'voice' | 'music' | 'template';
    content_id: string;
    content_title: string;
    content_preview_url?: string;
    license_type: 'royalty_free' | 'rights_managed' | 'editorial' | 'commercial' | 'exclusive';
    price_cents: number;
    usage_rights?: string[];
    max_impressions?: number;
    duration_days?: number;
    territory?: string[];
    royalty_percentage?: number;
    requires_attribution?: boolean;
    attribution_text?: string;
    allows_ai_training?: boolean;
    allows_derivative_works?: boolean;
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

        const body: CreateLicenseRequest = await req.json();

        // Validate required fields
        if (!body.content_type || !body.content_id || !body.content_title) {
            return new Response(JSON.stringify({
                success: false,
                error: 'content_type, content_id, and content_title are required'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        if (!body.license_type) {
            return new Response(JSON.stringify({
                success: false,
                error: 'license_type is required'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        if (typeof body.price_cents !== 'number' || body.price_cents < 0) {
            return new Response(JSON.stringify({
                success: false,
                error: 'price_cents must be a non-negative number'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Validate royalty percentage for rights_managed
        if (body.license_type === 'rights_managed') {
            if (body.royalty_percentage === undefined || body.royalty_percentage < 0 || body.royalty_percentage > 50) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'rights_managed licenses require royalty_percentage between 0 and 50'
                }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }
        }

        // Verify content ownership based on type
        let ownershipValid = false;

        switch (body.content_type) {
            case 'video':
                // Check if user owns this video
                const { data: video } = await supabase
                    .from('videos')
                    .select('user_id')
                    .eq('id', body.content_id)
                    .single();
                ownershipValid = video?.user_id === user.id;
                break;

            case 'style_pack':
                const { data: stylePack } = await supabase
                    .from('user_style_packs')
                    .select('creator_id')
                    .eq('id', body.content_id)
                    .single();
                ownershipValid = stylePack?.creator_id === user.id;
                break;

            case 'voice':
                const { data: voice } = await supabase
                    .from('voice_clones')
                    .select('user_id')
                    .eq('id', body.content_id)
                    .single();
                ownershipValid = voice?.user_id === user.id;
                break;

            default:
                // For templates and music, assume ownership if they're creating the license
                ownershipValid = true;
        }

        if (!ownershipValid) {
            return new Response(JSON.stringify({
                success: false,
                error: 'You do not own this content or it does not exist'
            }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Create the license
        const { data: license, error: insertError } = await supabase
            .from('content_licenses')
            .insert({
                content_type: body.content_type,
                content_id: body.content_id,
                content_title: body.content_title,
                content_preview_url: body.content_preview_url,
                creator_id: user.id,
                license_type: body.license_type,
                price_cents: body.price_cents,
                usage_rights: body.usage_rights || ['web', 'social', 'broadcast'],
                max_impressions: body.max_impressions,
                duration_days: body.duration_days,
                territory: body.territory || ['worldwide'],
                royalty_percentage: body.royalty_percentage || 0,
                requires_attribution: body.requires_attribution || false,
                attribution_text: body.attribution_text,
                allows_ai_training: body.allows_ai_training || false,
                allows_derivative_works: body.allows_derivative_works !== false,
                is_active: true,
            })
            .select()
            .single();

        if (insertError) {
            console.error('Insert error:', insertError);

            if (insertError.code === '23505') {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'A license of this type already exists for this content'
                }), {
                    status: 409,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            throw new Error(insertError.message);
        }

        console.log(`License created: ${license.id} by user ${user.id}`);

        return new Response(JSON.stringify({
            success: true,
            license_id: license.id,
            license,
        }), {
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Create license error:', error);
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
