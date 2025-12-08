// Co-Stream Edge Function
// Manages AI companions for live streaming

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CoStreamRequest {
    action:
    | 'create_companion'
    | 'list_companions'
    | 'start_session'
    | 'end_session'
    | 'send_message'
    | 'generate_ai_response'
    | 'get_session_stats';
    data?: Record<string, unknown>;
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

        const body: CoStreamRequest = await req.json();
        const { action, data } = body;

        switch (action) {
            case 'create_companion': {
                if (!data?.name || !data?.personality) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'name and personality required'
                    }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                const { data: companion, error } = await supabase
                    .from('ai_stream_companions')
                    .insert({
                        user_id: user.id,
                        name: data.name as string,
                        personality: data.personality as string,
                        avatar_url: data.avatar_url as string,
                        voice_id: data.voice_id as string,
                        custom_knowledge: data.custom_knowledge || [],
                    })
                    .select()
                    .single();

                if (error) throw error;

                return new Response(JSON.stringify({
                    success: true,
                    companion,
                }), {
                    status: 201,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            case 'list_companions': {
                const { data: companions, error } = await supabase
                    .from('ai_stream_companions')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                return new Response(JSON.stringify({
                    success: true,
                    companions,
                }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            case 'start_session': {
                if (!data?.companion_id) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'companion_id required'
                    }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                const result = await supabase.rpc('start_costream_session', {
                    p_companion_id: data.companion_id as string,
                    p_title: data.title as string,
                    p_platform: (data.platform as string) || 'custom',
                });

                if (result.error) throw result.error;

                return new Response(JSON.stringify(result.data), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            case 'end_session': {
                if (!data?.session_id) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'session_id required'
                    }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                const result = await supabase.rpc('end_costream_session', {
                    p_session_id: data.session_id as string,
                });

                if (result.error) throw result.error;

                return new Response(JSON.stringify(result.data), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            case 'send_message': {
                if (!data?.session_id || !data?.message) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'session_id and message required'
                    }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                const { data: msg, error } = await supabase
                    .from('stream_chat_messages')
                    .insert({
                        session_id: data.session_id as string,
                        sender_type: (data.sender_type as string) || 'streamer',
                        sender_id: user.id,
                        sender_name: data.sender_name || user.email?.split('@')[0] || 'Streamer',
                        message: data.message as string,
                    })
                    .select()
                    .single();

                if (error) throw error;

                // Update session message count
                await supabase
                    .from('costream_sessions')
                    .update({ total_messages: supabase.rpc('increment', { x: 1 }) })
                    .eq('id', data.session_id);

                return new Response(JSON.stringify({
                    success: true,
                    message: msg,
                }), {
                    status: 201,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            case 'generate_ai_response': {
                if (!data?.session_id || !data?.prompt) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'session_id and prompt required'
                    }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                const startTime = Date.now();

                // Get session and companion
                const { data: session } = await supabase
                    .from('costream_sessions')
                    .select('*, companion:companion_id(*)')
                    .eq('id', data.session_id)
                    .single();

                if (!session) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Session not found'
                    }), {
                        status: 404,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                // Get recent context
                const { data: recentMessages } = await supabase
                    .from('stream_chat_messages')
                    .select('sender_name, message')
                    .eq('session_id', data.session_id)
                    .order('created_at', { ascending: false })
                    .limit(session.companion?.context_memory_size || 10);

                // Build context
                const context = (recentMessages || [])
                    .reverse()
                    .map(m => `${m.sender_name}: ${m.message}`)
                    .join('\n');

                // Build personality prompt
                const personality = session.companion?.personality || 'friendly';
                const systemPrompt = `You are ${session.companion?.name}, an AI streaming companion with a ${personality} personality. 
Keep responses ${session.companion?.response_length || 'medium'} length.
Humor level: ${session.companion?.humor_level}/10.
Formality: ${session.companion?.formality_level}/10.
Custom knowledge: ${JSON.stringify(session.companion?.custom_knowledge || [])}

Respond naturally as if you're part of a live stream chat.`;

                // Generate response using OpenAI (mock for now - would integrate with actual AI)
                // In production, this would call OpenAI or similar
                const mockResponses: Record<string, string[]> = {
                    friendly: [
                        "Hey there! Great to see you in the chat! 😊",
                        "That's an awesome question! Let me think...",
                        "Haha, you always bring the good vibes!",
                    ],
                    sarcastic: [
                        "Oh wow, what a totally original question... 😏",
                        "Sure, let me just consult my crystal ball real quick.",
                        "That's... certainly a take. A hot take, even.",
                    ],
                    educational: [
                        "Great question! Let me explain that in detail...",
                        "Actually, there's some interesting context here...",
                        "Fun fact: the science behind that is fascinating!",
                    ],
                    hype: [
                        "LET'S GOOOOO! 🔥🔥🔥",
                        "THAT WAS INSANE! DID YOU SEE THAT?!",
                        "W CHAT! W STREAM! W EVERYTHING!",
                    ],
                };

                const responses = mockResponses[personality] || mockResponses.friendly;
                const aiResponse = responses[Math.floor(Math.random() * responses.length)];

                const latency = Date.now() - startTime;

                // Save AI response
                const { data: msg, error } = await supabase
                    .from('stream_chat_messages')
                    .insert({
                        session_id: data.session_id as string,
                        sender_type: 'ai',
                        sender_name: session.companion?.name || 'AI',
                        message: aiResponse,
                        is_ai_response: true,
                        ai_model: 'gpt-4',
                        ai_latency_ms: latency,
                    })
                    .select()
                    .single();

                if (error) throw error;

                // Update session AI response count
                await supabase
                    .from('costream_sessions')
                    .update({ ai_responses: supabase.rpc('increment', { x: 1 }) })
                    .eq('id', data.session_id);

                return new Response(JSON.stringify({
                    success: true,
                    message: msg,
                    latency_ms: latency,
                }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            case 'get_session_stats': {
                if (!data?.session_id) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'session_id required'
                    }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                const { data: session, error } = await supabase
                    .from('costream_sessions')
                    .select('*, analytics:stream_analytics(*), companion:companion_id(name, avatar_url)')
                    .eq('id', data.session_id)
                    .single();

                if (error) throw error;

                return new Response(JSON.stringify({
                    success: true,
                    session,
                }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            default:
                return new Response(JSON.stringify({
                    success: false,
                    error: `Unknown action: ${action}`
                }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
        }

    } catch (error) {
        console.error('CoStream error:', error);
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
