import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, PlayCircle, Layers } from "lucide-react";
import { projectSchema } from "@/lib/validations";
import { z } from "zod";
import { toast } from "sonner";
import { LRMVisualizer } from "@/components/LRMVisualizer";
import { VideoPlayer } from "@/components/VideoPlayer";
import { WalletCard } from "@/components/WalletCard";
import { CommentSection } from "@/components/Social/CommentSection";
import { LiveChat } from "@/components/Social/LiveChat";
import { DirectMessages } from "@/components/Social/DirectMessages";
import { CommandPalette } from "@/components/CommandPalette";
import { useSoundEffects } from "@/hooks/use-sound-effects";
import { Badge3D } from "@/components/Achievements/Badge3D";
import { StyleSelector } from "@/components/StyleSelector";

interface ContentInputProps {
  onGenerate: (title: string, content: string, style?: string) => void;
  loading: boolean;
}

export const ContentInput = ({ onGenerate, loading }: ContentInputProps) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("cinematic");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [lrmProcessing, setLrmProcessing] = useState(false);
  const [lrmData, setLrmData] = useState<any>(null);

  const { playSound } = useSoundEffects();

  const handleGenerate = () => {
    playSound('click');
    setErrors({});

    try {
      // Validate inputs
      const validated = projectSchema.parse({
        title: title.trim(),
        content: content.trim(),
      });

      onGenerate(validated.title, validated.content, selectedStyle);
    } catch (error: any) {
      playSound('error');
      if (error instanceof z.ZodError) {
        const fieldErrors: { [key: string]: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        toast.error("Please fix the validation errors");
      }
    }
  };

  const handleRemix = () => {
    if (lrmData?.video_result) {
      playSound('click');
      setTitle(`Remix: ${title || "Untitled"}`);
      // In a real app, we'd extract the original prompt from metadata
      // For now, we keep the content as is or append a remix note
      toast.success("Remix mode activated! 🧬");

      // Scroll to top to edit
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col h-full p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-700">
      <CommandPalette />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500">Create New Content</h2>
          <p className="text-zinc-400 text-sm md:text-lg">
            Transform your ideas into viral multimodal experiences.
          </p>
        </div>
        <div className="flex gap-4 items-center self-start md:self-auto">
          <Badge3D title="Early Access" />
          <div className="hidden md:flex px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-zinc-400 items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            SYSTEM ONLINE
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel p-6 rounded-2xl space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-zinc-300">Project Title</Label>
              <Input
                id="title"
                placeholder="e.g., Q4 Product Launch"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`bg-black/40 border-white/10 focus:border-purple-500/50 focus:ring-purple-500/20 transition-all ${errors.title ? "border-red-500/50" : ""}`}
              />
              {errors.title && (
                <p className="text-sm text-red-400">{errors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="content" className="text-zinc-300">Original Content</Label>
              <Textarea
                id="content"
                placeholder="Paste your blog post, video transcript, or any long-form content here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className={`min-h-[300px] bg-black/40 border-white/10 resize-none focus:border-purple-500/50 focus:ring-purple-500/20 transition-all ${errors.content ? "border-red-500/50" : ""}`}
              />
              {errors.content && (
                <p className="text-sm text-red-400">{errors.content}</p>
              )}
            </div>

            <StyleSelector selectedStyle={selectedStyle} onSelect={setSelectedStyle} />

            <Button
              onClick={handleGenerate}
              disabled={loading || !title.trim() || !content.trim()}
              size="lg"
              className="w-full gradient-primary text-white font-bold text-lg h-12 shadow-xl shadow-purple-900/20"
            >
              <Sparkles className="w-5 h-5 mr-2 animate-pulse" />
              {loading ? "Generating Magic..." : "Generate Content"}
            </Button>
          </div>

          <div className="glass-panel p-4 rounded-xl">
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-3 text-center">Developer Tools</p>
            <Button
              onClick={() => {
                import("@/lib/api").then(({ ingestContext }) => {
                  if (!content.trim()) {
                    toast.error("Please enter some content first");
                    return;
                  }
                  setLrmProcessing(true);
                  setLrmData(null);

                  ingestContext(content, "text")
                    .then((data) => {
                      setLrmData(data);
                      toast.success(`Context ingested! ID: ${data.ingestion_id}`);
                    })
                    .catch(() => {
                      toast.error("Failed to ingest context");
                    })
                    .finally(() => {
                      setLrmProcessing(false);
                    });
                });
              }}
              variant="outline"
              className="w-full text-xs border-white/10 hover:bg-white/5 hover:text-white transition-colors"
              disabled={!content.trim() || lrmProcessing}
            >
              <PlayCircle className="w-3 h-3 mr-2" />
              Test LRM Ingestion
            </Button>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className={`transition-all duration-500 ${lrmProcessing || lrmData ? 'opacity-100 translate-y-0' : 'opacity-50 grayscale'}`}>
            <LRMVisualizer isProcessing={lrmProcessing} data={lrmData} />
          </div>

          {lrmData?.video_result && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Generated Output</h3>
                  </div>
                  <VideoPlayer videoResult={lrmData.video_result} onRemix={handleRemix} />
                </div>
                <div className="lg:col-span-1 flex flex-col justify-end">
                  <WalletCard userId="user_demo_123" />
                </div>
              </div >

              {/* Social Hive Grid */}
              < div className="border-t border-white/10 pt-8" >
                <div className="flex items-center gap-3 mb-6">
                  <Layers className="w-5 h-5 text-zinc-400" />
                  <h3 className="text-xl font-bold text-white">The Hive <span className="text-zinc-500 font-normal text-sm ml-2">Social Layer</span></h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
                  <div className="md:col-span-1 h-full">
                    <CommentSection videoId={"vid_" + lrmData.video_result.model} />
                  </div>
                  <div className="md:col-span-1 h-full">
                    <LiveChat videoId={"vid_" + lrmData.video_result.model} />
                  </div>
                  <div className="md:col-span-1 h-full">
                    <DirectMessages />
                  </div>
                </div>
              </div >
            </div >
          )}

          {
            !lrmData?.video_result && !lrmProcessing && (
              <div className="h-[400px] glass-panel rounded-2xl flex flex-col items-center justify-center text-zinc-600 border-dashed border-2 border-zinc-800">
                <Sparkles className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-mono text-sm">Waiting for input generation...</p>
              </div>
            )
          }
        </div >
      </div >
    </div >
  );
};
