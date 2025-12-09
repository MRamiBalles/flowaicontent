// Render Webhook Edge Function
// Receives completion callbacks from Remotion Lambda

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

const WEBHOOK_SECRET = Deno.env.get('RENDER_WEBHOOK_SECRET') || 'default-secret';

interface WebhookPayload {
    type: 'success' | 'error' | 'progress';
    renderId: string;
    bucketName?: string;
    outputFile?: string;
    outputUrl?: string;
    progress?: number;
    estimatedTimeRemaining?: number;
    errorMessage?: string;
    customData?: {
        render_id: string;
        project_id: string;
        user_id: string;
    };
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Validate webhook secret
        const webhookSecret = req.headers.get('x-webhook-secret');
        if (webhookSecret !== WEBHOOK_SECRET) {
            console.warn('Invalid webhook secret received');
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        const payload: WebhookPayload = await req.json();
        console.log('Webhook received:', payload.type, payload.renderId);

        const { customData } = payload;
        if (!customData?.render_id || !customData?.project_id) {
            return new Response(JSON.stringify({ error: 'Missing customData' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        switch (payload.type) {
            case 'progress':
                // Update render progress
                await supabase
                    .from('render_queue')
                    .update({
                        progress: payload.progress || 0,
                        estimated_completion: payload.estimatedTimeRemaining
                            ? new Date(Date.now() + payload.estimatedTimeRemaining * 1000).toISOString()
                            : null
                    })
                    .eq('id', customData.render_id);
                break;

            case 'success':
                // Upload to Supabase Storage if needed
                let finalUrl = payload.outputUrl;

                if (payload.outputUrl && payload.bucketName) {
                    try {
                        // Fetch the rendered video
                        const videoResponse = await fetch(payload.outputUrl);
                        const videoBlob = await videoResponse.blob();

                        // Upload to Supabase Storage
                        const fileName = `renders/${customData.project_id}/${Date.now()}.mp4`;
                        const { data: uploadData, error: uploadError } = await supabase.storage
                            .from('videos')
                            .upload(fileName, videoBlob, {
                                contentType: 'video/mp4',
                                upsert: true
                            });

                        if (!uploadError && uploadData) {
                            const { data: publicUrl } = supabase.storage
                                .from('videos')
                                .getPublicUrl(fileName);
                            finalUrl = publicUrl.publicUrl;
                        }
                    } catch (uploadError) {
                        console.error('Storage upload failed:', uploadError);
                        // Keep using the original URL
                    }
                }

                // Update render queue
                await supabase
                    .from('render_queue')
                    .update({
                        status: 'completed',
                        completed_at: new Date().toISOString(),
                        output_url: finalUrl,
                        progress: 100
                    })
                    .eq('id', customData.render_id);

                // Update video project
                await supabase
                    .from('video_projects')
                    .update({
                        render_status: 'completed',
                        render_completed_at: new Date().toISOString(),
                        rendered_video_url: finalUrl,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', customData.project_id);

                console.log('Render completed:', customData.project_id, finalUrl);

                // TODO: Send notification to user (email, push, etc.)
                break;

            case 'error':
                // Update render queue with error
                await supabase
                    .from('render_queue')
                    .update({
                        status: 'failed',
                        error_message: payload.errorMessage || 'Unknown render error',
                        completed_at: new Date().toISOString()
                    })
                    .eq('id', customData.render_id);

                // Update video project
                await supabase
                    .from('video_projects')
                    .update({
                        render_status: 'failed',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', customData.project_id);

                console.error('Render failed:', customData.project_id, payload.errorMessage);
                break;
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Webhook error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';

        return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
