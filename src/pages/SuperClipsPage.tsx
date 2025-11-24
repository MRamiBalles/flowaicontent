import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Rocket, Zap, Star, TrendingUp, Clock, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

import { supabase } from '@/integrations/supabase/client';

interface BoostTier {
    cost: number;
    duration: number;
    multiplier: number;
    description: string;
}

interface Clip {
    id: string;
    title: string;
    views: number;
    likes: number;
    is_boosted?: boolean;
    boost_expires_at?: string;
    trending_score?: number;
}

export const SuperClipsPage = () => {
    const [tiers, setTiers] = useState<Record<string, BoostTier>>({});
    const [trendingClips, setTrendingClips] = useState<Clip[]>([]);
    const [myBoosts, setMyBoosts] = useState<any[]>([]);
    const [selectedClip, setSelectedClip] = useState<string | null>(null);
    const [selectedTier, setSelectedTier] = useState<string>('basic');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Get boost tiers
            const tiersRes = await fetch('http://localhost:8000/v1/super-clips/tiers');
            const tiersData = await tiersRes.json();
            setTiers(tiersData.tiers);

            // Get trending clips
            const trendingRes = await fetch('http://localhost:8000/v1/super-clips/trending');
            const trendingData = await trendingRes.json();
            setTrendingClips(trendingData.clips);

            // Get my active boosts
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (token) {
                const boostsRes = await fetch('http://localhost:8000/v1/super-clips/active', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const boostsData = await boostsRes.json();
                setMyBoosts(boostsData.boosts);
            }
        } catch (error) {
            console.error('Failed to load data');
        }
    };

    const handleBoost = async (clipId: string, tier: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (!token) {
                toast.error('Please login to boost clips');
                return;
            }

            const response = await fetch('http://localhost:8000/v1/super-clips/boost', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    clip_id: clipId,
                    tier: tier
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail);
            }

            const data = await response.json();
            toast.success(`Clip boosted with ${tier} tier! 🚀`);
            fetchData(); // Refresh
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold text-white mb-4 flex items-center justify-center gap-3">
                        <Rocket className="w-12 h-12 text-orange-400" />
                        Super Clips
                    </h1>
                    <p className="text-xl text-zinc-400">
                        Boost your clips to <span className="text-orange-400 font-bold">trending</span> with tokens
                    </p>
                </div>

                {/* Boost Tiers */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-white mb-6">Boost Tiers</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {Object.entries(tiers).map(([key, tier]) => {
                            const icons = {
                                basic: Zap,
                                turbo: Rocket,
                                mega: Star
                            };
                            const colors = {
                                basic: 'blue',
                                turbo: 'purple',
                                mega: 'orange'
                            };
                            const Icon = icons[key as keyof typeof icons] || Zap;
                            const color = colors[key as keyof typeof colors];

                            return (
                                <Card
                                    key={key}
                                    className={`p-6 border-2 transition-all cursor-pointer ${selectedTier === key
                                        ? `border-${color}-500 bg-${color}-500/10`
                                        : 'border-white/10 hover:border-white/30'
                                        }`}
                                    onClick={() => setSelectedTier(key)}
                                >
                                    <div className="text-center">
                                        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-${color}-500/20 mb-4`}>
                                            <Icon className={`w-8 h-8 text-${color}-400`} />
                                        </div>
                                        <h3 className="text-2xl font-bold text-white mb-2 capitalize">{key}</h3>
                                        <div className="text-4xl font-bold text-white mb-4">{tier.cost} <span className="text-sm text-zinc-500">tokens</span></div>
                                        <p className="text-zinc-400 text-sm mb-4">{tier.description}</p>
                                        <div className="flex justify-between text-xs text-zinc-500">
                                            <span>{tier.duration}h duration</span>
                                            <span>{tier.multiplier}x boost</span>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                {/* Trending Clips */}
                <div className="mb-12">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <TrendingUp className="w-6 h-6 text-green-400" />
                            Trending Now
                        </h2>
                        <Badge className="bg-green-500/20 text-green-300">Live</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {trendingClips.slice(0, 9).map((clip, index) => (
                            <Card
                                key={clip.id}
                                className={`p-4 border ${clip.is_boosted
                                    ? 'border-orange-500/50 bg-orange-500/5'
                                    : 'border-white/10'
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-2xl font-bold text-zinc-600">#{index + 1}</span>
                                            {clip.is_boosted && (
                                                <Badge className="bg-orange-500/20 text-orange-300 text-xs">
                                                    <Rocket className="w-3 h-3 mr-1" />
                                                    BOOSTED
                                                </Badge>
                                            )}
                                        </div>
                                        <h3 className="text-white font-bold">{clip.title}</h3>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 text-sm text-zinc-400 mb-3">
                                    <span>{clip.views.toLocaleString()} views</span>
                                    <span>{clip.likes.toLocaleString()} likes</span>
                                </div>

                                {clip.is_boosted && clip.boost_expires_at && (
                                    <div className="flex items-center gap-2 text-xs text-orange-400">
                                        <Clock className="w-3 h-3" />
                                        Boost expires: {new Date(clip.boost_expires_at).toLocaleTimeString()}
                                    </div>
                                )}

                                {!clip.is_boosted && (
                                    <Button
                                        onClick={() => handleBoost(clip.id, selectedTier)}
                                        className="w-full mt-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                                    >
                                        <Rocket className="w-4 h-4 mr-2" />
                                        Boost This Clip
                                    </Button>
                                )}
                            </Card>
                        ))}
                    </div>
                </div>

                {/* My Active Boosts */}
                {myBoosts.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                            <BarChart3 className="w-6 h-6 text-blue-400" />
                            My Active Boosts
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {myBoosts.map((boost) => (
                                <Card key={boost.id} className="glass-panel p-6 border-white/10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-sm text-zinc-500">Boost ID</p>
                                            <p className="text-white font-mono text-xs">{boost.id.slice(0, 8)}...</p>
                                        </div>
                                        <Badge className="bg-orange-500/20 text-orange-300">
                                            {boost.boost_multiplier}x
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-zinc-500">Cost</p>
                                            <p className="text-white font-bold">{boost.cost_tokens} tokens</p>
                                        </div>
                                        <div>
                                            <p className="text-zinc-500">Duration</p>
                                            <p className="text-white font-bold">{boost.duration_hours}h</p>
                                        </div>
                                        <div>
                                            <p className="text-zinc-500">Views</p>
                                            <p className="text-green-400 font-bold">{boost.views_during_boost || 0}</p>
                                        </div>
                                        <div>
                                            <p className="text-zinc-500">Expires</p>
                                            <p className="text-white text-xs">{new Date(boost.expires_at).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
