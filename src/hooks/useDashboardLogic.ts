import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { projectSchema } from "@/lib/validations";
import { detectPromptInjection } from "@/lib/ai-sanitization";
import { useGamification } from "@/hooks/useGamification";

export interface GeneratedContent {
    twitter: string;
    linkedin: string;
    instagram: string;
}

export const useDashboardLogic = () => {
    const navigate = useNavigate();
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [generationCount, setGenerationCount] = useState(0);
    const [isAdmin, setIsAdmin] = useState(false);

    // Gamification Hook
    const { streak, level, xp, xpToNextLevel, performAction } = useGamification();

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

    const generateContentWithAI = async (
        title: string,
        content: string,
        projectId: string
    ): Promise<GeneratedContent> => {
        const injectionCheck = detectPromptInjection(content);
        if (injectionCheck.isInjection) {
            console.warn("Potential prompt injection detected:", injectionCheck.patterns);
            toast.warning("Your input contains patterns that may not process correctly. Please review your content.");
        }

        const { data, error } = await supabase.functions.invoke('generate-content', {
            body: { title, content, projectId }
        });

        if (error) {
            console.error('Edge function error:', error);
            throw new Error(error.message || 'Failed to generate content');
        }

        if (!data.success) {
            throw new Error(data.error || 'Content generation failed');
        }

        return data.content;
    };

    const handleGenerate = async (title: string, content: string) => {
        setLoading(true);

        try {
            const validated = projectSchema.parse({ title, content });

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

            const generated = await generateContentWithAI(
                validated.title,
                validated.content,
                project.id
            );

            setGeneratedContent(generated);
            fetchGenerationCount(user.id);

            // Gamification Action
            performAction('generate');

            const contentPromises = Object.entries(generated).map(([platform, text]) =>
                supabase.from("generated_content").insert({
                    project_id: project.id,
                    platform,
                    content_text: text,
                })
            );

            await Promise.all(contentPromises);

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
