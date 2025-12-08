// Interactive Stories Edge Function
// Manages branching video experiences

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InteractiveRequest {
    action:
    | 'get_story'
    | 'start_story'
    | 'make_choice'
    | 'get_progress'
    | 'save_checkpoint'
    | 'load_checkpoint'
    | 'get_analytics';
    data?: Record<string, unknown>;
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get('Authorization');
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        // Verify user if auth header present
        let userId: string | null = null;
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user } } = await supabase.auth.getUser(token);
            userId = user?.id || null;
        }

        const body: InteractiveRequest = await req.json();
        const { action, data } = body;

        switch (action) {
            case 'get_story': {
                if (!data?.story_id) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'story_id required'
                    }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                // Get full story tree
                const { data: storyTree, error } = await supabase
                    .rpc('get_story_tree', { p_story_id: data.story_id });

                if (error) throw error;

                // Increment play count
                await supabase
                    .from('interactive_stories')
                    .update({ total_plays: supabase.rpc('increment', { x: 1 }) })
                    .eq('id', data.story_id);

                return new Response(JSON.stringify({
                    success: true,
                    story: storyTree,
                }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            case 'start_story': {
                if (!data?.story_id) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'story_id required'
                    }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                // Get intro scene
                const { data: introScene, error } = await supabase
                    .from('story_scenes')
                    .select('*, choices:scene_choices(*)')
                    .eq('story_id', data.story_id)
                    .eq('scene_type', 'intro')
                    .order('scene_order')
                    .limit(1)
                    .single();

                if (error) {
                    // Fallback to first scene
                    const { data: firstScene } = await supabase
                        .from('story_scenes')
                        .select('*, choices:scene_choices(*)')
                        .eq('story_id', data.story_id)
                        .order('scene_order')
                        .limit(1)
                        .single();

                    if (!firstScene) {
                        return new Response(JSON.stringify({
                            success: false,
                            error: 'Story has no scenes'
                        }), {
                            status: 404,
                            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                        });
                    }

                    return new Response(JSON.stringify({
                        success: true,
                        scene: firstScene,
                    }), {
                        status: 200,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                // Create/update progress if user is logged in
                if (userId) {
                    await supabase
                        .from('player_progress')
                        .upsert({
                            user_id: userId,
                            story_id: data.story_id,
                            current_scene_id: introScene.id,
                            scenes_visited: [introScene.id],
                            last_played_at: new Date().toISOString(),
                        }, { onConflict: 'user_id,story_id' });
                }

                return new Response(JSON.stringify({
                    success: true,
                    scene: introScene,
                }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            case 'make_choice': {
                if (!data?.story_id || !data?.scene_id || !data?.choice_id) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'story_id, scene_id, and choice_id required'
                    }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                // Use stored procedure
                const { data: result, error } = await supabase
                    .rpc('make_choice', {
                        p_story_id: data.story_id as string,
                        p_scene_id: data.scene_id as string,
                        p_choice_id: data.choice_id as string,
                        p_time_to_decide: data.time_to_decide as number,
                    });

                if (error) throw error;

                // Get next scene with choices
                if (result.success && result.next_scene) {
                    const { data: sceneWithChoices } = await supabase
                        .from('story_scenes')
                        .select('*, choices:scene_choices(*)')
                        .eq('id', result.next_scene.id)
                        .single();

                    result.next_scene = sceneWithChoices;
                }

                return new Response(JSON.stringify(result), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            case 'get_progress': {
                if (!userId) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Authentication required'
                    }), {
                        status: 401,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                const { data: progress, error } = await supabase
                    .from('player_progress')
                    .select('*, story:story_id(*), current_scene:current_scene_id(*)')
                    .eq('user_id', userId)
                    .order('last_played_at', { ascending: false });

                if (error) throw error;

                return new Response(JSON.stringify({
                    success: true,
                    progress,
                }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            case 'save_checkpoint': {
                if (!userId || !data?.story_id) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Authentication and story_id required'
                    }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                // Get current progress
                const { data: progress } = await supabase
                    .from('player_progress')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('story_id', data.story_id)
                    .single();

                if (!progress) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'No progress to save'
                    }), {
                        status: 404,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                // Add checkpoint
                const checkpoint = {
                    scene_id: progress.current_scene_id,
                    scenes_visited: progress.scenes_visited,
                    choices_made: progress.choices_made,
                    inventory: progress.inventory,
                    stats: progress.stats,
                    saved_at: new Date().toISOString(),
                    name: data.name || `Save ${(progress.checkpoints?.length || 0) + 1}`,
                };

                const checkpoints = [...(progress.checkpoints || []), checkpoint].slice(-5); // Max 5 saves

                const { error } = await supabase
                    .from('player_progress')
                    .update({ checkpoints })
                    .eq('id', progress.id);

                if (error) throw error;

                return new Response(JSON.stringify({
                    success: true,
                    checkpoint,
                }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            case 'get_analytics': {
                if (!userId || !data?.story_id) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'story_id required'
                    }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                // Verify ownership
                const { data: story } = await supabase
                    .from('interactive_stories')
                    .select('user_id')
                    .eq('id', data.story_id)
                    .single();

                if (story?.user_id !== userId) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: 'Access denied'
                    }), {
                        status: 403,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    });
                }

                // Get choice distribution
                const { data: choiceStats } = await supabase
                    .from('choice_analytics')
                    .select('choice_id, scene_id')
                    .eq('story_id', data.story_id);

                // Get completion stats
                const { data: completionStats } = await supabase
                    .from('player_progress')
                    .select('is_completed, completion_ending')
                    .eq('story_id', data.story_id);

                return new Response(JSON.stringify({
                    success: true,
                    analytics: {
                        total_choices: choiceStats?.length || 0,
                        total_players: completionStats?.length || 0,
                        completions: completionStats?.filter(p => p.is_completed).length || 0,
                        endings: completionStats?.reduce((acc, p) => {
                            if (p.completion_ending) {
                                acc[p.completion_ending] = (acc[p.completion_ending] || 0) + 1;
                            }
                            return acc;
                        }, {} as Record<string, number>),
                    },
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
        console.error('Interactive stories error:', error);
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
