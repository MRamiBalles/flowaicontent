import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createErrorResponse } from "../_shared/error-sanitizer.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const actionSchema = z.enum(['register_device', 'update_token', 'get_sync_data', 'check_config']);
const registerDeviceSchema = z.object({
    device_name: z.string().trim().min(1).max(100),
    platform: z.string().trim().min(1).max(50),
    fcm_token: z.string().max(500).optional(),
});

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

        switch (actionResult.data) {
            case 'register_device': {
                const validation = registerDeviceSchema.safeParse(body.data);
                if (!validation.success) {
                    return new Response(JSON.stringify({
                        error: 'Validation failed',
                        details: validation.error.issues.map(i => ({ field: i.path.join('.'), message: i.message })),
                    }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
                }

                const { device_name, platform, fcm_token } = validation.data;
                const { data: device, error } = await supabase
                    .from('mobile_devices')
                    .upsert({
                        user_id: user.id,
                        device_name,
                        device_type: platform,
                        device_token: fcm_token || null,
                        last_active_at: new Date().toISOString()
                    })
                    .select().single();

                if (error) throw error;
                return new Response(JSON.stringify({ success: true, device }), {
                    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            case 'get_sync_data': {
                const { data: events, error } = await supabase
                    .from('mobile_sync_events')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: true })
                    .limit(50);

                if (error) throw error;
                return new Response(JSON.stringify({ success: true, events }), {
                    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            case 'check_config': {
                return new Response(JSON.stringify({
                    success: true,
                    config: { version: '1.0', features: ['sync', 'push', 'offline'] }
                }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }

            case 'update_token': {
                return new Response(JSON.stringify({ success: true }), {
                    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }
        }
    } catch (error) {
        return createErrorResponse(error, corsHeaders, { functionName: 'mobile-api' });
    }
});
