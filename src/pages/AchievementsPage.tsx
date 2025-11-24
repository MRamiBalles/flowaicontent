import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Award, Lock, TrendingUp, Medal } from 'lucide-react';
import { toast } from 'sonner';

interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    rarity: string;
    current_progress: number;
    target_value: number;
    reward_tokens: number;
    unlocked: boolean;
    unlocked_at?: string;
    progress_percent: number;
}

export const AchievementsPage = () => {
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (token) {
                // Get user achievements
                const achRes = await fetch('http://localhost:8000/v1/achievements/my-achievements', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const achData = await achRes.json();
                setAchievements(achData.achievements);
                setStats(achData.stats);

                // Get leaderboard
                const lbRes = await fetch('http://localhost:8000/v1/achievements/leaderboard');
                const lbData = await lbRes.json();
                setLeaderboard(lbData.leaderboard);
            }
        } catch (error) {
            console.error('Failed to load achievements');
        }
    };

    const rarityColors = {
        common: 'bg-gray-500/20 text-gray-300',
        rare: 'bg-blue-500/20 text-blue-300',
        epic: 'bg-purple-500/20 text-purple-300',
        legendary: 'bg-orange-500/20 text-orange-300'
    };

    const categoryIcons = {
        generation: '🎬',
        social: '💖',
        earning: '🪙',
        viral: '🚀'
    };

    const filteredAchievements = filter === 'all'
        ? achievements
        : achievements.filter(a => a.category === filter);

    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold text-white mb-4 flex items-center justify-center gap-3">
                        <Trophy className="w-12 h-12 text-yellow-400" />
                        Achievements
                    </h1>
                    <p className="text-xl text-zinc-400">Unlock rewards and climb the leaderboard</p>
                </div>

                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <Card className="glass-panel p-4">
                            <p className="text-sm text-zinc-400">Total Achievements</p>
                            <p className="text-3xl font-bold text-white">{stats.total}</p>
                        </Card>
                        <Card className="glass-panel p-4">
                            <p className="text-sm text-zinc-400">Unlocked</p>
                            <p className="text-3xl font-bold text-green-400">{stats.unlocked}</p>
                        </Card>
                        <Card className="glass-panel p-4">
                            <p className="text-sm text-zinc-400">Completion</p>
                            <p className="text-3xl font-bold text-blue-400">{stats.completion_percent}%</p>
                        </Card>
                        <Card className="glass-panel p-4">
                            <p className="text-sm text-zinc-400">Tokens Earned</p>
                            <p className="text-3xl font-bold text-yellow-400">{stats.tokens_earned_from_achievements}</p>
                        </Card>
                    </div>
                )}

                {/* Filter */}
                <div className="flex gap-2 mb-6">
                    {['all', 'generation', 'social', 'earning', 'viral'].map((category) => (
                        <Button
                            key={category}
                            onClick={() => setFilter(category)}
                            variant={filter === category ? 'default' : 'outline'}
                            className={filter === category ? 'bg-blue-500 text-white' : ''}
                        >
                            {category === 'all' ? 'All' : categoryIcons[category as keyof typeof categoryIcons]} {category.charAt(0).toUpperCase() + category.slice(1)}
                        </Button>
                    ))}
                </div>

                {/* Achievements Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
                    {filteredAchievements.map((achievement) => (
                        <Card
                            key={achievement.id}
                            className={`p-6 border ${achievement.unlocked
                                ? 'border-green-500/50 bg-green-500/5'
                                : 'border-white/10'
                                }`}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="text-4xl">{achievement.icon}</div>
                                <div className="flex flex-col gap-2 items-end">
                                    <Badge className={rarityColors[achievement.rarity as keyof typeof rarityColors]}>
                                        {achievement.rarity}
                                    </Badge>
                                    {achievement.unlocked && (
                                        <Award className="w-6 h-6 text-yellow-400" />
                                    )}
                                    {!achievement.unlocked && (
                                        <Lock className="w-6 h-6 text-zinc-600" />
                                    )}
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-white mb-2">{achievement.name}</h3>
                            <p className="text-sm text-zinc-400 mb-4">{achievement.description}</p>

                            {!achievement.unlocked && (
                                <div className="mb-4">
                                    <div className="flex justify-between text-xs text-zinc-500 mb-1">
                                        <span>{achievement.current_progress} / {achievement.target_value}</span>
                                        <span>{Math.round(achievement.progress_percent)}%</span>
                                    </div>
                                    <Progress value={achievement.progress_percent} className="h-2" />
                                </div>
                            )}

                            {achievement.unlocked && achievement.unlocked_at && (
                                <p className="text-xs text-green-400 mb-3">
                                    Unlocked: {new Date(achievement.unlocked_at).toLocaleDateString()}
                                </p>
                            )}

                            <div className="flex items-center justify-between">
                                <span className="text-yellow-400 font-bold">+{achievement.reward_tokens} tokens</span>
                                <Badge className="bg-zinc-800 text-zinc-300 text-xs">
                                    {achievement.category}
                                </Badge>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Leaderboard */}
                <div>
                    <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
                        <TrendingUp className="w-8 h-8 text-green-400" />
                        Leaderboard
                    </h2>

                    <Card className="glass-panel p-6">
                        <div className="space-y-3">
                            {leaderboard.map((entry, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                                >
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${index === 0 ? 'bg-yellow-500 text-black' :
                                        index === 1 ? 'bg-gray-400 text-black' :
                                            index === 2 ? 'bg-orange-700 text-white' :
                                                'bg-zinc-700 text-white'
                                        }`}>
                                        {index === 0 ? '🥇' :
                                            index === 1 ? '🥈' :
                                                index === 2 ? '🥉' :
                                                    entry.rank
                                        }
                                    </div>

                                    <div className="flex-1">
                                        <p className="font-bold text-white">{entry.username}</p>
                                        <p className="text-sm text-zinc-400">
                                            {entry.total_achievements} achievements • {entry.tier} tier
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-yellow-400 font-bold">{entry.tokens_earned_from_achievements}</p>
                                        <p className="text-xs text-zinc-500">tokens earned</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
