import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Play, Pause, Loader2, Film } from 'lucide-react';

interface VideoPlayerProps {
    videoResult: any | null;
}

export const VideoPlayer = ({ videoResult }: VideoPlayerProps) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (videoResult) {
            setLoading(false);
        }
    }, [videoResult]);

    if (!videoResult) return null;

    return (
        <Card className="mt-4 overflow-hidden bg-black border-primary/20 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="relative aspect-video bg-zinc-900 group">
                {loading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50">
                        <Loader2 className="w-8 h-8 animate-spin mb-2" />
                        <span className="text-xs font-mono">RENDERING FRAMES...</span>
                    </div>
                ) : (
                    <>
                        <video
                            src={videoResult.video_url}
                            className="w-full h-full object-cover"
                            controls={false}
                            autoPlay={true}
                            loop
                            muted
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                        />

                        {/* Overlay Controls */}
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                            <div className="bg-black/50 p-3 rounded-full backdrop-blur-sm">
                                {isPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white" />}
                            </div>
                        </div>

                        {/* Metadata Badge */}
                        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-mono text-white/80 border border-white/10 flex items-center gap-1.5">
                            <Film className="w-3 h-3 text-primary" />
                            <span>{videoResult.model}</span>
                            <span className="w-px h-3 bg-white/20" />
                            <span>{videoResult.metadata?.resolution?.[0]}x{videoResult.metadata?.resolution?.[1]}</span>
                            <span className="w-px h-3 bg-white/20" />
                            <span>{videoResult.metadata?.fps} FPS</span>
                        </div>
                    </>
                )}
            </div>

            <div className="p-3 bg-zinc-900/50 border-t border-white/5">
                <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-mono">GENERATION TIME: {videoResult.metadata?.generation_time}</span>
                    <span className="text-green-500 font-mono">● READY</span>
                </div>
            </div>
        </Card>
    );
};
