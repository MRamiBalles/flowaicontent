/**
 * Edge Function: admin-list-users
 * 
 * Lists all users in the platform (admin-only).
 * 
 * Security:
 * 1. Verify user is authenticated
 * 2. Check admin role via has_role() RPC function
 * 3. Use SERVICE_ROLE_KEY to bypass RLS
 * 
 * Authentication Pattern:
 * - First client: Uses user's JWT (ANON_KEY)
 * - Second client: Uses SERVICE_ROLE_KEY for admin operations
 * 
 * This two-client pattern ensures:
 * - User identity is verified
 * - Admin role is checked securely
 * - Elevated permissions only after verification
 * 
 * Returns:
 * - Array of all users from auth.users table
 * - Includes email, metadata, created_at, etc.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

import { corsHeaders } from '../_shared/cors.ts'

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    try {
        // Step 1: Verify user authentication with their JWT
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

        // Step 2: Verify admin role using database function
        // has_role() RPC checks user_roles table securely
        const { data: isAdmin, error: roleError } = await supabaseClient
            .rpc('has_role', {
                _user_id: user.id,
                _role: 'admin'
            });

        if (roleError || !isAdmin) {
            throw new Error('Unauthorized: Admin access required')
        }

        // Step 3: Create admin client with elevated permissions
        // SERVICE_ROLE_KEY bypasses RLS and can access auth.users
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers()

        if (error) throw error

        return new Response(JSON.stringify({ users }), {
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
