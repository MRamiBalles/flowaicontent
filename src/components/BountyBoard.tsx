import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Diamond, TrendingUp, Send, Award } from 'lucide-react';
import { toast } from 'sonner';

interface Bounty {
    id: string;
    creator: string;
    title: string;
    description: string;
    reward: number;
    submissions: number;
    deadline: string;
    tags: string[];
}

export const BountyBoard = () => {
    const [bounties] = useState<Bounty[]>([
        {
            id: 'bounty_1',
            creator: 'CyberArtist',
            title: 'Best Watercolor Remix',
            description: 'Create a watercolor-style remix of my latest cyberpunk video',
            reward: 500,
            submissions: 12,
            deadline: '2 days',
            tags: ['Watercolor', 'Remix']
        },
        {
            id: 'bounty_2',
            creator: 'AnimeWizard',
            title: 'Epic Battle Scene',
            description: 'Generate an anime battle scene with dragons',
            reward: 800,
            submissions: 8,
            deadline: '5 days',
            tags: ['Anime', 'Action']
        },
        {
            id: 'bounty_3',
            creator: 'WatercolorDreams',
            title: 'Serene Landscape',
            description: 'Create a peaceful forest scene at sunset',
            reward: 350,
            submissions: 15,
            deadline: '1 day',
            tags: ['Nature', 'Peaceful']
        }
    ]);

    const [showCreateForm, setShowCreateForm] = useState(false);

    const handleSubmit = (bountyId: string) => {
        toast.success("Submission sent!", {
            description: "Your entry is now live for community voting",
            duration: 3000,
        });
    };

    const handleCreateBounty = () => {
        toast.success("Bounty created!", {
            description: "Your bounty is now live on the board",
        });
        setShowCreateForm(false);
    };

    return (
        <Card className="glass-panel p-6 rounded-xl border-zinc-800/50">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Diamond className="w-6 h-6 text-yellow-400" />
                    <h2 className="text-2xl font-bold text-white">Bounty Board</h2>
                </div>
                <Button
                    size="sm"
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-300 border border-yellow-500/50 font-bold gap-2"
                >
                    <Diamond className="w-4 h-4" />
                    Post Bounty
                </Button>
            </div>

            {showCreateForm && (
                <div className="mb-6 p-4 bg-black/40 rounded-lg border border-yellow-500/20 space-y-4 animate-in fade-in slide-in-from-top-4">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <Award className="w-4 h-4 text-yellow-400" />
                        Create New Bounty
                    </h3>
                    <div className="space-y-3">
                        <div>
                            <Label className="text-zinc-300 text-sm">Bounty Title</Label>
                            <Input placeholder="e.g., Epic Dragon Battle" className="bg-black/50 border-white/10 text-white" />
                        </div>
                        <div>
                            <Label className="text-zinc-300 text-sm">Description</Label>
                            <Textarea placeholder="Describe what you want creators to make..." className="bg-black/50 border-white/10 text-white min-h-[80px]" />
                        </div>
                        <div>
                            <Label className="text-zinc-300 text-sm">Reward (TKN)</Label>
                            <Input type="number" placeholder="500" className="bg-black/50 border-white/10 text-white" />
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleCreateBounty} className="flex-1 bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-300 border border-yellow-500/50">
                                Create Bounty
                            </Button>
                            <Button onClick={() => setShowCreateForm(false)} variant="outline" className="border-white/10">
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                    {bounties.map((bounty) => (
                        <div
                            key={bounty.id}
                            className="group p-4 rounded-lg bg-gradient-to-r from-black/60 to-black/40 border border-white/5 hover:border-yellow-500/30 transition-all duration-300"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-white text-lg">{bounty.title}</h3>
                                        <span className="text-xs bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-500/20 font-bold">
                                            {bounty.reward} TKN
                                        </span>
                                    </div>
                                    <p className="text-sm text-zinc-400 mb-2">{bounty.description}</p>
                                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                                        <span>by {bounty.creator}</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            <TrendingUp className="w-3 h-3" />
                                            {bounty.submissions} submissions
                                        </span>
                                        <span>•</span>
                                        <span>⏰ {bounty.deadline}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex gap-2">
                                    {bounty.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="text-[10px] bg-white/5 text-zinc-400 px-2 py-1 rounded border border-white/10"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => handleSubmit(bounty.id)}
                                    className="bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-300 border border-yellow-500/50 text-xs font-bold gap-2"
                                >
                                    <Send className="w-3 h-3" />
                                    Submit Entry
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </Card>
    );
};
