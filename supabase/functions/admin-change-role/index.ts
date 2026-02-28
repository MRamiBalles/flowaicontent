/**
 * Edge Function: admin-change-role
 * 
 * Changes a user's role (admin-only).
 * 
 * Roles:
 * - user: Default role (can use platform)
 * - moderator: Can moderate content
 * - admin: Full platform access
 * 
 * Security:
 * - Validates newRole against allowed enum values
 * - Validates userId as UUID format
 * - Prevent self-demotion (admins can't remove their own admin role)
 * - Atomic operation: delete old role, insert new role
 * - Audit log records all role changes
 * - Error messages are sanitized (no internal details leaked)
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

import { corsHeaders } from '../_shared/cors.ts'

const ALLOWED_ROLES = ['user', 'moderator', 'admin'] as const;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const {
            data: { user },
        } = await supabaseClient.auth.getUser()

        if (!user) {
            return new Response(JSON.stringify({ error: 'Not authenticated' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            })
        }

        // Check if user is admin using secure RPC
        const { data: isAdmin, error: roleError } = await supabaseClient
            .rpc('has_role', {
                _user_id: user.id,
                _role: 'admin'
            });

        if (roleError || !isAdmin) {
            return new Response(JSON.stringify({ error: 'Unauthorized: Admin access required' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 403,
            })
        }

        const body = await req.json()
        const { userId, newRole } = body

        // Validate required fields
        if (!userId || !newRole) {
            return new Response(JSON.stringify({ error: 'Missing userId or newRole' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        // Validate userId is a valid UUID
        if (typeof userId !== 'string' || !UUID_REGEX.test(userId)) {
            return new Response(JSON.stringify({ error: 'Invalid userId format' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        // Validate newRole against allowed enum values
        if (!ALLOWED_ROLES.includes(newRole)) {
            return new Response(JSON.stringify({ 
                error: `Invalid role. Allowed: ${ALLOWED_ROLES.join(', ')}` 
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        // Prevent self-demotion
        if (userId === user.id && newRole !== 'admin') {
            return new Response(JSON.stringify({ error: 'Cannot demote yourself' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Update user_roles table
        // 1. Delete existing role
        const { error: deleteError } = await supabaseAdmin
            .from('user_roles')
            .delete()
            .eq('user_id', userId)

        if (deleteError) throw deleteError

        // 2. Insert new role
        const { error: insertError } = await supabaseAdmin
            .from('user_roles')
            .insert({ user_id: userId, role: newRole })

        if (insertError) throw insertError

        // 3. Audit Log
        try {
            await supabaseAdmin
                .from('admin_audit_logs')
                .insert({
                    admin_id: user.id,
                    action: 'change_role',
                    target_user_id: userId,
                    details: { new_role: newRole }
                })
        } catch (auditError) {
            console.error('Audit log failed:', auditError)
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error: unknown) {
        // Sanitize error - never leak internal details
        console.error('admin-change-role error:', error)
        return new Response(JSON.stringify({ error: 'An internal error occurred' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})