import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

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
            case "get_languages": {
                const { data: languages } = await supabase
                    .from("dub_languages")
                    .select("*")
                    .eq("is_active", true)
                    .order("name");

                return new Response(
                    JSON.stringify({ success: true, languages }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            case "create_job": {
                const { sourceVideoUrl, sourceLanguage, targetLanguages, voiceCloneId } = params;

                // Estimate credits (mock duration for now)
                const estimatedDuration = 120; // Will be detected from video
                const estimatedCredits = Math.ceil(estimatedDuration * targetLanguages.length * 1.1);

                const { data: job, error } = await supabase
                    .from("video_dub_jobs")
                    .insert({
                        user_id: user.id,
                        source_video_url: sourceVideoUrl,
                        source_language: sourceLanguage,
                        target_languages: targetLanguages,
                        voice_clone_id: voiceCloneId,
                        source_duration_seconds: estimatedDuration,
                        estimated_credits: estimatedCredits,
                        status: "pending",
                    })
                    .select()
                    .single();

                if (error) throw error;

                // Start async processing (would be a separate worker in production)
                // For now, simulate progress updates
                setTimeout(async () => {
                    await supabase
                        .from("video_dub_jobs")
                        .update({ status: "transcribing", progress_percentage: 10 })
                        .eq("id", job.id);
                }, 2000);

                return new Response(
                    JSON.stringify({ success: true, job }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            case "get_job_status": {
                const { jobId } = params;

                const { data: job } = await supabase
                    .from("video_dub_jobs")
                    .select("*")
                    .eq("id", jobId)
                    .eq("user_id", user.id)
                    .single();

                return new Response(
                    JSON.stringify({ success: true, job }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            case "get_my_jobs": {
                const { data: jobs } = await supabase
                    .from("video_dub_jobs")
                    .select("*")
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false })
                    .limit(20);

                return new Response(
                    JSON.stringify({ success: true, jobs }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            case "translate_text": {
                // Translation via OpenAI
                const { text, targetLanguage } = params;

                const response = await fetch("https://api.openai.com/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${OPENAI_API_KEY}`,
                    },
                    body: JSON.stringify({
                        model: "gpt-4o-mini",
                        messages: [
                            {
                                role: "system",
                                content: `You are a professional translator. Translate the following text to ${targetLanguage}. Maintain the original tone and style. Only output the translated text, nothing else.`,
                            },
                            { role: "user", content: text },
                        ],
                        temperature: 0.3,
                    }),
                });

                const data = await response.json();
                const translatedText = data.choices?.[0]?.message?.content || "";

                return new Response(
                    JSON.stringify({ success: true, translatedText }),
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
