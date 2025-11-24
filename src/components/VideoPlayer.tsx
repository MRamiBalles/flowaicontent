import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Play, Pause, Loader2, Film, Maximize2, Minimize2, Volume2, VolumeX, GitFork, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface VideoPlayerProps {
    videoResult: any | null;
    onRemix?: () => void;
    onClip?: (timestamp: number) => void;
}

export const VideoPlayer = ({ videoResult, onRemix, onClip }: VideoPlayerProps) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [loading, setLoading] = useState(true);
    const [earnedSession, setEarnedSession] = useState(0);
    const [isMuted, setIsMuted] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoResult) {
            const timer = setTimeout(() => setLoading(false), 1500);
            return () => clearTimeout(timer);
        }
    }, [videoResult]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying && videoResult && !loading) {
            interval = setInterval(() => {
                fetch('http://localhost:8000/api/v1/economy/poa', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: "user_demo_123",
                        video_id: "vid_" + videoResult.model,
                        duration_seconds: 5.0
                    })
                })
                    .then(res => res.json())
                    .then(data => {
                        if (data.reward_minted) {
                            setEarnedSession(prev => prev + data.reward_minted);
                        }
                    })
                    .catch(err => console.error("PoA Heartbeat failed:", err));
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [isPlaying, videoResult, loading]);

    const handleClipThis = () => {
        if (onClip && videoRef.current) {
            const time = videoRef.current.currentTime;
            onClip(time);
            toast.success(`📌 Clip created at ${time.toFixed(1)}s!`, {
                description: "Your clip is now available for remixing",
            });
        }
    };

    if (!videoResult) return null;

    return (
        <Card className={`overflow-hidden bg-black border-white/10 shadow-2xl transition-all duration-500 group relative ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'mt-4 rounded-xl glass-panel'}`}>
            {earnedSession > 0 && !loading && (
                <div className="absolute top-6 right-6 z-30 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="bg-yellow-500/10 backdrop-blur-md border border-yellow-500/50 text-yellow-400 px-4 py-2 rounded-full text-sm font-bold shadow-[0_0_15px_rgba(234,179,8,0.3)] flex items-center gap-2">
                        <span className="animate-pulse">●</span>
                        +{earnedSession.toFixed(2)} TKN
                    </div>
                </div>
            )}

            <div className={`relative bg-zinc-900 ${isFullscreen ? 'h-screen w-screen' : 'aspect-video w-full'}`}>
                {loading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
                        <div className="relative">
                            <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full animate-pulse" />
                            <Loader2 className="w-12 h-12 animate-spin text-purple-500 relative z-10" />
                        </div>
                        <div className="mt-4 space-y-1 text-center">
                            <span className="text-sm font-mono text-purple-400 tracking-widest block animate-pulse">NEURAL DECODING</span>
                            <span className="text-[10px] text-zinc-500 font-mono block">Synthesizing Frames...</span>
                        </div>
                    </div>
                ) : (
                    <>
                        <video
                            ref={videoRef}
                            src={videoResult.video_url}
                            className="w-full h-full object-cover"
                            controls={false}
                            autoPlay={true}
                            loop
                            muted={isMuted}
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-6">
                            <div className="flex justify-between items-start">
                                <div className="flex flex-wrap gap-2">
                                    <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-mono text-white/90 border border-white/10 flex items-center gap-2">
                                        <Film className="w-3 h-3 text-purple-400" />
                                        <span className="font-bold tracking-wider uppercase">{videoResult.model}</span>
                                        <span className="w-px h-3 bg-white/20" />
                                        <span>{videoResult.metadata?.resolution?.[0]}x{videoResult.metadata?.resolution?.[1]}</span>
                                    </div>

                                    {onClip && (
                                        <Button
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleClipThis();
                                            }}
                                            className="h-8 bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 border border-blue-500/50 backdrop-blur-md text-xs font-bold gap-2"
                                        >
                                            <Scissors className="w-3 h-3" />
                                            CLIP
                                        </Button>
                                    )}

                                    {onRemix && (
                                        <Button
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRemix();
                                            }}
                                            className="h-8 bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 border border-purple-500/50 backdrop-blur-md text-xs font-bold gap-2"
                                        >
                                            <GitFork className="w-3 h-3" />
                                            REMIX
                                        </Button>
                                    )}
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-white hover:bg-white/10 rounded-full"
                                    onClick={() => setIsFullscreen(!isFullscreen)}
                                >
                                    {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                                </Button>
                            </div>

                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className={`bg-white/10 backdrop-blur-md p-4 rounded-full border border-white/20 transition-transform duration-300 ${isPlaying ? 'scale-90 opacity-0' : 'scale-100 opacity-100'}`}>
                                    {isPlaying ? <Pause className="w-8 h-8 text-white fill-white" /> : <Play className="w-8 h-8 text-white fill-white ml-1" />}
                                </div>
                            </div>

                            <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                    <h3 className="text-white font-bold text-lg leading-none drop-shadow-md line-clamp-1 max-w-md">
                                        {videoResult.metadata?.prompt || "Generated Scene"}
                                    </h3>
                                    <p className="text-zinc-400 text-xs font-mono">
                                        GEN_TIME: {videoResult.metadata?.generation_time}s
                                    </p>
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-white hover:bg-white/10 rounded-full"
                                    onClick={() => setIsMuted(!isMuted)}
                                >
                                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {!loading && (
                <div className="h-1 bg-zinc-800 w-full">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 w-1/3 animate-[pulse_3s_ease-in-out_infinite]" />
                </div>
            )}
        </Card>
    );
};
