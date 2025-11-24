import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Emote {
    id: string;
    url: string;
    prompt: string;
    style: string;
}

export function EmoteLibrary() {
    const { data: emotes, isLoading } = useQuery({
        queryKey: ["emotes"],
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/emotes/library`, {
                headers: {
                    "Authorization": `Bearer ${session?.access_token}`
                }
            });
            if (!response.ok) throw new Error("Failed to fetch emotes");
            return response.json() as Promise<Emote[]>;
        }
    });

    if (isLoading) {
        return <div className="grid grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-muted rounded-lg" />)}
        </div>;
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Your Library</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {emotes?.map((emote) => (
                    <Card key={emote.id} className="group relative overflow-hidden bg-muted/30 border-0">
                        <CardContent className="p-4 flex flex-col items-center gap-2">
                            <img
                                src={emote.url}
                                alt={emote.prompt}
                                className="w-20 h-20 object-contain"
                            />
                            <p className="text-xs text-muted-foreground truncate w-full text-center">
                                {emote.prompt}
                            </p>

                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="icon" variant="ghost" className="text-white hover:text-white hover:bg-white/20">
                                    <Download className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="text-red-400 hover:text-red-400 hover:bg-red-500/20">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
