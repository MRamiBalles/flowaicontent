/**
 * generate-subtitles/index.ts
 * 
 * AI-powered subtitle generation using OpenAI Whisper.
 * Transcribes audio and creates text clips on the video timeline.
 * 
 * @module functions/generate-subtitles
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
// MAIN HANDLER
// ============================================================

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // Initialize Supabase admin client
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // ==================== AUTHENTICATION ====================
        // Verify JWT from Authorization header
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            throw new Error('Missing Authorization header');
        }
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) throw new Error('Invalid token');

        // ==================== REQUEST PARSING ====================
        const { audioUrl, projectId, trackId } = await req.json();

        if (!audioUrl || !projectId || !trackId) {
            throw new Error('Missing required fields: audioUrl, projectId, trackId');
        }

        console.log(`Transcribing audio from ${audioUrl} for project ${projectId}`);

        // ==================== WHISPER API CALL ====================
        // TODO: In production, implement actual Whisper API call:
        // 1. Download audio file from storage
        // 2. Send to https://api.openai.com/v1/audio/transcriptions
        // 3. Parse response with timestamps

        // For now, mock transcription response
        const mockTranscription = {
            segments: [
                { start: 0, end: 3, text: "Welcome to FlowAI video editor." },
                { start: 3.5, end: 6, text: "This is a demo of AI subtitles." },
                { start: 7, end: 10, text: "It automatically syncs with your audio." },
            ]
        };

        // ==================== CREATE SUBTITLE CLIPS ====================
        // Convert time-based segments to frame-based clips
        const fps = 30;
        const clipsToInsert = mockTranscription.segments.map(seg => ({
            track_id: trackId,
            clip_type: 'text',
            start_frame: Math.round(seg.start * fps),
            end_frame: Math.round(seg.end * fps),
            text_content: seg.text,
        }));

        const { data: insertedClips, error: insertError } = await supabaseAdmin
            .from('video_clips')
            .insert(clipsToInsert)
            .select();

        if (insertError) throw insertError;

        return new Response(
            JSON.stringify({
                success: true,
                clips: insertedClips
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        // Safely extract error message
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return new Response(
            JSON.stringify({
                success: false,
                error: errorMessage
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
