/**
 * Edge Function: text-to-speech
 * 
 * Generates audio from text using a cloned voice via ElevenLabs API.
 * 
 * Credit System:
 * - Charged per character (~1 credit/character)
 * - Monthly limits by tier:
 *   - pro: 30 minutes (1800 seconds)
 *   - business: 2 hours (7200 seconds)
 *   - enterprise: 8+ hours (28800+ seconds)
 * 
 * Workflow:
 * 1. Validate user owns voice_id
 * 2. Check monthly credit limit
 * 3. Call ElevenLabs TTS API
 * 4. Upload generated audio to Supabase Storage
 * 5. Record generation in voice_generations table
 * 6. Deduct credits from monthly balance
 * 
 * Models Available:
 * - eleven_multilingual_v2: 29 languages (default)
 * - eleven_turbo_v2: Faster, lower latency
 * - eleven_monolingual_v1: English only, higher quality
 * 
 * Voice Settings:
 * - stability: 0.0-1.0 (consistency vs expressiveness)
 * - similarity_boost: 0.0-1.0 (how close to original voice)
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TTSRequest {
    voice_id: string; // FlowAI voice clone ID
    text: string;
    model?: 'eleven_multilingual_v2' | 'eleven_turbo_v2' | 'eleven_monolingual_v1';
    output_format?: 'mp3_44100_128' | 'mp3_22050_32' | 'pcm_16000' | 'pcm_22050';
    stability?: number;         // 0.0-1.0
    similarity_boost?: number;  // 0.0-1.0
}

interface TTSResponse {
    success: boolean;
    audio_url?: string;         // Supabase Storage URL
    duration_seconds?: number;   // Estimated duration
    credits_consumed?: number;   // Characters charged
    error?: string;
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Validate API key is configured
        if (!ELEVENLABS_API_KEY) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Text-to-speech service not configured'
            }), {
                status: 503,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Validate authorization
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Authorization header required'
            }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Initialize Supabase client
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        // Verify user token
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Invalid or expired token'
            }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Parse request body
        const body: TTSRequest = await req.json();
        const {
            voice_id,
            text,
            model = 'eleven_multilingual_v2',
            output_format = 'mp3_44100_128',
            stability,
            similarity_boost
        } = body;

        // Validate required fields
        if (!voice_id) {
            return new Response(JSON.stringify({
                success: false,
                error: 'voice_id is required'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        if (!text || text.trim().length === 0) {
            return new Response(JSON.stringify({
                success: false,
                error: 'text is required'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Text length limits
        const maxCharacters = 5000;
        if (text.length > maxCharacters) {
            return new Response(JSON.stringify({
                success: false,
                error: `Text too long. Maximum ${maxCharacters} characters allowed.`
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Get voice clone and verify ownership
        const { data: voiceClone, error: voiceError } = await supabase
            .from('voice_clones')
            .select('*')
            .eq('id', voice_id)
            .eq('user_id', user.id)
            .eq('status', 'active')
            .single();

        if (voiceError || !voiceClone) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Voice not found or access denied'
            }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Check voice credits
        const { data: credits, error: creditsError } = await supabase
            .from('voice_credits')
            .select('*')
            .eq('user_id', user.id)
            .single();

        // Estimate credits needed (approximately 1 credit per character)
        const estimatedCredits = Math.ceil(text.length);

        if (!credits) {
            return new Response(JSON.stringify({
                success: false,
                error: 'No voice credits available. Please upgrade your subscription.'
            }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Check monthly limit
        const monthlyRemaining = credits.monthly_limit - credits.monthly_used;
        if (monthlyRemaining < estimatedCredits) {
            return new Response(JSON.stringify({
                success: false,
                error: `Monthly voice generation limit reached. ${monthlyRemaining} characters remaining. Limit resets on the 1st of next month.`
            }), {
                status: 429,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        console.log(`Processing TTS request for user ${user.id}: ${text.length} characters`);

        // Call ElevenLabs TTS API
        const ttsResponse = await fetch(
            `${ELEVENLABS_API_URL}/text-to-speech/${voiceClone.elevenlabs_voice_id}?output_format=${output_format}`,
            {
                method: 'POST',
                headers: {
                    'xi-api-key': ELEVENLABS_API_KEY,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text.trim(),
                    model_id: model,
                    voice_settings: {
                        stability: stability ?? voiceClone.stability ?? 0.5,
                        similarity_boost: similarity_boost ?? voiceClone.similarity_boost ?? 0.75,
                    },
                }),
            }
        );

        if (!ttsResponse.ok) {
            const errorText = await ttsResponse.text();
            console.error('ElevenLabs TTS error:', errorText);

            if (ttsResponse.status === 400) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Invalid text content. Please check for unsupported characters.'
                }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            if (ttsResponse.status === 429) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Voice generation rate limit exceeded. Please try again in a moment.'
                }), {
                    status: 429,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            throw new Error(`ElevenLabs TTS error: ${errorText}`);
        }

        // Get audio as binary
        const audioBuffer = await ttsResponse.arrayBuffer();

        // Estimate duration (rough: ~150 words per minute, ~5 chars per word)
        const estimatedDuration = (text.length / 5) / 150 * 60; // seconds

        // Upload audio to Supabase Storage
        const timestamp = Date.now();
        const storagePath = `${user.id}/${voiceClone.id}_${timestamp}.mp3`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('generated-audio')
            .upload(storagePath, audioBuffer, {
                contentType: 'audio/mpeg',
                cacheControl: '3600',
            });

        if (uploadError) {
            console.error('Storage upload error:', uploadError);
            throw new Error(`Failed to save audio: ${uploadError.message}`);
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('generated-audio')
            .getPublicUrl(uploadData.path);

        // Record generation in database
        const { error: genError } = await supabase
            .from('voice_generations')
            .insert({
                user_id: user.id,
                voice_clone_id: voiceClone.id,
                input_text: text,
                output_audio_url: publicUrl,
                duration_seconds: estimatedDuration,
                character_count: text.length,
                credits_consumed: estimatedCredits,
                model_used: model,
                output_format: 'mp3',
            });

        if (genError) {
            console.error('Generation record error:', genError);
            // Non-fatal, continue
        }

        // Update credits used
        const { error: creditError } = await supabase
            .from('voice_credits')
            .update({
                monthly_used: credits.monthly_used + estimatedCredits,
                updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id);

        if (creditError) {
            console.error('Credit update error:', creditError);
            // Non-fatal, continue
        }

        // Update voice clone usage stats
        await supabase
            .from('voice_clones')
            .update({
                credits_used: voiceClone.credits_used + estimatedCredits,
                total_generations: voiceClone.total_generations + 1,
                updated_at: new Date().toISOString(),
            })
            .eq('id', voiceClone.id);

        console.log(`TTS generation complete: ${publicUrl}`);

        const response: TTSResponse = {
            success: true,
            audio_url: publicUrl,
            duration_seconds: estimatedDuration,
            credits_consumed: estimatedCredits,
        };

        return new Response(JSON.stringify(response), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('TTS error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error occurred';

        return new Response(JSON.stringify({
            success: false,
            error: message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
