/**
 * Edge Function: render-video
 * 
 * Triggers video rendering via Remotion Lambda (AWS) or local fallback.
 * 
 * Architecture:
 * 1. Validate auth and subscription tier
 * 2. Create render_queue entry (status: pending)
 * 3. Trigger AWS Lambda with Remotion composition
 * 4. Lambda renders video in parallel chunks
 * 5. Webhook notified on completion
 * 6. Update render_queue with result URL
 * 
 * Quality Tiers (subscription-based):
 * - free: draft (CRF 28, low quality)
 * - pro: draft, medium (CRF 23), high (CRF 18)
 * - business/enterprise: all + ultra (CRF 15, highest quality)
 * 
 * AWS Integration:
 * - Uses AWS Signature V4 for request signing
 * - Invokes Remotion Lambda function
 * - Remotion parallelizes rendering (20 frames/lambda)
 * 
 * Environment Variables:
 * - AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION
 * - REMOTION_SERVE_URL: S3 bucket with Remotion bundle
 * - REMOTION_LAMBDA_FUNCTION: Lambda function name
 * - RENDER_WEBHOOK_SECRET: For webhook verification
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AWS Lambda configuration (optional for local testing)
const AWS_ACCESS_KEY = Deno.env.get('AWS_ACCESS_KEY_ID');
const AWS_SECRET_KEY = Deno.env.get('AWS_SECRET_ACCESS_KEY');
const AWS_REGION = Deno.env.get('AWS_REGION') || 'us-east-1';
const REMOTION_SERVE_URL = Deno.env.get('REMOTION_SERVE_URL'); // S3 bucket URL
const REMOTION_LAMBDA_FUNCTION = Deno.env.get('REMOTION_LAMBDA_FUNCTION') || 'remotion-render';

/**
 * Signs an AWS request using Signature V4.
 * Simplified implementation for Lambda invocation.
 */
async function signAWSRequest(
    url: string,
    method: string,
    body: string,
    accessKey: string,
    secretKey: string,
    region: string
): Promise<{ headers: Record<string, string>; body: string }> {
    const encoder = new TextEncoder();
    const host = new URL(url).host;
    const now = new Date();

    // Format dates
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '').slice(0, 15) + 'Z';
    const dateStamp = amzDate.slice(0, 8);

    // Create canonical request
    const service = 'lambda';
    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;

    // Hash the payload
    const payloadHash = await crypto.subtle.digest('SHA-256', encoder.encode(body));
    const payloadHashHex = Array.from(new Uint8Array(payloadHash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

    const canonicalHeaders = `content-type:application/json\nhost:${host}\nx-amz-date:${amzDate}\n`;
    const signedHeaders = 'content-type;host;x-amz-date';

    const canonicalRequest = [
        method,
        new URL(url).pathname,
        '',
        canonicalHeaders,
        signedHeaders,
        payloadHashHex
    ].join('\n');

    // Create string to sign
    const canonicalRequestHash = await crypto.subtle.digest('SHA-256', encoder.encode(canonicalRequest));
    const canonicalRequestHashHex = Array.from(new Uint8Array(canonicalRequestHash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

    const stringToSign = [
        algorithm,
        amzDate,
        credentialScope,
        canonicalRequestHashHex
    ].join('\n');

    // Calculate signature
    const getSignatureKey = async (key: string, dateStamp: string, region: string, service: string) => {
        const kDate = await crypto.subtle.importKey(
            'raw',
            encoder.encode('AWS4' + key),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );
        const kDateSig = await crypto.subtle.sign('HMAC', kDate, encoder.encode(dateStamp));

        const kRegion = await crypto.subtle.importKey('raw', kDateSig, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
        const kRegionSig = await crypto.subtle.sign('HMAC', kRegion, encoder.encode(region));

        const kService = await crypto.subtle.importKey('raw', kRegionSig, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
        const kServiceSig = await crypto.subtle.sign('HMAC', kService, encoder.encode(service));

        const kSigning = await crypto.subtle.importKey('raw', kServiceSig, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
        return kSigning;
    };

    const signingKey = await getSignatureKey(secretKey, dateStamp, region, service);
    const signature = await crypto.subtle.sign('HMAC', signingKey, encoder.encode(stringToSign));
    const signatureHex = Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

    const authorizationHeader = `${algorithm} Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signatureHex}`;

    return {
        headers: {
            'Content-Type': 'application/json',
            'X-Amz-Date': amzDate,
            'Authorization': authorizationHeader
        },
        body
    };
}

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

                // Prepare render input for Remotion Lambda
                const renderInput = {
                    serveUrl: REMOTION_SERVE_URL,
                    composition: 'VideoProject',
                    inputProps: {
                        project: {
                            id: fullProject.id,
                            name: fullProject.name,
                            width: fullProject.width,
                            height: fullProject.height,
                            fps: fullProject.fps,
                            durationFrames: fullProject.duration_frames
                        },
                        tracks: fullProject.tracks || [],
                        clips: fullProject.clips || [],
                        keyframes: fullProject.keyframes || [],
                        transitions: fullProject.transitions || []
                    },
                    codec: 'h264',
                    crf: quality === 'ultra' ? 15 : quality === 'high' ? 18 : quality === 'medium' ? 23 : 28,
                    jpegQuality: 90,
                    outName: `project_${project_id}_${Date.now()}.${format}`,
                    // Webhook for completion notification
                    webhook: {
                        url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/render-webhook`,
                        secret: Deno.env.get('RENDER_WEBHOOK_SECRET') || 'default-secret',
                        customData: {
                            render_id: renderJob.id,
                            project_id: project_id,
                            user_id: user.id
                        }
                    },
                    // Lambda-specific settings
                    framesPerLambda: 20,
                    concurrencyPerLambda: 1,
                    downloadBehavior: {
                        type: 'download',
                        fileName: `flowai_export_${project_id}.${format}`
                    }
                };

                // Call Remotion Lambda renderMediaOnLambda equivalent
                // Using Remotion's render API endpoint
                const lambdaEndpoint = `https://lambda.${AWS_REGION}.amazonaws.com/2015-03-31/functions/${REMOTION_LAMBDA_FUNCTION}/invocations`;

                // Sign request with AWS Signature V4
                const signedRequest = await signAWSRequest(
                    lambdaEndpoint,
                    'POST',
                    JSON.stringify({ type: 'start', payload: renderInput }),
                    AWS_ACCESS_KEY,
                    AWS_SECRET_KEY,
                    AWS_REGION
                );

                const lambdaResponse = await fetch(lambdaEndpoint, {
                    method: 'POST',
                    headers: signedRequest.headers,
                    body: signedRequest.body
                });

                if (!lambdaResponse.ok) {
                    const errorText = await lambdaResponse.text();
                    throw new Error(`Lambda invocation failed: ${errorText}`);
                }

                const lambdaResult = await lambdaResponse.json();
                console.log('Lambda render started:', lambdaResult);

                // Store Lambda render ID for tracking
                await supabase
                    .from('render_queue')
                    .update({
                        external_render_id: lambdaResult.renderId
                    })
                    .eq('id', renderJob.id);

            } catch (lambdaError) {
                console.error('Lambda trigger failed:', lambdaError);

                // Update status to failed
                await supabase
                    .from('render_queue')
                    .update({
                        status: 'failed',
                        error_message: lambdaError instanceof Error ? lambdaError.message : 'Unknown error'
                    })
                    .eq('id', renderJob.id);

                await supabase
                    .from('video_projects')
                    .update({ render_status: 'failed' })
                    .eq('id', project_id);
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
