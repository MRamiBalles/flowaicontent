import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Platform OAuth configs (in production, use secrets)
const PLATFORM_CONFIGS = {
    youtube: { name: "YouTube", icon: "📺", color: "#FF0000" },
    tiktok: { name: "TikTok", icon: "🎵", color: "#000000" },
    instagram: { name: "Instagram", icon: "📸", color: "#E4405F" },
    twitter: { name: "Twitter/X", icon: "🐦", color: "#1DA1F2" },
    facebook: { name: "Facebook", icon: "📘", color: "#1877F2" },
    linkedin: { name: "LinkedIn", icon: "💼", color: "#0A66C2" },
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

        const { action, ...params } = await req.json();

        switch (action) {
            case "get_platforms": {
                return new Response(
                    JSON.stringify({ success: true, platforms: PLATFORM_CONFIGS }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            case "get_connected": {
                const { data: connected } = await supabase
                    .from("connected_platforms")
                    .select("*")
                    .eq("user_id", user.id)
                    .eq("is_active", true);

                return new Response(
                    JSON.stringify({ success: true, connected }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            case "connect_platform": {
                const { platform, accessToken, username } = params;

                // In production, this would handle OAuth flow
                // For now, simulate connection
                const { data: connection, error } = await supabase
                    .from("connected_platforms")
                    .upsert({
                        user_id: user.id,
                        platform,
                        access_token: accessToken || "mock_token_" + Date.now(),
                        platform_username: username || user.email?.split("@")[0],
                        platform_user_id: "user_" + Date.now(),
                        is_active: true,
                        last_synced_at: new Date().toISOString(),
                    }, { onConflict: "user_id,platform,platform_user_id" })
                    .select()
                    .single();

                if (error) throw error;

                return new Response(
                    JSON.stringify({ success: true, connection }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            case "disconnect_platform": {
                const { platformId } = params;

                await supabase
                    .from("connected_platforms")
                    .update({ is_active: false })
                    .eq("id", platformId)
                    .eq("user_id", user.id);

                return new Response(
                    JSON.stringify({ success: true }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            case "create_post": {
                const { title, description, contentUrl, contentType, targetPlatforms, scheduledAt, platformSettings } = params;

                const { data: post, error } = await supabase
                    .from("syndication_posts")
                    .insert({
                        user_id: user.id,
                        title,
                        description,
                        content_url: contentUrl,
                        content_type: contentType,
                        target_platforms: targetPlatforms,
                        platform_settings: platformSettings || {},
                        scheduled_at: scheduledAt,
                        is_scheduled: !!scheduledAt,
                        status: scheduledAt ? "scheduled" : "draft",
                    })
                    .select()
                    .single();

                if (error) throw error;

                return new Response(
                    JSON.stringify({ success: true, post }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            case "publish_now": {
                const { postId } = params;

                // Get post
                const { data: post } = await supabase
                    .from("syndication_posts")
                    .select("*")
                    .eq("id", postId)
                    .eq("user_id", user.id)
                    .single();

                if (!post) throw new Error("Post not found");

                // Get connected platforms
                const { data: platforms } = await supabase
                    .from("connected_platforms")
                    .select("*")
                    .eq("user_id", user.id)
                    .in("platform", post.target_platforms)
                    .eq("is_active", true);

                const results: Record<string, { success: boolean; url?: string; error?: string }> = {};

                // Simulate publishing to each platform
                for (const platform of platforms || []) {
                    // In production, call actual APIs here
                    results[platform.platform] = {
                        success: true,
                        url: `https://${platform.platform}.com/post/${Date.now()}`,
                    };

                    // Create post-platform record
                    await supabase.from("syndication_post_platforms").insert({
                        post_id: postId,
                        platform_id: platform.id,
                        status: "published",
                        platform_post_id: "post_" + Date.now(),
                        platform_post_url: results[platform.platform].url,
                        published_at: new Date().toISOString(),
                    });
                }

                // Update post status
                await supabase
                    .from("syndication_posts")
                    .update({
                        status: "published",
                        publish_results: results,
                        published_at: new Date().toISOString(),
                    })
                    .eq("id", postId);

                return new Response(
                    JSON.stringify({ success: true, results }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            case "get_my_posts": {
                const { data: posts } = await supabase
                    .from("syndication_posts")
                    .select("*")
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false })
                    .limit(20);

                return new Response(
                    JSON.stringify({ success: true, posts }),
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
