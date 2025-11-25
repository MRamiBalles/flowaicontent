import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Play, Clock, CheckCircle2 } from "lucide-react";
import { OptimizedImage } from "@/components/ui/optimized-image";

export function GenerationQueue() {
    // Mock data for now
    const tasks = [
        { id: "1", prompt: "Cyberpunk city rain", status: "completed", time: "2m ago" },
        { id: "2", prompt: "Cat playing piano", status: "processing", time: "Just now" },
        { id: "3", prompt: "Mountain drone shot", status: "completed", time: "1h ago" },
    ];

    return (
        <ScrollArea className="h-full w-full rounded-md border bg-background/50 backdrop-blur-sm p-4">
            <div className="space-y-4">
                {tasks.map((task) => (
                    <div
                        key={task.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/50 hover:bg-accent/50 transition-colors cursor-pointer group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center overflow-hidden relative">
                                {task.status === "completed" ? (
                                    <OptimizedImage
                                        src={`https://source.unsplash.com/random/100x100?${task.id}`}
                                        alt="Thumbnail"
                                        width={64}
                                        height={64}
                                        objectFit="cover"
                                        className="w-full h-full"
                                    />
                                ) : (
                                    <Clock className="h-6 w-6 text-muted-foreground animate-pulse" />
                                )}
                                {task.status === "completed" && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Play className="h-6 w-6 text-white fill-white" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="font-medium line-clamp-1">{task.prompt}</p>
                                <p className="text-xs text-muted-foreground">{task.time}</p>
                            </div>
                        </div>

                        <Badge variant={task.status === "completed" ? "default" : "secondary"}>
                            {task.status === "completed" ? (
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                            ) : (
                                <Clock className="mr-1 h-3 w-3 animate-spin" />
                            )}
                            {task.status}
                        </Badge>
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
}
