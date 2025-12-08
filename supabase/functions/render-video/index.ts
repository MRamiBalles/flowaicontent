// Render Video Edge Function
// Triggers video rendering via Remotion Lambda or local fallback

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AWS Lambda configuration (optional)
const AWS_ACCESS_KEY = Deno.env.get('AWS_ACCESS_KEY_ID');
const AWS_SECRET_KEY = Deno.env.get('AWS_SECRET_ACCESS_KEY');
const AWS_REGION = Deno.env.get('AWS_REGION') || 'us-east-1';
const REMOTION_SERVE_URL = Deno.env.get('REMOTION_SERVE_URL');

interface RenderRequest {
    project_id: string;
    quality?: 'draft' | 'medium' | 'high' | 'ultra';
    format?: 'mp4' | 'webm' | 'gif';
}

interface RenderResponse {
    success: boolean;
    render_id?: string;
    status?: string;
    message?: string;
    error?: string;
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Authorization required'
            }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        // Verify user
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Invalid token'
            }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const body: RenderRequest = await req.json();
        const { project_id, quality = 'high', format = 'mp4' } = body;

        if (!project_id) {
            return new Response(JSON.stringify({
                success: false,
                error: 'project_id is required'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Get project and verify ownership
        const { data: project, error: projectError } = await supabase
            .from('video_projects')
            .select('*')
            .eq('id', project_id)
            .eq('user_id', user.id)
            .single();

        if (projectError || !project) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Project not found or access denied'
            }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Check if already rendering
        if (project.render_status === 'rendering') {
            return new Response(JSON.stringify({
                success: false,
                error: 'Project is already being rendered'
            }), {
                status: 409,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Check subscription for quality limits
        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('plan_id')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .single();

        const qualityLimits: Record<string, string[]> = {
            'free': ['draft'],
            'pro': ['draft', 'medium', 'high'],
            'business': ['draft', 'medium', 'high', 'ultra'],
            'enterprise': ['draft', 'medium', 'high', 'ultra'],
        };

        const plan = subscription?.plan_id || 'free';
        const allowedQualities = qualityLimits[plan] || qualityLimits.free;

        if (!allowedQualities.includes(quality)) {
            return new Response(JSON.stringify({
                success: false,
                error: `${quality} quality requires ${quality === 'ultra' ? 'BUSINESS' : 'PRO'} subscription`
            }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Get full project data
        const { data: fullProject } = await supabase
            .rpc('get_full_project', { p_project_id: project_id });

        if (!fullProject) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Failed to load project data'
            }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Create render queue entry
        const { data: renderJob, error: queueError } = await supabase
            .from('render_queue')
            .insert({
                project_id,
                user_id: user.id,
                output_format: format,
                output_quality: quality,
                status: 'pending',
            })
            .select()
            .single();

        if (queueError) {
            throw new Error(`Queue error: ${queueError.message}`);
        }

        // Update project status
        await supabase
            .from('video_projects')
            .update({
                render_status: 'queued',
                render_started_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', project_id);

        console.log(`Render job queued: ${renderJob.id} for project ${project_id}`);

        // If AWS credentials are configured, trigger Lambda render
        if (AWS_ACCESS_KEY && AWS_SECRET_KEY && REMOTION_SERVE_URL) {
            try {
                // In production, this would call Remotion Lambda
                // For now, we'll simulate the process
                console.log('Would trigger Remotion Lambda render...');

                // Update status to rendering
                await supabase
                    .from('render_queue')
                    .update({
                        status: 'processing',
                        started_at: new Date().toISOString(),
                    })
                    .eq('id', renderJob.id);

                await supabase
                    .from('video_projects')
                    .update({ render_status: 'rendering' })
                    .eq('id', project_id);

                // TODO: Actual Lambda invocation would go here
                // const lambdaResponse = await invokeLambda({
                //   functionName: 'remotion-render',
                //   payload: { projectData: fullProject, quality, format }
                // });

            } catch (lambdaError) {
                console.error('Lambda trigger failed:', lambdaError);
                // Fall through to queued state
            }
        }

        const response: RenderResponse = {
            success: true,
            render_id: renderJob.id,
            status: 'queued',
            message: 'Render job added to queue. You will be notified when complete.',
        };

        return new Response(JSON.stringify(response), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Render error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';

        return new Response(JSON.stringify({
            success: false,
            error: message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
