
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

        const isAdmin = user.app_metadata?.role === 'admin' || user.user_metadata?.role === 'admin'

        if (!isAdmin) {
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

        // Update user metadata
        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { user_metadata: { role: newRole } }
        )

        if (error) throw error

        return new Response(JSON.stringify({ data }), {
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
