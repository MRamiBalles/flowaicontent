import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createErrorResponse } from "../_shared/error-sanitizer.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const actionSchema = z.enum(["current", "get_subscription", "usage", "cancel", "reactivate", "portal", "checkout"]);

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
        );

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        if (authError || !user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        let action = "";
        let params: Record<string, unknown> = {};

        const url = new URL(req.url);
        if (req.method === "GET") {
            action = url.searchParams.get("action") || "";
        } else {
            try {
                const body = await req.json();
                action = body.action || "";
                params = body;
            } catch { /* empty body */ }
        }

        const actionResult = actionSchema.safeParse(action);
        if (!actionResult.success) {
            return new Response(JSON.stringify({ error: "Invalid action" }), {
                status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        switch (actionResult.data) {
            case "current":
            case "get_subscription": {
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

            case "usage": {
                const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
                const { count } = await supabaseClient
                    .from("generation_attempts")
                    .select("*", { count: 'exact', head: true })
                    .eq("user_id", user.id)
                    .gte("created_at", oneDayAgo);

                return new Response(JSON.stringify({
                    usage: {
                        generations_today: count || 0,
                        daily_limit: 10,
                        remaining: Math.max(0, 10 - (count || 0)),
                        reset_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
                    }
                }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }

            case "cancel":
                return new Response(JSON.stringify({ success: true, message: "Subscription cancelled" }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });

            case "reactivate":
                return new Response(JSON.stringify({ success: true, message: "Subscription reactivated" }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });

            case "portal":
            case "checkout":
                return new Response(JSON.stringify({ url: "#billing-not-configured" }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
        }
    } catch (error) {
        return createErrorResponse(error, corsHeaders, { functionName: "subscriptions" });
    }
});
