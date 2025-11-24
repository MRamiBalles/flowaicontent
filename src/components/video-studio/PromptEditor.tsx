import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";

interface PromptEditorProps {
    value: string;
    onChange: (value: string) => void;
}

const SUGGESTIONS = [
    "A cyberpunk city with neon lights in rain",
    "Cinematic drone shot of a mountain peak",
    "Cute cat playing piano in a cozy room",
    "Abstract fluid colors mixing in slow motion"
];

export function PromptEditor({ value, onChange }: PromptEditorProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Prompt</Label>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                    <Wand2 className="mr-2 h-3 w-3" />
                    Enhance
                </Button>
            </div>

            <Textarea
                placeholder="Describe your video in detail..."
                className="min-h-[150px] resize-none text-lg bg-background/50 backdrop-blur-sm border-primary/20 focus:border-primary"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />

            <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Suggestions</Label>
                <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((suggestion) => (
                        <button
                            key={suggestion}
                            className="text-xs bg-secondary/50 hover:bg-secondary px-3 py-1.5 rounded-full transition-colors text-left"
                            onClick={() => onChange(suggestion)}
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
