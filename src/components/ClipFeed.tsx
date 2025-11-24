import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Scissors, GitFork, TrendingUp, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Clip {
    id: string;
    video_id: string;
    timestamp: number;
    creator_id: string;
    remix_count: number;
    created_at: number;
    title: string;
}

export const ClipFeed = ({ onRemixClip }: { onRemixClip?: (clip: Clip) => void }) => {
    const [clips, setClips] = useState<Clip[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate fetching clips
        setTimeout(() => {
            setClips([
                {
                    id: 'clip_1',
                    video_id: 'vid_demo',
                    timestamp: 42.5,
                    creator_id: 'user_001',
                    remix_count: 127,
                    created_at: Date.now() - 3600000,
                    title: 'Epic Cyberpunk Moment'
                },
                {
                    id: 'clip_2',
                    video_id: 'vid_demo_2',
                    timestamp: 18.2,
                    creator_id: 'user_002',
                    remix_count: 89,
                    created_at: Date.now() - 7200000,
                    title: 'Anime Transformation'
                },
                {
                    id: 'clip_3',
                    video_id: 'vid_demo_3',
                    timestamp: 31.8,
                    creator_id: 'user_003',
                    remix_count: 56,
                    created_at: Date.now() - 10800000,
                    title: 'Watercolor Sunset'
                }
            ]);
            setLoading(false);
        }, 500);
    }, []);

    const handleRemix = (clip: Clip) => {
        toast.success(`Starting remix from clip at ${clip.timestamp.toFixed(1)}s!`);
        if (onRemixClip) {
            onRemixClip(clip);
        }
    };

    return (
        <Card className="glass-panel p-6 rounded-xl border-zinc-800/50">
            <div className="flex items-center gap-3 mb-6">
                <Scissors className="w-5 h-5 text-blue-400" />
                <h3 className="text-xl font-bold text-white">Trending Clips</h3>
                <span className="ml-auto text-xs text-zinc-500 bg-zinc-900 px-2 py-1 rounded-full">
                    {clips.length} viral moments
                </span>
            </div>

            <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                    {loading ? (
                        <p className="text-zinc-500 text-sm text-center py-8">Loading trending clips...</p>
                    ) : (
                        clips.map((clip, index) => (
                            <div
                                key={clip.id}
                                className="group p-4 rounded-lg bg-gradient-to-r from-black/40 to-black/20 border border-white/5 hover:border-blue-500/30 transition-all duration-300 hover:scale-[1.02]"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                        <h4 className="font-bold text-white text-sm mb-1">{clip.title}</h4>
                                        <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {clip.timestamp.toFixed(1)}s
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <TrendingUp className="w-3 h-3 text-blue-400" />
                                                {clip.remix_count} remixes
                                            </span>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => handleRemix(clip)}
                                        className="h-8 bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 border border-blue-500/50 text-xs font-bold gap-2 shrink-0"
                                    >
                                        <GitFork className="w-3 h-3" />
                                        Remix
                                    </Button>
                                </div>

                                {index === 0 && (
                                    <div className="mt-2 px-2 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded text-[10px] text-yellow-400 font-bold inline-block">
                                        🔥 MOST VIRAL
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>
        </Card>
    );
};
