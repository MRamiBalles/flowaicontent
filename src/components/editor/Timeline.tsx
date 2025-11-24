import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface TimelineProps {
    isPlaying: boolean;
    onPlayPause: () => void;
    currentTime: number;
    onSeek: (time: number) => void;
}

export function Timeline({ isPlaying, onPlayPause, currentTime, onSeek }: TimelineProps) {
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col h-full">
            {/* Controls Bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border/40">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <SkipBack className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onPlayPause}>
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <SkipForward className="w-4 h-4" />
                    </Button>
                    <span className="text-xs font-mono text-muted-foreground ml-2">
                        {formatTime(currentTime)} / 05:00
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Slider
                        defaultValue={[50]}
                        max={100}
                        step={1}
                        className="w-24"
                    />
                </div>
            </div>

            {/* Tracks Area */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 relative bg-muted/10">
                {/* Time Ruler */}
                <div className="flex h-6 border-b border-border/20 mb-2 text-xs text-muted-foreground font-mono">
                    {[0, 1, 2, 3, 4, 5].map((m) => (
                        <div key={m} className="flex-1 border-l border-border/20 pl-1">
                            {m}:00
                        </div>
                    ))}
                </div>

                {/* Video Track */}
                <div className="h-16 bg-muted/30 rounded-md mb-2 relative group cursor-pointer hover:bg-muted/40 transition-colors">
                    <div className="absolute top-0 left-0 bottom-0 w-[40%] bg-primary/20 border border-primary/50 rounded-md flex items-center justify-center text-xs text-primary font-medium">
                        Scene 1.mp4
                    </div>
                    <div className="absolute top-0 left-[40%] bottom-0 w-[30%] bg-blue-500/20 border border-blue-500/50 rounded-md ml-1 flex items-center justify-center text-xs text-blue-500 font-medium">
                        Scene 2.mp4
                    </div>
                </div>

                {/* Audio Track */}
                <div className="h-12 bg-muted/30 rounded-md relative group cursor-pointer hover:bg-muted/40 transition-colors">
                    <div className="absolute top-0 left-0 bottom-0 w-[80%] bg-green-500/20 border border-green-500/50 rounded-md flex items-center justify-center text-xs text-green-500 font-medium">
                        Background Music.mp3
                    </div>
                </div>

                {/* Playhead */}
                <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
                    style={{ left: `${(currentTime / 300) * 100}%` }} // Mock 5 min duration
                >
                    <div className="w-3 h-3 -ml-1.5 bg-red-500 rounded-full" />
                </div>
            </div>
        </div>
    );
}
