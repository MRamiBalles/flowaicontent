// Mobile API Edge Function
// Handles mobile device registration and sync

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MobileRequest {
    action: 'register_device' | 'update_token' | 'get_sync_data' | 'check_config';
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

        const body: MobileRequest = await req.json();
        const { action, data } = body;

        switch (action) {
            case 'register_device': {
                const { device_id, device_name, platform, fcm_token } = data || {};

                if (!device_name || !platform) {
                    throw new Error('Device name and platform required');
                }

                const { data: device, error } = await supabase
                    .from('mobile_devices')
                    .upsert({
                        user_id: user.id,
                        device_name: device_name as string,
                        device_type: platform as string,
                        fcm_token: fcm_token as string || null,
                        last_active_at: new Date().toISOString()
                    }, { onConflict: 'user_id,fcm_token' })
                    .select()
                    .single();

                if (error) throw error;

                return new Response(JSON.stringify({ success: true, device }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            case 'get_sync_data': {
                // Fetch pending sync events
                const { data: events, error } = await supabase
                    .from('mobile_sync_events')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('status', 'pending')
                    .order('created_at', { ascending: true })
                    .limit(50);

                if (error) throw error;

                // Mark as processing
                if (events && events.length > 0) {
                    await supabase
                        .from('mobile_sync_events')
                        .update({ status: 'processing' })
                        .in('id', events.map(e => e.id));
                }

                return new Response(JSON.stringify({ success: true, events }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            case 'check_config': {
                const { data: config } = await supabase
                    .from('mobile_app_config')
                    .select('*')
                    .limit(1)
                    .single();

                return new Response(JSON.stringify({ success: true, config }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            default:
                throw new Error(`Unknown action: ${action}`);
        }

    } catch (error) {
        console.error('Mobile API error:', error);
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
