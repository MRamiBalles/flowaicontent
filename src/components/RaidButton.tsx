import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, Users, Send } from 'lucide-react';
import { toast } from 'sonner';

interface RaidButtonProps {
    videoContext?: {
        style: string;
        prompt: string;
        model: string;
    };
}

export const RaidButton = ({ videoContext }: RaidButtonProps) => {
    const [open, setOpen] = useState(false);
    const [targetCreator, setTargetCreator] = useState('');
    const [viewerCount] = useState(Math.floor(Math.random() * 500) + 100);

    const popularCreators = [
        { id: 'creator_001', name: 'CyberArtist', style: 'Cyberpunk', viewers: 2400 },
        { id: 'creator_002', name: 'AnimeWizard', style: 'Anime', viewers: 1800 },
        { id: 'creator_003', name: 'WatercolorDreams', style: 'Watercolor', viewers: 1200 },
    ];

    const handleRaid = (creatorId: string) => {
        const creator = popularCreators.find(c => c.id === creatorId);
        if (!creator) return;

        toast.success(`🚀 Raiding ${creator.name}!`, {
            description: `Transferring your creative context to ${creator.name}. ${viewerCount} viewers incoming!`,
            duration: 4000,
        });

        // Simulate context transfer
        setTimeout(() => {
            toast.info(`📦 Context Delivered`, {
                description: `${creator.name} received your ${videoContext?.style || 'style'} theme and prompt!`,
            });
        }, 1500);

        setOpen(false);
        setTargetCreator('');
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    size="sm"
                    className="bg-red-500/20 hover:bg-red-500/40 text-red-300 border border-red-500/50 font-bold gap-2"
                >
                    <Zap className="w-4 h-4" />
                    START RAID
                </Button>
            </DialogTrigger>
            <DialogContent className="glass-panel border-zinc-800/50 text-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Zap className="w-5 h-5 text-red-400" />
                        AI Raid - Transfer Context
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-sm">
                        <p className="text-yellow-400 font-bold mb-1">⚡ Raid Power</p>
                        <p className="text-zinc-300 text-xs">
                            You'll send <span className="text-white font-bold">{viewerCount} viewers</span> + your creative context
                            ({videoContext?.style || 'Current Style'})
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-zinc-300">Choose Creator to Raid</Label>
                        <div className="space-y-2">
                            {popularCreators.map((creator) => (
                                <button
                                    key={creator.id}
                                    onClick={() => handleRaid(creator.id)}
                                    className="w-full p-3 rounded-lg bg-black/40 border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 transition-all duration-300 text-left group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
                                                <Users className="w-5 h-5 text-red-400" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-white group-hover:text-red-300 transition-colors">{creator.name}</p>
                                                <p className="text-xs text-zinc-500">Specializes in {creator.style}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-xs text-zinc-400 flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                {creator.viewers} live
                                            </span>
                                            <Send className="w-4 h-4 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="text-[10px] text-zinc-600 text-center pt-2">
                        💡 The raided creator will receive your style and prompt to integrate into their next video
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
