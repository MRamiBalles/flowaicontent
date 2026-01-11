// API Gateway Edge Function
// Manages developer API keys, usage, and authentication

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createErrorResponse } from "../_shared/error-sanitizer.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

interface ApiGatewayRequest {
    action:
    | 'register_developer'
    | 'create_api_key'
    | 'list_api_keys'
    | 'revoke_api_key'
    | 'get_usage'
    | 'create_webhook'
    | 'list_webhooks'
    | 'delete_webhook'
    | 'get_endpoints';
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

        const body: ApiGatewayRequest = await req.json();
        const { action, data } = body;

        // Get developer account
        let developerId: string | null = null;
        const { data: devAccount } = await supabase
            .from('developer_accounts')
            .select('id, tier, status')
            .eq('user_id', user.id)
            .single();

        if (devAccount) {
            developerId = devAccount.id;
        }

        switch (action) {
            case 'register_developer': {
                if (devAccount) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Developer account already exists',
                    }), {
                        status: 409,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                const { data: newDev, error } = await supabase
                    .from('developer_accounts')
                    .insert({
                        user_id: user.id,
                        contact_email: user.email,
                        company_name: data?.company_name as string,
                        website_url: data?.website_url as string,
                        description: data?.description as string,
                        accepted_terms_at: new Date().toISOString(),
                        accepted_terms_version: '1.0',
                    })
                    .select()
                    .single();

                if (error) throw error;

                return new Response(JSON.stringify({
                    success: true,
                    developer: newDev,
                }), {
                    status: 201,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            case 'create_api_key': {
                if (!developerId) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Developer account required',
                    }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                // Check key limit by tier
                const keyLimits: Record<string, number> = {
                    free: 2,
                    starter: 5,
                    pro: 20,
                    enterprise: 100,
                };

                const { count } = await supabase
                    .from('api_keys')
                    .select('*', { count: 'exact', head: true })
                    .eq('developer_id', developerId)
                    .eq('is_active', true);

                const limit = keyLimits[devAccount?.tier || 'free'];
                if ((count || 0) >= limit) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: `API key limit reached (${limit}). Upgrade your plan for more keys.`,
                    }), {
                        status: 403,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                // Generate API key
                const apiKey = `fai_live_${crypto.randomUUID().replace(/-/g, '')}`;
                const keyPrefix = apiKey.substring(0, 12);

                // Hash the key
                const encoder = new TextEncoder();
                const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(apiKey));
                const keyHash = Array.from(new Uint8Array(hashBuffer))
                    .map(b => b.toString(16).padStart(2, '0'))
                    .join('');

                const { data: newKey, error } = await supabase
                    .from('api_keys')
                    .insert({
                        developer_id: developerId,
                        name: (data?.name as string) || 'Default Key',
                        description: data?.description as string,
                        key_prefix: keyPrefix,
                        key_hash: keyHash,
                        scopes: (data?.scopes as string[]) || ['read'],
                        allowed_origins: data?.allowed_origins as string[],
                        expires_at: data?.expires_at as string,
                    })
                    .select()
                    .single();

                if (error) throw error;

                return new Response(JSON.stringify({
                    success: true,
                    api_key: apiKey, // Only returned once!
                    key_id: newKey.id,
                    key_prefix: keyPrefix,
                    warning: 'Save this API key now. It will not be shown again.',
                }), {
                    status: 201,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            case 'list_api_keys': {
                if (!developerId) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Developer account required',
                    }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                const { data: keys, error } = await supabase
                    .from('api_keys')
                    .select('id, name, description, key_prefix, scopes, last_used_at, total_requests, is_active, created_at, expires_at')
                    .eq('developer_id', developerId)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                return new Response(JSON.stringify({
                    success: true,
                    keys,
                }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            case 'revoke_api_key': {
                if (!data?.key_id) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'key_id required',
                    }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                const { error } = await supabase
                    .from('api_keys')
                    .update({
                        is_active: false,
                        revoked_at: new Date().toISOString(),
                        revoked_reason: (data?.reason as string) || 'Revoked by user',
                    })
                    .eq('id', data.key_id)
                    .eq('developer_id', developerId);

                if (error) throw error;

                return new Response(JSON.stringify({
                    success: true,
                }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            case 'get_usage': {
                if (!developerId) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Developer account required',
                    }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                const { data: usage, error } = await supabase
                    .rpc('get_usage_summary', {
                        p_developer_id: developerId,
                    });

                if (error) throw error;

                return new Response(JSON.stringify({
                    success: true,
                    usage: usage?.[0] || null,
                }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            case 'create_webhook': {
                if (!developerId) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Developer account required',
                    }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                if (!data?.url) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'url is required',
                    }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                // Generate webhook secret
                const secret = `whsec_${crypto.randomUUID().replace(/-/g, '')}`;

                const { data: webhook, error } = await supabase
                    .from('developer_webhooks')
                    .insert({
                        developer_id: developerId,
                        name: (data?.name as string) || 'Webhook',
                        url: data.url as string,
                        secret,
                        events: (data?.events as string[]) || ['*'],
                    })
                    .select()
                    .single();

                if (error) throw error;

                return new Response(JSON.stringify({
                    success: true,
                    webhook: {
                        ...webhook,
                        secret, // Only returned once
                    },
                    warning: 'Save this webhook secret. It will not be shown again.',
                }), {
                    status: 201,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            case 'list_webhooks': {
                if (!developerId) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Developer account required',
                    }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                const { data: webhooks, error } = await supabase
                    .from('developer_webhooks')
                    .select('id, name, url, events, is_active, last_triggered_at, failure_count, created_at')
                    .eq('developer_id', developerId)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                return new Response(JSON.stringify({
                    success: true,
                    webhooks,
                }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            case 'get_endpoints': {
                const { data: endpoints, error } = await supabase
                    .from('api_endpoints')
                    .select('*')
                    .eq('is_active', true)
                    .order('path');

                if (error) throw error;

                return new Response(JSON.stringify({
                    success: true,
                    endpoints,
                }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            default:
                return new Response(JSON.stringify({
                    success: false,
                    error: `Unknown action: ${action}`,
                }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
        }

    } catch (error) {
        return createErrorResponse(error, corsHeaders, { functionName: 'api-gateway' });
    }
});
