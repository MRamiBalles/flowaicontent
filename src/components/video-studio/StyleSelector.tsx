import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Style {
    id: string;
    name: string;
    preview_url: string;
    description: string;
}

interface StyleSelectorProps {
    selected: string | null;
    onSelect: (id: string) => void;
}

export function StyleSelector({ selected, onSelect }: StyleSelectorProps) {
    const { data: styles, isLoading } = useQuery({
        queryKey: ["video-styles"],
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/video/styles`, {
                headers: {
                    "Authorization": `Bearer ${session?.access_token}`
                }
            });
            if (!response.ok) throw new Error("Failed to fetch styles");
            return response.json() as Promise<Style[]>;
        }
    });

    if (isLoading) {
        return (
            <div className="space-y-2">
                <Label>Style</Label>
                <div className="h-32 flex items-center justify-center border rounded-lg bg-muted/20">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <Label className="text-lg font-semibold">Style</Label>
            <ScrollArea className="w-full whitespace-nowrap rounded-md border bg-background/50 backdrop-blur-sm">
                <div className="flex w-max space-x-4 p-4">
                    {styles?.map((style) => (
                        <button
                            key={style.id}
                            onClick={() => onSelect(style.id)}
                            className={cn(
                                "relative group flex flex-col items-center gap-2 w-32 transition-all",
                                selected === style.id ? "scale-105" : "opacity-70 hover:opacity-100"
                            )}
                        >
                            <div className={cn(
                                "w-32 h-32 rounded-lg overflow-hidden border-2 transition-all",
                                selected === style.id ? "border-primary shadow-lg shadow-primary/20" : "border-transparent"
                            )}>
                                <img
                                    src={style.preview_url}
                                    alt={style.name}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                />
                            </div>
                            <span className={cn(
                                "text-sm font-medium",
                                selected === style.id ? "text-primary" : "text-muted-foreground"
                            )}>
                                {style.name}
                            </span>
                        </button>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    );
}
