import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export function EmoteGenerator() {
    const [prompt, setPrompt] = useState("");
    const [style, setStyle] = useState("pixel-art");
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const generateMutation = useMutation({
        mutationFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/emotes/generate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ prompt, style })
            });
            if (!response.ok) throw new Error("Generation failed");
            return response.json();
        },
        onSuccess: () => {
            toast({
                title: "Emote Generated! 🎉",
                description: "Added to your library.",
            });
            setPrompt("");
            queryClient.invalidateQueries({ queryKey: ["emotes"] });
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
        <div className="p-6 bg-card/50 backdrop-blur-sm border rounded-xl space-y-4">
            <div className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    Create New Emote
                </h3>
                <p className="text-sm text-muted-foreground">
                    Generate unique emotes for your channel using AI.
                </p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label>Prompt</Label>
                    <Input
                        placeholder="e.g., happy robot, cool cat, hype fire"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <Label>Style</Label>
                    <Select value={style} onValueChange={setStyle}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="pixel-art">Pixel Art</SelectItem>
                            <SelectItem value="anime">Anime</SelectItem>
                            <SelectItem value="3d">3D Render</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Button
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600"
                    onClick={() => generateMutation.mutate()}
                    disabled={!prompt || generateMutation.isPending}
                >
                    {generateMutation.isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        "Generate Emote"
                    )}
                </Button>
            </div>
        </div>
    );
}
