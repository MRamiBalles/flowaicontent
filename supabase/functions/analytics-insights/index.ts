/**
 * Edge Function: analytics-insights
 * 
 * AI-powered creator analytics and insights.
 * 
 * Actions:
 * - get_dashboard: Fetch 30-day analytics summary
 * - generate_insights: AI-generated growth recommendations
 * - dismiss_insight: Mark insight as read
 * 
 * Data Sources:
 * - creator_analytics: Daily views, revenue, followers
 * - content_performance: Top performing content
 * - platform_metrics: Platform comparison (Twitter, LinkedIn, etc.)
 * - ai_analytics_insights: AI-generated recommendations
 * 
 * Insights Generated:
 * - Best posting times (based on audience activity)
 * - Trending topics (cross-platform analysis)
 * - Growth opportunities (content gaps)
 * - Engagement optimization tips
 * 
 * Currently uses mock insights. TODO: Integrate real AI model.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return new Response(JSON.stringify({ error: "Invalid token" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const { action } = await req.json();

        switch (action) {
            case "get_dashboard": {
                // Fetch last 30 days of analytics
                const { data: analytics } = await supabase
                    .from("creator_analytics")
                    .select("*")
                    .eq("user_id", user.id)
                    .gte("date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
                    .order("date", { ascending: true });

                // Fetch top performing content
                const { data: topContent } = await supabase
                    .from("content_performance")
                    .select("*")
                    .eq("user_id", user.id)
                    .order("views", { ascending: false })
                    .limit(5);

                // Fetch platform comparison
                const { data: platforms } = await supabase
                    .from("platform_metrics")
                    .select("*")
                    .eq("user_id", user.id)
                    .eq("date", new Date().toISOString().split("T")[0]);

                // Fetch active insights
                const { data: insights } = await supabase
                    .from("ai_analytics_insights")
                    .select("*")
                    .eq("user_id", user.id)
                    .eq("is_dismissed", false)
                    .order("created_at", { ascending: false })
                    .limit(5);

                // Calculate summary stats
                const totalViews = analytics?.reduce((sum, a) => sum + (a.total_views || 0), 0) || 0;
                const totalRevenue = analytics?.reduce((sum, a) => sum + (a.revenue_cents || 0), 0) || 0;
                const totalFollowers = analytics?.reduce((sum, a) => sum + (a.new_followers || 0), 0) || 0;

                return new Response(
                    JSON.stringify({
                        success: true,
                        summary: {
                            totalViews,
                            totalRevenue,
                            totalFollowers,
                            avgEngagement: analytics?.length ?
                                (analytics.reduce((sum, a) => sum + (a.total_likes || 0) + (a.total_comments || 0), 0) / totalViews * 100).toFixed(2) : 0,
                        },
                        chartData: analytics || [],
                        topContent: topContent || [],
                        platforms: platforms || [],
                        insights: insights || [],
                    }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            case "generate_insights": {
                // AI-powered insight generation (mock for now)
                const mockInsights = [
                    {
                        insight_type: "best_posting_time",
                        title: "Optimal Posting Window",
                        description: "Your audience is most active between 6-8 PM EST. Consider scheduling posts for this window.",
                        action_suggestion: "Schedule your next video for 7 PM EST",
                        confidence_score: 0.85,
                    },
                    {
                        insight_type: "growth_opportunity",
                        title: "Trending Topic Detected",
                        description: "AI-generated content is trending +340% this week. Your audience shows high interest.",
                        action_suggestion: "Create content about AI tools",
                        confidence_score: 0.78,
                    },
                ];

                for (const insight of mockInsights) {
                    await supabase.from("ai_analytics_insights").insert({
                        user_id: user.id,
                        ...insight,
                        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    });
                }

                return new Response(
                    JSON.stringify({ success: true, insightsGenerated: mockInsights.length }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            case "dismiss_insight": {
                const { insightId } = await req.json();
                await supabase
                    .from("ai_analytics_insights")
                    .update({ is_dismissed: true })
                    .eq("id", insightId)
                    .eq("user_id", user.id);

                return new Response(
                    JSON.stringify({ success: true }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            default:
                return new Response(
                    JSON.stringify({ error: `Unknown action: ${action}` }),
                    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
        }
    } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        return new Response(
            JSON.stringify({ error: message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
