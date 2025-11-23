import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ProjectSidebar } from "@/components/ProjectSidebar";
import { ContentInput } from "@/components/ContentInput";
import { ContentResults } from "@/components/ContentResults";
import { toast } from "sonner";
import { projectSchema } from "@/lib/validations";
import { sanitizeForSocialMedia, detectPromptInjection } from "@/lib/ai-sanitization";

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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleNewProject = () => {
    setSelectedProjectId(null);
    setGeneratedContent(null);
  };

  const generateMockContent = (originalText: string): GeneratedContent => {
    // Detect potential prompt injection attempts
    const injectionCheck = detectPromptInjection(originalText);
    if (injectionCheck.isInjection) {
      console.warn("Potential prompt injection detected:", injectionCheck.patterns);
      toast.warning("Your input contains patterns that may not process correctly. Please review your content.");
    }

    // Sanitize content for social media generation
    const sanitizedText = sanitizeForSocialMedia(originalText);
    const preview = sanitizedText.substring(0, 100);
    
    return {
      twitter: `1/ 🧵 Here's what you need to know:\n\n${preview}...\n\n2/ The key insight:\nThis changes everything about how we think about content creation.\n\n3/ Why it matters:\n• Saves hours of work\n• Increases engagement\n• Reaches more people\n\n4/ Action steps:\nTry this approach today and see the results.\n\n5/ What's next:\nLet me know your thoughts in the comments! 💬`,
      
      linkedin: `🚀 Here's what I learned about content transformation:\n\n${preview}...\n\n💡 Key Takeaway:\nThe most successful creators aren't just posting—they're repurposing strategically.\n\n📊 The data shows:\n• 3x more reach with multi-platform approach\n• 67% higher engagement rates\n• 50% less time spent creating\n\n✨ Here's the framework I use:\n1. Start with one solid piece\n2. Adapt to each platform's style\n3. Optimize for each audience\n4. Track and iterate\n\n💬 What's your content strategy? Drop a comment below.\n\n#ContentMarketing #DigitalStrategy #GrowthHacking`,
      
      instagram: `🎬 SCRIPT FOR REEL:\n\n[HOOK - 0:00-0:02]\n"Stop wasting time creating content from scratch!"\n\n[SETUP - 0:03-0:06]\n"Here's the secret top creators use..."\n\n[VALUE - 0:07-0:15]\n${sanitizedText.substring(0, 50)}...\nOne piece = 10+ posts!\n\n[CTA - 0:16-0:20]\n"Save this for later & follow for more tips!"\n\n💎 Visual suggestions:\n• Fast cuts every 2-3 seconds\n• Text overlays for key points\n• Trending audio\n• Hook in first frame\n\n#ContentCreator #SocialMediaTips #Productivity`
    };
  };

  const handleGenerate = async (title: string, content: string) => {
    setLoading(true);

    try {
      // Validate inputs one more time server-side
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

      // Simulate AI generation delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Generate mock content
      const generated = generateMockContent(content);
      setGeneratedContent(generated);

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
      toast.error(error.message || "Failed to generate content");
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

  return (
    <div className="flex h-screen overflow-hidden">
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
          <ContentResults content={generatedContent} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
