import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ProjectSidebar } from "@/components/ProjectSidebar";
import { ContentInput } from "@/components/ContentInput";
import { ContentResults } from "@/components/ContentResults";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { projectSchema } from "@/lib/validations";
import { detectPromptInjection } from "@/lib/ai-sanitization";
import { Shield, LogOut } from "lucide-react";

interface GeneratedContent {
  twitter: string;
  linkedin: string;
  instagram: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [generationCount, setGenerationCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

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
    // Detect potential prompt injection attempts
    const injectionCheck = detectPromptInjection(content);
    if (injectionCheck.isInjection) {
      console.warn("Potential prompt injection detected:", injectionCheck.patterns);
      toast.warning("Your input contains patterns that may not process correctly. Please review your content.");
    }

    // Call edge function with rate limiting
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
      // Validate inputs
      const validated = projectSchema.parse({ title, content });

      // Create project in database
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

      // Generate content with AI (includes rate limiting)
      const generated = await generateContentWithAI(
        validated.title,
        validated.content,
        project.id
      );

      setGeneratedContent(generated);

      // Update generation count
      fetchGenerationCount(user.id);

      // Save generated content to database
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

      // Handle rate limit errors
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

  if (!user) {
    return null;
  }

  const remainingGenerations = Math.max(0, 10 - generationCount);
  const rateLimitStatus = Math.min(100, (generationCount / 10) * 100);

  return (
    <div className="flex h-screen overflow-hidden flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-3 bg-background">
        <h1 className="text-lg font-semibold">ContentFlow AI</h1>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button onClick={() => navigate("/admin")} variant="outline" size="sm">
              <Shield className="mr-2 h-4 w-4" />
              Admin
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        <ProjectSidebar
          selectedProjectId={selectedProjectId}
          onSelectProject={handleSelectProject}
          onNewProject={handleNewProject}
        />

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 border-r border-border overflow-auto">
            <ContentInput onGenerate={handleGenerate} loading={loading} />
          </div>

          <div className="flex-1 overflow-auto bg-muted/30">
            <ContentResults
              content={generatedContent}
              remainingGenerations={remainingGenerations}
              rateLimitStatus={rateLimitStatus}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
