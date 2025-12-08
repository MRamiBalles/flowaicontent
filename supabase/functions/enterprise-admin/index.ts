// Enterprise Admin Edge Function
// Handles enterprise tenant management operations

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnterpriseRequest {
    action: 'get_tenant' | 'update_tenant' | 'invite_user' | 'remove_user' | 'update_role' | 'get_audit_logs' | 'create_api_key' | 'revoke_api_key';
    tenant_id?: string;
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

        const body: EnterpriseRequest = await req.json();
        const { action, tenant_id, data } = body;

        if (!action) {
            return new Response(JSON.stringify({
                success: false,
                error: 'action is required'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Get user's role in the tenant
        let userRole: string | null = null;
        if (tenant_id) {
            const { data: membership } = await supabase
                .from('enterprise_users')
                .select('role')
                .eq('tenant_id', tenant_id)
                .eq('user_id', user.id)
                .eq('status', 'active')
                .single();

            userRole = membership?.role || null;
        }

        // Handle actions
        switch (action) {
            case 'get_tenant': {
                if (!tenant_id) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'tenant_id required'
                    }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                if (!userRole) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Access denied'
                    }), {
                        status: 403,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                const { data: tenant, error } = await supabase
                    .from('enterprise_tenants')
                    .select('*')
                    .eq('id', tenant_id)
                    .single();

                if (error) throw error;

                // Get user count
                const { count: userCount } = await supabase
                    .from('enterprise_users')
                    .select('*', { count: 'exact', head: true })
                    .eq('tenant_id', tenant_id)
                    .eq('status', 'active');

                return new Response(JSON.stringify({
                    success: true,
                    tenant,
                    user_count: userCount,
                    user_role: userRole,
                }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            case 'update_tenant': {
                if (!tenant_id || !data) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'tenant_id and data required'
                    }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                if (userRole !== 'owner' && userRole !== 'admin') {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Admin access required'
                    }), {
                        status: 403,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                // Whitelist allowed fields
                const allowedFields = [
                    'name', 'logo_url', 'logo_dark_url', 'favicon_url',
                    'primary_color', 'secondary_color', 'font_family',
                    'support_email', 'billing_email'
                ];

                const updateData: Record<string, unknown> = {};
                for (const field of allowedFields) {
                    if (data[field] !== undefined) {
                        updateData[field] = data[field];
                    }
                }

                updateData.updated_at = new Date().toISOString();

                const { data: updated, error } = await supabase
                    .from('enterprise_tenants')
                    .update(updateData)
                    .eq('id', tenant_id)
                    .select()
                    .single();

                if (error) throw error;

                // Log audit event
                await supabase.rpc('log_enterprise_audit', {
                    p_tenant_id: tenant_id,
                    p_action: 'tenant.updated',
                    p_resource_type: 'tenant',
                    p_resource_id: tenant_id,
                    p_details: { fields: Object.keys(updateData) },
                });

                return new Response(JSON.stringify({
                    success: true,
                    tenant: updated,
                }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            case 'invite_user': {
                if (!tenant_id || !data?.email) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'tenant_id and email required'
                    }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                if (!['owner', 'admin', 'manager'].includes(userRole || '')) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Manager access required'
                    }), {
                        status: 403,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                // Check user limit
                const { data: tenant } = await supabase
                    .from('enterprise_tenants')
                    .select('user_limit')
                    .eq('id', tenant_id)
                    .single();

                const { count: currentUsers } = await supabase
                    .from('enterprise_users')
                    .select('*', { count: 'exact', head: true })
                    .eq('tenant_id', tenant_id)
                    .eq('status', 'active');

                if (currentUsers && tenant && currentUsers >= tenant.user_limit) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: `User limit reached (${tenant.user_limit}). Please upgrade your plan.`
                    }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                // Create invitation
                const { data: invitation, error } = await supabase
                    .from('enterprise_invitations')
                    .insert({
                        tenant_id,
                        email: data.email as string,
                        role: (data.role as string) || 'member',
                        department: data.department as string,
                        team: data.team as string,
                        invited_by: user.id,
                        message: data.message as string,
                    })
                    .select()
                    .single();

                if (error) {
                    if (error.code === '23505') {
                        return new Response(JSON.stringify({
                            success: false,
                            error: 'User already invited'
                        }), {
                            status: 409,
                            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                        });
                    }
                    throw error;
                }

                // TODO: Send invitation email via Resend/SendGrid

                // Log audit event
                await supabase.rpc('log_enterprise_audit', {
                    p_tenant_id: tenant_id,
                    p_action: 'user.invited',
                    p_resource_type: 'invitation',
                    p_resource_id: invitation.id,
                    p_details: { email: data.email, role: data.role || 'member' },
                });

                return new Response(JSON.stringify({
                    success: true,
                    invitation_id: invitation.id,
                    invitation_link: `https://flowai.studio/join?token=${invitation.token}`,
                }), {
                    status: 201,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            case 'remove_user': {
                if (!tenant_id || !data?.user_id) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'tenant_id and user_id required'
                    }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                if (userRole !== 'owner' && userRole !== 'admin') {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Admin access required'
                    }), {
                        status: 403,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                // Can't remove yourself
                if (data.user_id === user.id) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Cannot remove yourself'
                    }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                // Deactivate user
                const { error } = await supabase
                    .from('enterprise_users')
                    .update({ status: 'deactivated' })
                    .eq('tenant_id', tenant_id)
                    .eq('user_id', data.user_id);

                if (error) throw error;

                // Log audit event
                await supabase.rpc('log_enterprise_audit', {
                    p_tenant_id: tenant_id,
                    p_action: 'user.removed',
                    p_resource_type: 'user',
                    p_resource_id: data.user_id as string,
                });

                return new Response(JSON.stringify({
                    success: true,
                }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            case 'get_audit_logs': {
                if (!tenant_id) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'tenant_id required'
                    }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                if (userRole !== 'owner' && userRole !== 'admin') {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Admin access required'
                    }), {
                        status: 403,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                const limit = (data?.limit as number) || 50;
                const offset = (data?.offset as number) || 0;

                const { data: logs, error, count } = await supabase
                    .from('enterprise_audit_logs')
                    .select('*, user:user_id(email)', { count: 'exact' })
                    .eq('tenant_id', tenant_id)
                    .order('created_at', { ascending: false })
                    .range(offset, offset + limit - 1);

                if (error) throw error;

                return new Response(JSON.stringify({
                    success: true,
                    logs,
                    total: count,
                }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            case 'create_api_key': {
                if (!tenant_id || !data?.name) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'tenant_id and name required'
                    }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                if (userRole !== 'owner' && userRole !== 'admin') {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Admin access required'
                    }), {
                        status: 403,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                // Generate API key
                const apiKey = `fai_${crypto.randomUUID().replace(/-/g, '')}`;
                const keyPrefix = apiKey.substring(0, 12);

                // Hash the key for storage
                const encoder = new TextEncoder();
                const keyData = encoder.encode(apiKey);
                const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);
                const keyHash = Array.from(new Uint8Array(hashBuffer))
                    .map(b => b.toString(16).padStart(2, '0'))
                    .join('');

                const { data: apiKeyRecord, error } = await supabase
                    .from('enterprise_api_keys')
                    .insert({
                        tenant_id,
                        created_by: user.id,
                        name: data.name as string,
                        description: data.description as string,
                        key_prefix: keyPrefix,
                        key_hash: keyHash,
                        scopes: (data.scopes as string[]) || ['read'],
                        expires_at: data.expires_at as string,
                    })
                    .select()
                    .single();

                if (error) throw error;

                // Log audit event
                await supabase.rpc('log_enterprise_audit', {
                    p_tenant_id: tenant_id,
                    p_action: 'api_key.created',
                    p_resource_type: 'api_key',
                    p_resource_id: apiKeyRecord.id,
                    p_details: { name: data.name, scopes: data.scopes || ['read'] },
                });

                return new Response(JSON.stringify({
                    success: true,
                    api_key: apiKey, // Only returned once!
                    key_id: apiKeyRecord.id,
                    message: 'Save this API key now. It will not be shown again.',
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
        console.error('Enterprise admin error:', error);
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
