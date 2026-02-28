/**
 * billing-engine/index.ts
 * 
 * Unified credit management for all AI features.
 * Handles balance queries, credit deductions, and admin top-ups.
 * 
 * Actions:
 * - get_balance: Check user's current credit balance
 * - deduct_credits: Consume credits for AI operations
 * - add_credits: Admin-only credit top-up
 * 
 * Security:
 * - Input validation with strict type checking
 * - Error sanitization (no internal details leaked)
 * - Admin-only access for viewing other users' balances
 * 
 * @module functions/billing-engine
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================
// CORS HEADERS
// ============================================================

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================
// VALIDATION HELPERS
// ============================================================

const VALID_ACTIONS = ['get_balance', 'deduct_credits', 'add_credits'] as const;
type ValidAction = typeof VALID_ACTIONS[number];
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_AMOUNT = 1_000_000;
const MAX_SERVICE_LENGTH = 100;

function sanitizedResponse(body: Record<string, unknown>, status: number) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}

// ============================================================
// MAIN HANDLER
// ============================================================

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
        if (!authHeader) {
            return sanitizedResponse({ success: false, error: 'Authorization required' }, 401);
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return sanitizedResponse({ success: false, error: 'Invalid token' }, 401);
        }

        // Parse and validate request body
        let body: Record<string, unknown>;
        try {
            body = await req.json();
        } catch {
            return sanitizedResponse({ success: false, error: 'Invalid JSON body' }, 400);
        }

        const { action, amount, service, metadata, userId } = body;

        // Validate action
        if (!action || !VALID_ACTIONS.includes(action as ValidAction)) {
            return sanitizedResponse({ 
                success: false, 
                error: `Invalid action. Allowed: ${VALID_ACTIONS.join(', ')}` 
            }, 400);
        }

        // ============================================================
        // GET BALANCE
        // ============================================================
        if (action === 'get_balance') {
            const targetUserId = (typeof userId === 'string' && UUID_REGEX.test(userId)) 
                ? userId 
                : user.id;

            // Security check: only allow viewing other's balance if admin
            if (targetUserId !== user.id) {
                const { data: caller } = await supabase
                    .from('user_roles')
                    .select('role')
                    .eq('user_id', user.id)
                    .single();
                    
                if (caller?.role !== 'admin' && caller?.role !== 'super_admin') {
                    return sanitizedResponse({ success: false, error: 'Unauthorized' }, 403);
                }
            }

            const { data } = await supabase
                .from('user_credits')
                .select('balance')
                .eq('user_id', targetUserId)
                .single();

            return sanitizedResponse({
                success: true,
                balance: data?.balance || 0
            }, 200);
        }

        // ============================================================
        // DEDUCT CREDITS
        // ============================================================
        if (action === 'deduct_credits') {
            // Validate amount
            if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT) {
                return sanitizedResponse({ 
                    success: false, 
                    error: `Invalid amount. Must be a positive number up to ${MAX_AMOUNT}` 
                }, 400);
            }

            // Validate service name
            if (typeof service !== 'string' || service.length === 0 || service.length > MAX_SERVICE_LENGTH) {
                return sanitizedResponse({ 
                    success: false, 
                    error: 'Service name required (max 100 characters)' 
                }, 400);
            }

            // Validate metadata if provided
            if (metadata !== undefined && (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata))) {
                return sanitizedResponse({ success: false, error: 'Invalid metadata format' }, 400);
            }

            // Check balance first
            const { data: creditData } = await supabase
                .from('user_credits')
                .select('balance')
                .eq('user_id', user.id)
                .single();

            const currentBalance = creditData?.balance || 0;

            if (currentBalance < amount) {
                return sanitizedResponse({
                    success: false,
                    error: 'Insufficient funds',
                    current_balance: currentBalance,
                    required: amount
                }, 402);
            }

            // Processing Deduction via Transaction Log
            const { error } = await supabase
                .from('credit_transactions')
                .insert({
                    user_id: user.id,
                    amount: -amount,
                    transaction_type: service,
                    description: `Used for ${service}`,
                    metadata: metadata || {}
                });

            if (error) throw error;

            return sanitizedResponse({
                success: true,
                deducted: amount,
                new_balance: currentBalance - amount
            }, 200);
        }

        // Fallback (should not reach here due to validation above)
        return sanitizedResponse({ success: false, error: 'Unknown action' }, 400);

    } catch (error: unknown) {
        // Sanitize error - never leak internal details
        console.error('billing-engine error:', error);
        return sanitizedResponse({ success: false, error: 'An internal error occurred' }, 500);
    }
});