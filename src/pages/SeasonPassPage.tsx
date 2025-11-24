import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, Lock, Zap, Target, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import { supabase } from '@/integrations/supabase/client';

interface Quest {
    id: string;
    title: string;
    description: string;
    type: string;
    current_progress: number;
    target_amount: number;
    reward_xp: number;
    reward_tokens: number;
    completed: boolean;
}

interface SeasonPass {
    current_xp: number;
    current_tier: number;
    is_premium: boolean;
    quests: Quest[];
    expires_at: string;
}

export const SeasonPassPage = () => {
    const [seasonPass, setSeasonPass] = useState<SeasonPass | null>(null);
    const [tiers, setTiers] = useState<any[]>([]);
    const [premiumPrice, setPremiumPrice] = useState(999);

    useEffect(() => {
        fetchSeasonPassData();
    }, []);

    const fetchSeasonPassData = async () => {
        try {
            // Get current season pass
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (token) {
                const passRes = await fetch('http://localhost:8000/v1/season-pass/current', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const passData = await passRes.json();
                setSeasonPass(passData);
            }

            // Get tiers
            const tiersRes = await fetch('http://localhost:8000/v1/season-pass/tiers');
            const tiersData = await tiersRes.json();
            setTiers(tiersData.tiers.slice(0, 20)); // Show first 20 tiers
            setPremiumPrice(tiersData.premium_price);
        } catch (error) {
            console.error('Failed to load season pass data');
        }
    };

    const upgradeToPremium = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (!token) {
                toast.error('Please login to upgrade');
                return;
            }

            const response = await fetch('http://localhost:8000/v1/season-pass/upgrade-premium', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Upgrade failed');

            toast.success('Upgraded to Premium Season Pass! 🎉');
            fetchSeasonPassData();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    if (!seasonPass) return <div className="text-white">Loading...</div>;

    const nextTier = tiers[seasonPass.current_tier] || tiers[tiers.length - 1];
    const progress = nextTier ? (seasonPass.current_xp / nextTier.xp_required) * 100 : 100;

    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                            <Trophy className="w-10 h-10 text-yellow-400" />
                            Season Pass
                        </h1>
                        <p className="text-zinc-400">
                            Expires: {new Date(seasonPass.expires_at).toLocaleDateString()}
                        </p>
                    </div>

                    {!seasonPass.is_premium && (
                        <Button
                            onClick={upgradeToPremium}
                            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold px-8 py-6 text-lg"
                        >
                            <Star className="w-5 h-5 mr-2" />
                            Upgrade to Premium ({premiumPrice} tokens)
                        </Button>
                    )}

                    {seasonPass.is_premium && (
                        <Badge className="bg-yellow-500/20 text-yellow-300 px-6 py-3 text-lg">
                            <Star className="w-5 h-5 mr-2" />
                            PREMIUM
                        </Badge>
                    )}
                </div>

                {/* Progress Overview */}
                <Card className="glass-panel p-6 border-white/10 mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Tier {seasonPass.current_tier}</h2>
                            <p className="text-zinc-400">{seasonPass.current_xp} / {nextTier?.xp_required} XP</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-zinc-500">Next Reward</p>
                            <p className="text-lg font-bold text-green-400">
                                +{nextTier?.free_reward?.amount || 0} tokens
                            </p>
                        </div>
                    </div>
                    <Progress value={progress} className="h-4 bg-white/10">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500" style={{ width: `${progress}%` }} />
                    </Progress>
                </Card>

                {/* Quests */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                        <Target className="w-6 h-6 text-blue-400" />
                        Active Quests
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {seasonPass.quests.map((quest) => {
                            const questProgress = (quest.current_progress / quest.target_amount) * 100;

                            return (
                                <Card
                                    key={quest.id}
                                    className={`p-4 ${quest.completed
                                        ? 'border-green-500/50 bg-green-500/5'
                                        : 'border-white/10'
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <Badge className={`mb-2 text-xs ${quest.type === 'daily' ? 'bg-blue-500/20 text-blue-300' :
                                                quest.type === 'weekly' ? 'bg-purple-500/20 text-purple-300' :
                                                    'bg-orange-500/20 text-orange-300'
                                                }`}>
                                                {quest.type}
                                            </Badge>
                                            <h3 className="font-bold text-white">{quest.title}</h3>
                                            <p className="text-sm text-zinc-400">{quest.description}</p>
                                        </div>
                                        {quest.completed && (
                                            <CheckCircle2 className="w-6 h-6 text-green-400" />
                                        )}
                                    </div>

                                    <div className="mb-3">
                                        <div className="flex justify-between text-xs text-zinc-500 mb-1">
                                            <span>{quest.current_progress} / {quest.target_amount}</span>
                                            <span>{Math.round(questProgress)}%</span>
                                        </div>
                                        <Progress value={questProgress} className="h-2" />
                                    </div>

                                    <div className="flex items-center gap-3 text-sm">
                                        <span className="text-blue-400">+{quest.reward_xp} XP</span>
                                        {quest.reward_tokens > 0 && (
                                            <span className="text-yellow-400">+{quest.reward_tokens} tokens</span>
                                        )}
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                {/* Tier Rewards */}
                <div>
                    <h2 className="text-2xl font-bold text-white mb-4">Rewards Track</h2>

                    <div className="space-y-2">
                        {tiers.map((tier) => {
                            const isUnlocked = seasonPass.current_tier >= tier.tier;
                            const isCurrent = seasonPass.current_tier === tier.tier;

                            return (
                                <Card
                                    key={tier.tier}
                                    className={`p-4 flex items-center gap-4 ${isCurrent ? 'border-blue-500 bg-blue-500/10' :
                                        isUnlocked ? 'border-green-500/30 bg-green-500/5' :
                                            'border-white/10 opacity-60'
                                        }`}
                                >
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-xl">
                                        {tier.tier}
                                    </div>

                                    <div className="flex-1">
                                        <p className="text-sm text-zinc-500">Tier {tier.tier}</p>
                                        <p className="text-white font-bold">{tier.xp_required} XP</p>
                                    </div>

                                    {/* Free Reward */}
                                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5">
                                        {isUnlocked ? (
                                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                                        ) : (
                                            <Lock className="w-5 h-5 text-zinc-600" />
                                        )}
                                        <span className="text-yellow-400">
                                            {tier.free_reward.amount} tokens
                                        </span>
                                    </div>

                                    {/* Premium Reward */}
                                    {tier.premium_reward && (
                                        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${seasonPass.is_premium ? 'bg-yellow-500/20' : 'bg-white/5'
                                            }`}>
                                            {seasonPass.is_premium && isUnlocked ? (
                                                <CheckCircle2 className="w-5 h-5 text-yellow-400" />
                                            ) : (
                                                <Star className={`w-5 h-5 ${seasonPass.is_premium ? 'text-yellow-400' : 'text-zinc-600'}`} />
                                            )}
                                            <span className={seasonPass.is_premium ? 'text-yellow-300' : 'text-zinc-600'}>
                                                {tier.premium_reward.type === 'tokens'
                                                    ? `${tier.premium_reward.amount} tokens`
                                                    : 'Style Pack'
                                                }
                                            </span>
                                        </div>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
