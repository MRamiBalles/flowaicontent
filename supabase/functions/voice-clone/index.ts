// Voice Clone Edge Function
// Clones a user's voice using ElevenLabs API
// Requires PRO subscription or higher

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VoiceCloneResponse {
    success: boolean;
    voice_id?: string;
    elevenlabs_voice_id?: string;
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
            console.error('ELEVENLABS_API_KEY not configured');
            return new Response(JSON.stringify({
                success: false,
                error: 'Voice cloning service not configured'
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

        // Check subscription tier (voice cloning requires PRO or higher)
        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('plan_id, status')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .single();

        const allowedPlans = ['pro', 'business', 'enterprise'];
        if (!subscription || !allowedPlans.includes(subscription.plan_id)) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Voice cloning requires PRO subscription or higher. Please upgrade your plan.'
            }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Check voice clone limit based on plan
        const voiceLimits: Record<string, number> = {
            'pro': 3,
            'business': 10,
            'enterprise': 50
        };
        const maxVoices = voiceLimits[subscription.plan_id] || 3;

        const { count: existingVoices } = await supabase
            .from('voice_clones')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('status', 'active');

        if (existingVoices && existingVoices >= maxVoices) {
            return new Response(JSON.stringify({
                success: false,
                error: `Voice clone limit reached (${maxVoices} voices for ${subscription.plan_id} plan). Delete an existing voice or upgrade your plan.`
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Parse multipart form data
        const formData = await req.formData();
        const audioFile = formData.get('audio_file') as File | null;
        const name = formData.get('name') as string | null;
        const description = formData.get('description') as string | null;
        const language = (formData.get('language') as string) || 'en';
        const consentConfirmed = formData.get('consent_confirmed') === 'true';

        // Validate required fields
        if (!audioFile) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Audio file is required. Please upload a voice sample (minimum 30 seconds).'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        if (!name || name.trim().length < 2) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Voice name is required (minimum 2 characters)'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // CRITICAL: Consent is legally required for voice cloning
        if (!consentConfirmed) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Voice cloning consent is required. You must confirm that you own this voice or have explicit permission from the voice owner.'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Validate audio file
        const validAudioTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'audio/ogg'];
        if (!validAudioTypes.includes(audioFile.type)) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Invalid audio format. Supported formats: MP3, WAV, WebM, OGG'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Check file size (max 10MB)
        const maxSizeBytes = 10 * 1024 * 1024;
        if (audioFile.size > maxSizeBytes) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Audio file too large. Maximum size is 10MB.'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        console.log(`Processing voice clone request for user ${user.id}: ${name}`);

        // Upload audio to ElevenLabs for voice cloning
        const elevenLabsForm = new FormData();
        elevenLabsForm.append('files', audioFile, audioFile.name);
        elevenLabsForm.append('name', `flowai_${user.id.substring(0, 8)}_${name.replace(/\s+/g, '_')}`);
        elevenLabsForm.append('description', description || `FlowAI voice clone - ${name}`);

        // Add labels for organization
        elevenLabsForm.append('labels', JSON.stringify({
            platform: 'flowai',
            user_id: user.id,
            language: language
        }));

        const elevenLabsResponse = await fetch(`${ELEVENLABS_API_URL}/voices/add`, {
            method: 'POST',
            headers: {
                'xi-api-key': ELEVENLABS_API_KEY,
            },
            body: elevenLabsForm,
        });

        if (!elevenLabsResponse.ok) {
            const errorText = await elevenLabsResponse.text();
            console.error('ElevenLabs API error:', errorText);

            // Parse common errors
            if (elevenLabsResponse.status === 400) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Voice sample quality insufficient. Please provide a cleaner audio sample with at least 30 seconds of clear speech.'
                }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            if (elevenLabsResponse.status === 401) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Voice cloning service authentication failed. Please contact support.'
                }), {
                    status: 503,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            throw new Error(`ElevenLabs API error: ${errorText}`);
        }

        const elevenLabsData = await elevenLabsResponse.json();
        const elevenlabsVoiceId = elevenLabsData.voice_id;

        console.log(`ElevenLabs voice created: ${elevenlabsVoiceId}`);

        // Upload sample audio to Supabase Storage for backup
        const audioBuffer = await audioFile.arrayBuffer();
        const fileExtension = audioFile.name.split('.').pop() || 'mp3';
        const storagePath = `${user.id}/${name.replace(/\s+/g, '_')}_${Date.now()}.${fileExtension}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('voice-samples')
            .upload(storagePath, audioBuffer, {
                contentType: audioFile.type,
                upsert: false,
            });

        if (uploadError) {
            console.error('Storage upload error:', uploadError);
            // Non-fatal: continue without storage backup
        }

        // Get public URL for the sample (or use a placeholder)
        let sampleAudioUrl = '';
        if (uploadData) {
            const { data: { publicUrl } } = supabase.storage
                .from('voice-samples')
                .getPublicUrl(uploadData.path);
            sampleAudioUrl = publicUrl;
        }

        // Get client IP for consent audit trail
        const clientIp = req.headers.get('x-forwarded-for') ||
            req.headers.get('x-real-ip') ||
            'unknown';

        // Insert voice clone record into database
        const { data: voiceClone, error: dbError } = await supabase
            .from('voice_clones')
            .insert({
                user_id: user.id,
                elevenlabs_voice_id: elevenlabsVoiceId,
                name: name.trim(),
                description: description?.trim() || null,
                language,
                sample_audio_url: sampleAudioUrl || `elevenlabs://${elevenlabsVoiceId}`,
                consent_given: true,
                consent_timestamp: new Date().toISOString(),
                consent_ip_address: clientIp,
                status: 'active',
            })
            .select()
            .single();

        if (dbError) {
            console.error('Database insert error:', dbError);

            // Cleanup: delete voice from ElevenLabs if DB insert fails
            try {
                await fetch(`${ELEVENLABS_API_URL}/voices/${elevenlabsVoiceId}`, {
                    method: 'DELETE',
                    headers: { 'xi-api-key': ELEVENLABS_API_KEY },
                });
            } catch (cleanupError) {
                console.error('Failed to cleanup ElevenLabs voice:', cleanupError);
            }

            throw new Error(`Database error: ${dbError.message}`);
        }

        // Ensure user has voice credits record
        await supabase
            .from('voice_credits')
            .upsert({
                user_id: user.id,
                available_credits: subscription.plan_id === 'pro' ? 30 * 60 :
                    subscription.plan_id === 'business' ? 120 * 60 : 500 * 60, // seconds
                monthly_limit: subscription.plan_id === 'pro' ? 30 * 60 :
                    subscription.plan_id === 'business' ? 120 * 60 : 500 * 60,
            }, {
                onConflict: 'user_id',
                ignoreDuplicates: true,
            });

        console.log(`Voice clone created successfully: ${voiceClone.id}`);

        const response: VoiceCloneResponse = {
            success: true,
            voice_id: voiceClone.id,
            elevenlabs_voice_id: elevenlabsVoiceId,
        };

        return new Response(JSON.stringify(response), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Voice clone error:', error);
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
