import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";

interface ContentInputProps {
  onGenerate: (title: string, content: string) => void;
  loading: boolean;
}

export const ContentInput = ({ onGenerate, loading }: ContentInputProps) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleGenerate = () => {
    if (!title.trim() || !content.trim()) {
      return;
    }
    onGenerate(title, content);
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
            className="bg-card"
          />
        </div>

        <div className="space-y-2 flex-1 flex flex-col">
          <Label htmlFor="content">Original Content</Label>
          <Textarea
            id="content"
            placeholder="Paste your blog post, video transcript, or any long-form content here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 min-h-[300px] bg-card resize-none"
          />
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
      </div>
    </div>
  );
};
