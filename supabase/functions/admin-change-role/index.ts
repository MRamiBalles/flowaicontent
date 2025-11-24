
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
            throw new Error('Not authenticated')
        }

        // Check if user is admin using secure RPC
        const { data: isAdmin, error: roleError } = await supabaseClient
            .rpc('has_role', {
                _user_id: user.id,
                _role: 'admin'
            });

        if (roleError || !isAdmin) {
            throw new Error('Unauthorized: Admin access required')
        }

        const { userId, newRole } = await req.json()

        if (!userId || !newRole) {
            throw new Error('Missing userId or newRole')
        }

        // Prevent self-demotion
        if (userId === user.id && newRole !== 'admin') {
            throw new Error('Cannot demote yourself')
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

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
