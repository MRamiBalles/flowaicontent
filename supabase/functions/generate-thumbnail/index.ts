import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createErrorResponse } from "../_shared/error-sanitizer.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const actionSchema = z.enum(["get_templates", "generate", "get_my_generations"]);
const generateSchema = z.object({
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(1000).optional(),
    templateId: z.string().uuid().optional(),
    stylePreset: z.enum(["vibrant", "minimal", "dramatic", "retro", "neon", "professional"]).optional(),
    customPrompt: z.string().trim().max(500).optional(),
});

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
                status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const body = await req.json();
        const actionResult = actionSchema.safeParse(body.action);
        if (!actionResult.success) {
            return new Response(JSON.stringify({ error: "Invalid action" }), {
                status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const action = actionResult.data;

        switch (action) {
            case "get_templates": {
                const { data: templates } = await supabase
                    .from("thumbnail_templates")
                    .select("*")
                    .eq("is_active", true)
                    .order("usage_count", { ascending: false });

                return new Response(
                    JSON.stringify({ success: true, templates }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            case "generate": {
                const validation = generateSchema.safeParse(body);
                if (!validation.success) {
                    return new Response(JSON.stringify({
                        error: "Validation failed",
                        details: validation.error.issues.map(i => ({ field: i.path.join('.'), message: i.message })),
                    }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
                }

                const { title, description, templateId, stylePreset, customPrompt } = validation.data;

                let basePrompt = "";
                if (templateId) {
                    const { data: template } = await supabase
                        .from("thumbnail_templates")
                        .select("style_prompt")
                        .eq("id", templateId)
                        .single();
                    if (template) basePrompt = template.style_prompt;
                }

                const styleEnhancements: Record<string, string> = {
                    vibrant: "vibrant colors, high contrast, eye-catching",
                    minimal: "minimalist design, clean lines, lots of whitespace",
                    dramatic: "dramatic lighting, cinematic atmosphere, intense mood",
                    retro: "retro 80s aesthetic, neon accents, synthwave vibes",
                    neon: "neon glow effects, cyberpunk style, dark background",
                    professional: "professional corporate style, clean typography, trustworthy",
                };

                const fullPrompt = `Create a YouTube thumbnail (16:9 aspect ratio, 1280x720): 
Title: "${title}"
${description ? `Description: ${description}` : ""}
${basePrompt ? `Style: ${basePrompt}` : ""}
${customPrompt ? `Additional: ${customPrompt}` : ""}
${stylePreset ? `Mood: ${styleEnhancements[stylePreset] || ""}` : ""}

Requirements:
- High impact, attention-grabbing design
- Space for text overlay (don't include actual text)
- Optimized for click-through rate
- 1280x720 resolution`;

                const { data: generation, error: insertError } = await supabase
                    .from("thumbnail_generations")
                    .insert({
                        user_id: user.id, title, description,
                        template_id: templateId, custom_prompt: customPrompt,
                        style_preset: stylePreset || "vibrant", status: "generating",
                    })
                    .select().single();

                if (insertError) throw insertError;

                if (!OPENAI_API_KEY) {
                    await supabase.from("thumbnail_generations")
                        .update({ status: "failed", error_message: "Service not configured" })
                        .eq("id", generation.id);
                    return new Response(JSON.stringify({ error: "Thumbnail generation service not configured" }), {
                        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
                    });
                }

                const openaiResponse = await fetch("https://api.openai.com/v1/images/generations", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENAI_API_KEY}` },
                    body: JSON.stringify({ model: "dall-e-3", prompt: fullPrompt, n: 1, size: "1792x1024", quality: "hd" }),
                });

                const openaiData = await openaiResponse.json();

                if (openaiData.error) {
                    await supabase.from("thumbnail_generations")
                        .update({ status: "failed", error_message: "Generation failed" })
                        .eq("id", generation.id);
                    throw new Error("Image generation failed");
                }

                const imageUrl = openaiData.data?.[0]?.url;
                await supabase.from("thumbnail_generations")
                    .update({ status: "completed", image_url: imageUrl, completed_at: new Date().toISOString() })
                    .eq("id", generation.id);

                return new Response(
                    JSON.stringify({ success: true, generationId: generation.id, imageUrl }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            case "get_my_generations": {
                const { data: generations } = await supabase
                    .from("thumbnail_generations")
                    .select("*")
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false })
                    .limit(20);

                return new Response(
                    JSON.stringify({ success: true, generations }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }
        }
    } catch (e) {
        return createErrorResponse(e, corsHeaders, { functionName: "generate-thumbnail" });
    }
});
