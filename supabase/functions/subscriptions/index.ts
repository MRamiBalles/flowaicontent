import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// import Stripe from "https://esm.sh/stripe@14.21.0"; // Uncomment for real Stripe integration

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Initialize Stripe (placeholder)
// const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
//   apiVersion: '2023-10-16',
// });

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            {
                global: {
                    headers: { Authorization: req.headers.get("Authorization")! },
                },
            }
        );

        // Verify user
        const {
            data: { user },
            error: authError,
        } = await supabaseClient.auth.getUser();

        if (authError || !user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        let action = "";
        let params: any = {};

        // Determine action from query or body
        const url = new URL(req.url);
        if (req.method === "GET") {
            action = url.searchParams.get("action") || "";
        } else {
            try {
                const body = await req.json();
                action = body.action || "";
                params = body;
            } catch (e) {
                // body might be empty
            }
        }

        // ------------------------------------------------------------
        // 1. GET CURRENT SUBSCRIPTION
        // ------------------------------------------------------------
        if (action === "current" || action === "get_subscription") {
            // PROD: Fetch from 'subscriptions' table or Stripe API
            // const { data: subscription } = await supabaseClient.from('subscriptions').select('*').eq('user_id', user.id).single();

            const subscription = {
                tier: "free", // "free", "creator", "pro", "studio", "business"
                status: "active",
                current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                cancel_at_period_end: false,
            };

            return new Response(JSON.stringify(subscription), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // ------------------------------------------------------------
        // 2. GET USAGE STATS
        // ------------------------------------------------------------
        if (action === "usage") {
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const { count } = await supabaseClient
                .from("generation_attempts") // Ensure this table exists or use 'generation_jobs'
                .select("*", { count: 'exact', head: true })
                .eq("user_id", user.id)
                .gte("created_at", oneDayAgo);

            const usage = {
                generations_today: count || 0,
                daily_limit: 10, // Should be based on plan
                remaining: Math.max(0, 10 - (count || 0)),
                reset_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            };
            return new Response(JSON.stringify({ usage }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // ------------------------------------------------------------
        // 3. CANCEL SUBSCRIPTION
        // ------------------------------------------------------------
        if (action === "cancel") {
            // PROD: await stripe.subscriptions.update(subId, { cancel_at_period_end: true });
            return new Response(JSON.stringify({ success: true, message: "Subscription mocked cancel" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // ------------------------------------------------------------
        // 4. REACTIVATE SUBSCRIPTION
        // ------------------------------------------------------------
        if (action === "reactivate") {
            // PROD: await stripe.subscriptions.update(subId, { cancel_at_period_end: false });
            // check if payment method is valid
            return new Response(JSON.stringify({ success: true, message: "Subscription mocked reactivate" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // ------------------------------------------------------------
        // 5. BILLING PORTAL / CHECKOUT
        // ------------------------------------------------------------
        if (action === "portal" || action === "checkout") {
            // PROD: Use Stripe Checkout or Portal Session
            // const session = await stripe.billingPortal.sessions.create({ customer: stripeCustomerId, return_url: ... });

            const isUpgrade = !!params.price_id;
            const url = isUpgrade
                ? "https://billing.stripe.com/p/login/mock_upgrade_checkout"
                : "https://billing.stripe.com/p/login/mock_portal";

            return new Response(JSON.stringify({ url }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
