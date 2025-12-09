import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BillingRequest {
    action: 'get_balance' | 'deduct_credits' | 'add_credits';
    userId?: string; // For admin use
    amount?: number;
    service?: string; // For deduction
    metadata?: any;
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        // Auth check
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization header');

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) throw new Error('Invalid token');

        const { action, amount, service, metadata, userId } = await req.json();

        // Handling Actions
        if (action === 'get_balance') {
            const targetUserId = userId || user.id;

            // Security check: only allow viewing other's balance if admin
            if (targetUserId !== user.id) {
                const { data: caller } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single();
                if (caller?.role !== 'admin' && caller?.role !== 'super_admin') {
                    throw new Error('Unauthorized to view other users balance');
                }
            }

            const { data } = await supabase
                .from('user_credits')
                .select('balance')
                .eq('user_id', targetUserId)
                .single();

            return new Response(JSON.stringify({
                success: true,
                balance: data?.balance || 0
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (action === 'deduct_credits') {
            if (!amount || amount <= 0) throw new Error('Invalid amount');
            if (!service) throw new Error('Service name required');

            // Check balance first
            const { data: creditData } = await supabase
                .from('user_credits')
                .select('balance')
                .eq('user_id', user.id)
                .single();

            const currentBalance = creditData?.balance || 0;

            if (currentBalance < amount) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Insufficient funds',
                    current_balance: currentBalance,
                    required: amount
                }), {
                    status: 402, // Payment Required
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            // Processing Deduction via Transaction Log (Trigger handles balance update)
            const { error } = await supabase
                .from('credit_transactions')
                .insert({
                    user_id: user.id,
                    amount: -amount, // Negative for deduction
                    transaction_type: service,
                    description: `Used for ${service}`,
                    metadata: metadata || {}
                });

            if (error) throw error;

            return new Response(JSON.stringify({
                success: true,
                deducted: amount,
                new_balance: currentBalance - amount
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        throw new Error(`Unknown action: ${action}`);

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return new Response(JSON.stringify({
            success: false,
            error: message
        }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
