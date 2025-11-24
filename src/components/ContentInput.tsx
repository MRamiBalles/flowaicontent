import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";
import { projectSchema } from "@/lib/validations";
import { z } from "zod";
import { toast } from "sonner";

interface ContentInputProps {
  onGenerate: (title: string, content: string) => void;
  loading: boolean;
}

export const ContentInput = ({ onGenerate, loading }: ContentInputProps) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleGenerate = () => {
    setErrors({});

    try {
      // Validate inputs
      const validated = projectSchema.parse({
        title: title.trim(),
        content: content.trim(),
      });

      onGenerate(validated.title, validated.content);
    } catch (error: any) {
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

  return (
    <div className="flex flex-col h-full p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Create New Content</h2>
        <p className="text-muted-foreground">
          Paste your original content and we'll transform it into viral posts
        </p>
      </div>

      <div className="space-y-4 flex-1 flex flex-col">
        <div className="space-y-2">
          <Label htmlFor="title">Project Title</Label>
          <Input
            id="title"
            placeholder="e.g., Q4 Product Launch"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={errors.title ? "bg-card border-destructive" : "bg-card"}
          />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title}</p>
          )}
        </div>

        <div className="space-y-2 flex-1 flex flex-col">
          <Label htmlFor="content">Original Content</Label>
          <Textarea
            id="content"
            placeholder="Paste your blog post, video transcript, or any long-form content here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={errors.content ? "flex-1 min-h-[300px] bg-card resize-none border-destructive" : "flex-1 min-h-[300px] bg-card resize-none"}
          />
          {errors.content && (
            <p className="text-sm text-destructive">{errors.content}</p>
          )}
        </div>

        <Button
          onClick={handleGenerate}
          disabled={loading || !title.trim() || !content.trim()}
          size="lg"
          className="w-full gradient-primary text-white font-semibold"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          {loading ? "Generating Magic..." : "✨ Generate Content"}
        </Button>

        <div className="pt-2 border-t border-border mt-4">
          <p className="text-xs text-muted-foreground mb-2 text-center">AI Backend Integration</p>
          <Button
            onClick={() => {
              // Temporary direct call for testing
              import("@/lib/api").then(({ ingestContext }) => {
                if (!content.trim()) {
                  toast.error("Please enter some content first");
                  return;
                }
                toast.promise(ingestContext(content, "text"), {
                  loading: "Ingesting context to LRM...",
                  success: (data) => `Context ingested! ID: ${data.ingestion_id}`,
                  error: "Failed to ingest context"
                });
              });
            }}
            variant="outline"
            className="w-full text-xs"
            disabled={!content.trim()}
          >
            🚀 Test LRM Ingestion (Localhost:8000)
          </Button>
        </div>
      </div>
    </div>
  );
};
