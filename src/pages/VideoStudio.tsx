import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PromptEditor } from "@/components/video-studio/PromptEditor";
import { StyleSelector } from "@/components/video-studio/StyleSelector";
import { GenerationQueue } from "@/components/video-studio/GenerationQueue";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function VideoStudio() {
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const { toast } = useToast();

  const generateMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/video/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          prompt,
          style_id: selectedStyle,
          duration: 4
        })
      });

      if (!response.ok) throw new Error("Generation failed");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Generation Started",
        description: "Your video is being created in the background.",
      });
      // In a real app, we'd add the new task ID to the queue here or refetch
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  return (
    <div className="container mx-auto p-6 h-[calc(100vh-4rem)]">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
        {/* Left Panel: Controls */}
        <div className="lg:col-span-4 flex flex-col gap-6 overflow-y-auto pr-2">
          <div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
              Video Studio
            </h1>
            <p className="text-muted-foreground">Create AI videos from text.</p>
          </div>

          <PromptEditor 
            value={prompt} 
            onChange={setPrompt} 
          />

          <StyleSelector 
            selected={selectedStyle} 
            onSelect={setSelectedStyle} 
          />

          <Button 
            size="lg" 
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            onClick={() => generateMutation.mutate()}
            disabled={!prompt || generateMutation.isPending}
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Video
              </>
            )}
          </Button>
        </div>

        {/* Right Panel: Preview & Queue */}
        <div className="lg:col-span-8 flex flex-col gap-6 bg-card/50 rounded-xl p-6 border border-border/50">
          <div className="flex-1 min-h-[400px] flex items-center justify-center border-2 border-dashed border-muted rounded-lg bg-black/20">
            <div className="text-center text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Your generated video will appear here</p>
            </div>
          </div>

          <div className="h-1/3">
            <h3 className="text-lg font-semibold mb-4">Generation Queue</h3>
            <GenerationQueue />
          </div>
        </div>
      </div>
    </div>
  );
}
