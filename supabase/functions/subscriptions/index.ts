import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

        const url = new URL(req.url);
        const path = url.pathname.split("/").pop(); // e.g., 'current', 'usage', 'cancel'

        // Mock data based on user
        // In production, this would request Stripe API

        if (path === "current") {
            // Get current subscription
            const subscription = {
                tier: "free",
                status: "active",
                current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                cancel_at_period_end: false,
            };
            return new Response(JSON.stringify(subscription), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        if (path === "usage") {
            // Get usage
            // This could query the generation_attempts table
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const { count } = await supabaseClient
                .from("generation_attempts")
                .select("*", { count: 'exact', head: true })
                .eq("user_id", user.id)
                .gte("created_at", oneDayAgo);

            const usage = {
                generations_today: count || 0,
                daily_limit: 10, // Default for free
                remaining: Math.max(0, 10 - (count || 0)),
                reset_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // Mock reset time
            };
            return new Response(JSON.stringify({ usage }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        if (path === "cancel") {
            return new Response(JSON.stringify({ success: true, message: "Subscription mocked cancel" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        if (path === "reactivate") {
            return new Response(JSON.stringify({ success: true, message: "Subscription mocked reactivate" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        if (path === "portal") {
            return new Response(JSON.stringify({ url: "https://billing.stripe.com/p/login/mock" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
