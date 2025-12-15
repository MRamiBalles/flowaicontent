import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { projectSchema } from "@/lib/validations";
import { detectPromptInjection } from "@/lib/ai-sanitization";
import { useGamification } from "@/hooks/useGamification";

// Generated content format returned by AI
// Each platform gets optimized content based on platform limits/style
export interface GeneratedContent {
    twitter: string;      // Max 280 chars, concise, hashtags
    linkedin: string;    // Professional tone, 1-2 paragraphs
    instagram: string;   // Casual, emoji-friendly, hashtags
}

/**
 * useDashboardLogic - Main dashboard state and business logic
 * 
 * Manages:
 * - User authentication and session
 * - Content generation workflow (create project → call AI → poll status)
 * - Rate limiting (10 generations/hour for free tier)
 * - Gamification (XP, streaks)
 * - Admin role checking
 * 
 * Content Generation Flow:
 * 1. User submits title + content
 * 2. Creates project record in DB
 * 3. Calls Edge Function (generate-content) which queues async job
 * 4. Polls generation_jobs table every 2s for completion
 * 5. Edge Function saves results to generated_content table
 * 6. Returns results to UI and increments rate limit counter
 * 
 * Rate Limiting:
 * - Free tier: 10/hour (enforced by RLS on generation_attempts)
 * - Counts are queried from last 60 minutes
 * - Cron job resets counters hourly
 */
export const useDashboardLogic = () => {
    const navigate = useNavigate();
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [generationCount, setGenerationCount] = useState(0); // Current hour's generation count
    const [isAdmin, setIsAdmin] = useState(false);

    // Gamification: Awards XP for actions like generating content
    // See useGamification.ts for level-up logic
    const { streak, level, xp, xpToNextLevel, performAction } = useGamification();

    // Auth state management
    // Redirects to /auth if no session, otherwise fetches user data
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                navigate("/auth");
            } else {
                setUser(session.user);
                fetchGenerationCount(session.user.id);
                checkAdmin(session.user.id);
            }
        });

        // Listen for auth changes (login/logout) and update UI
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (!session) {
                navigate("/auth");
            } else {
                setUser(session.user);
                fetchGenerationCount(session.user.id);
                checkAdmin(session.user.id);
            }
        });

        return () => subscription.unsubscribe();
    }, [navigate]);

    /**
     * Check if user has admin role
     * 
     * Admin users see additional UI elements (admin dashboard link, etc.)
     * Role is stored in user_roles table with RLS policies
     */
    const checkAdmin = async (userId: string) => {
        const { data } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", userId)
            .eq("role", "admin")
            .maybeSingle();

        setIsAdmin(!!data);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/auth");
    };

    /**
     * Fetch generation count for current hour
     * 
     * Rate limiting: Free tier allows 10 generations per hour
     * Counter is based on generation_attempts table filtered by timestamp
     * Hourly reset handled by backend cron job
     * 
     * @param userId - Current user's ID
     */
    const fetchGenerationCount = async (userId: string) => {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

        const { count, error } = await supabase
            .from("generation_attempts")
            .select("*", { count: 'exact', head: true })
            .eq("user_id", userId)
            .gte("created_at", oneHourAgo);

        if (!error && count !== null) {
            setGenerationCount(count);
        }
    };

    const handleNewProject = () => {
        setSelectedProjectId(null);
        setGeneratedContent(null);
    };

    const pollJobStatus = async (jobId: string, projectId: string): Promise<GeneratedContent> => {
        const MAX_RETRIES = 30; // 30 attempts * 2s = 60s max wait
        const POLL_INTERVAL = 2000;

        for (let i = 0; i < MAX_RETRIES; i++) {
            const { data: job, error } = await supabase
                .from('generation_jobs')
                .select('status, result, error')
                .eq('id', jobId)
                .single();

            if (error) throw new Error('Failed to check job status');

            if (job.status === 'completed' && job.result) {
                const result = job.result as unknown as GeneratedContent;
                if (result.twitter && result.linkedin && result.instagram) {
                    return result;
                }
                throw new Error('Invalid result format');
            }

            if (job.status === 'failed') {
                throw new Error(job.error || 'Generation failed');
            }

            // Still processing, wait
            await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
        }

        throw new Error('Generation timed out');
    };

    const handleGenerate = async (title: string, content: string) => {
        setLoading(true);

        try {
            const validated = projectSchema.parse({ title, content });

            // 1. Create Project
            const { data: project, error: projectError } = await supabase
                .from("projects")
                .insert({
                    user_id: user.id,
                    title: validated.title,
                    original_text: validated.content,
                })
                .select()
                .single();

            if (projectError) throw projectError;

            // 2. Start Generation Job
            const injectionCheck = detectPromptInjection(content);
            if (injectionCheck.isInjection) {
                console.warn("Potential prompt injection detected:", injectionCheck.patterns);
                toast.warning("Your input contains patterns that may not process correctly.");
            }

            const { data: jobData, error: fnError } = await supabase.functions.invoke('generate-content', {
                body: { title, content, projectId: project.id }
            });

            if (fnError) throw new Error(fnError.message || 'Failed to start generation');
            if (jobData?.error) throw new Error(jobData.error);

            // 3. Poll for Completion of Job
            const jobId = jobData.jobId;
            if (!jobId) throw new Error('No job ID returned');

            toast.info("AI is processing your content...");
            const generated = await pollJobStatus(jobId, project.id);

            setGeneratedContent(generated);
            fetchGenerationCount(user.id);

            // Gamification Action
            performAction('generate');

            // 4. Content is already saved by the Edge Function to `generated_content`
            // We just need to update the UI state.

            setSelectedProjectId(project.id);
            toast.success("Content generated successfully!");
        } catch (error: any) {
            console.error('Generation error:', error);
            if (error.message?.includes('Rate limit exceeded') || error.message?.includes('429')) {
                toast.error("You've reached the limit of 10 generations per hour. Please try again later.");
            } else if (error.message?.includes('402')) {
                toast.error("AI service requires payment. Please contact support.");
            } else {
                toast.error(error.message || "Failed to generate content");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRemix = async (platform: string, content: string) => {
        toast.info(`Remixing ${platform} content... (Simulation)`);
        // In a real app, this would call the AI again with a "variation" prompt
        performAction('remix');
    };

    const loadProjectContent = async (projectId: string) => {
        try {
            const { data, error } = await supabase
                .from("generated_content")
                .select("platform, content_text")
                .eq("project_id", projectId);

            if (error) throw error;

            if (data && data.length > 0) {
                const content: any = {};
                data.forEach((item) => {
                    content[item.platform] = item.content_text;
                });
                setGeneratedContent(content);
            }
        } catch (error: any) {
            toast.error("Failed to load project content");
        }
    };

    const handleSelectProject = (projectId: string | null) => {
        setSelectedProjectId(projectId);
        if (projectId) {
            loadProjectContent(projectId);
        } else {
            setGeneratedContent(null);
        }
    };

    return {
        user,
        isAdmin,
        loading,
        selectedProjectId,
        generatedContent,
        generationCount,
        gamification: { streak, level, xp, xpToNextLevel },
        handleLogout,
        handleNewProject,
        handleGenerate,
        handleRemix,
        handleSelectProject,
    };
};
