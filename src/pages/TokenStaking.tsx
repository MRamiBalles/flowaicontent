import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
    Coins,
    TrendingUp,
    Loader2,
    Wallet,
    Check,
    X
} from 'lucide-react';

interface StakingPool {
    id: string;
    name: string;
    description: string;
    apy_percentage: number;
    lock_period_days: number;
    min_stake_amount: number;
    total_staked: number;
}

interface UserStake {
    id: string;
    amount: number;
    rewards_earned: number;
    staked_at: string;
    unlocks_at: string | null;
    pool: StakingPool;
}

interface Proposal {
    id: string;
    title: string;
    description: string;
    category: string;
    end_time: string;
    votes_for: number;
    votes_against: number;
    status: string;
}

const TokenStaking = () => {
    const { user } = useAuth();
    const [pools, setPools] = useState<StakingPool[]>([]);
    const [myStakes, setMyStakes] = useState<UserStake[]>([]);
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [stats, setStats] = useState({ totalStaked: 0, totalRewards: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [stakeAmount, setStakeAmount] = useState('');
    const [selectedPool, setSelectedPool] = useState<StakingPool | null>(null);

    useEffect(() => {
        if (user) {
            loadData();
        } else {
            setIsLoading(false);
        }
    }, [user]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Load pools using any to bypass type checking until types are regenerated
            const { data: poolsData } = await (supabase as any)
                .from('staking_pools')
                .select('*')
                .eq('is_active', true)
                .order('apy_percentage', { ascending: false });
            setPools(poolsData || []);

            // Load user stakes
            const { data: stakesData } = await (supabase as any)
                .from('user_stakes')
                .select('*, pool:pool_id(*)')
                .eq('user_id', user?.id)
                .eq('status', 'active');
            setMyStakes(stakesData || []);

            // Load proposals
            const { data: proposalsData } = await (supabase as any)
                .from('governance_proposals')
                .select('*')
                .eq('status', 'active')
                .order('end_time', { ascending: true });
            setProposals(proposalsData || []);

            // Calculate stats from stakes
            const totalStaked = (stakesData || []).reduce((acc: number, s: any) => acc + Number(s.amount || 0), 0);
            const totalRewards = (stakesData || []).reduce((acc: number, s: any) => acc + Number(s.rewards_earned || 0), 0);
            setStats({ totalStaked, totalRewards });

        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const callApi = async (action: string, data?: Record<string, unknown>) => {
        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/token-governance`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action, data }),
            }
        );
        return response.json();
    };

    const handleStake = async () => {
        if (!selectedPool || !stakeAmount) return;

        try {
            const result = await callApi('stake', {
                pool_id: selectedPool.id,
                amount: stakeAmount
            });

            if (result.success) {
                toast.success(`Successfully staked ${stakeAmount} FLOW!`);
                setStakeAmount('');
                setSelectedPool(null);
                loadData();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Staking failed');
        }
    };

    const handleClaim = async (stakeId: string) => {
        try {
            const result = await callApi('claim_rewards', { stake_id: stakeId });
            if (result.success) {
                toast.success(`Claimed ${result.claimed} FLOW!`);
                loadData();
            }
        } catch (error) {
            toast.error('Failed to claim rewards');
        }
    };

    const handleVote = async (proposalId: string, voteType: 'for' | 'against') => {
        try {
            const result = await callApi('vote', {
                proposal_id: proposalId,
                vote_type: voteType
            });
            if (result.success) {
                toast.success('Vote cast successfully!');
                loadData();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Voting failed');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Coins className="h-8 w-8 text-primary" />
                        $FLOW Staking & Governance
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Stake your tokens to earn rewards and vote on platform decisions
                    </p>
                </div>

                <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-4 flex gap-8">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase font-bold">Total Staked</p>
                            <p className="text-2xl font-bold font-mono">{stats.totalStaked.toLocaleString()} FLOW</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase font-bold">Rewards Earned</p>
                            <p className="text-2xl font-bold font-mono text-green-500">+{stats.totalRewards.toFixed(2)} FLOW</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="staking" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="staking">Staking Pools</TabsTrigger>
                    <TabsTrigger value="governance">Governance DAO</TabsTrigger>
                </TabsList>

                <TabsContent value="staking" className="space-y-8">
                    {/* Pools Grid */}
                    <div className="grid md:grid-cols-3 gap-6">
                        {pools.length === 0 ? (
                            <div className="col-span-3 text-center py-12 text-muted-foreground">
                                <Coins className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                <p>No staking pools available yet.</p>
                                <p className="text-sm">Check back soon!</p>
                            </div>
                        ) : pools.map((pool) => (
                            <Card key={pool.id} className="relative overflow-hidden hover:border-primary/50 transition-colors">
                                <div className="absolute top-0 right-0 p-3">
                                    <Badge variant="outline" className="bg-background">
                                        {pool.lock_period_days} Day Lock
                                    </Badge>
                                </div>
                                <CardHeader>
                                    <CardTitle>{pool.name}</CardTitle>
                                    <CardDescription>{pool.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div>
                                        <span className="text-4xl font-bold text-primary">{pool.apy_percentage}%</span>
                                        <span className="text-muted-foreground ml-2">APY</span>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Min Stake</span>
                                            <span>{pool.min_stake_amount} FLOW</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Total Staked</span>
                                            <span>{Number(pool.total_staked).toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button className="w-full" onClick={() => setSelectedPool(pool)}>
                                                Stake Now
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Stake in {pool.name}</DialogTitle>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Amount to Stake (FLOW)</label>
                                                    <div className="relative">
                                                        <Input
                                                            type="number"
                                                            value={stakeAmount}
                                                            onChange={(e) => setStakeAmount(e.target.value)}
                                                            placeholder="0.00"
                                                        />
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="absolute right-1 top-1 h-7 text-xs"
                                                            onClick={() => setStakeAmount('1000')}
                                                        >
                                                            MAX
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span>Lock Period</span>
                                                        <span className="font-mono">{pool.lock_period_days} Days</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Est. Daily Rewards</span>
                                                        <span className="font-mono text-green-500">
                                                            +{stakeAmount ? ((Number(stakeAmount) * (pool.apy_percentage / 100)) / 365).toFixed(4) : '0.00'} FLOW
                                                        </span>
                                                    </div>
                                                </div>

                                                <Button className="w-full" onClick={handleStake}>
                                                    Confirm Stake
                                                </Button>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Active Stakes */}
                    {myStakes.length > 0 && (
                        <div>
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Wallet className="h-5 w-5" />
                                Active Stakes
                            </h2>
                            <div className="space-y-4">
                                {myStakes.map((stake) => (
                                    <Card key={stake.id}>
                                        <CardContent className="p-6 flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold">{stake.pool?.name || 'Pool'}</h3>
                                                    <Badge variant="outline">{stake.pool?.apy_percentage || 0}% APY</Badge>
                                                </div>
                                                <div className="flex gap-4 text-sm text-muted-foreground">
                                                    <span>Staked: {Number(stake.amount).toLocaleString()} FLOW</span>
                                                    {stake.unlocks_at && (
                                                        <span>Unlocks: {new Date(stake.unlocks_at).toLocaleDateString()}</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="text-xs text-muted-foreground uppercase font-bold">Unclaimed Rewards</p>
                                                    <p className="font-mono font-medium text-green-500">
                                                        +{Number(stake.rewards_earned || 0).toFixed(4)} FLOW
                                                    </p>
                                                </div>
                                                <Button size="sm" onClick={() => handleClaim(stake.id)}>
                                                    Claim
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="governance" className="space-y-6">
                    <div className="flex justify-between items-center bg-muted/30 p-6 rounded-xl border">
                        <div>
                            <h2 className="text-xl font-bold mb-2">FlowAI DAO</h2>
                            <p className="text-muted-foreground max-w-xl">
                                Vote on platform upgrades, fee structures, and feature rollouts. Your voting power is determined by your staked $FLOW amount.
                            </p>
                        </div>
                        <div className="text-right">
                            <Badge variant="secondary" className="mb-2">Your Voting Power</Badge>
                            <p className="text-2xl font-bold font-mono">{stats.totalStaked.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {proposals.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                <p>No active proposals at the moment.</p>
                                <p className="text-sm">Check back soon for governance votes!</p>
                            </div>
                        ) : proposals.map((proposal) => {
                            const totalVotes = Number(proposal.votes_for) + Number(proposal.votes_against);
                            const forPercentage = totalVotes > 0 ? (Number(proposal.votes_for) / totalVotes) * 100 : 50;

                            return (
                                <Card key={proposal.id}>
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="capitalize">{proposal.category}</Badge>
                                                    <span className="text-xs text-muted-foreground">Ends {new Date(proposal.end_time).toLocaleDateString()}</span>
                                                </div>
                                                <CardTitle>{proposal.title}</CardTitle>
                                            </div>
                                            <Badge variant={proposal.status === 'active' ? 'default' : 'secondary'}>
                                                {proposal.status}
                                            </Badge>
                                        </div>
                                        <CardDescription className="mt-2">{proposal.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-green-500">For: {Number(proposal.votes_for).toLocaleString()}</span>
                                                <span className="text-red-500">Against: {Number(proposal.votes_against).toLocaleString()}</span>
                                            </div>
                                            <Progress value={forPercentage} className="h-2" />
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                className="flex-1 border-green-500/50 hover:bg-green-500/10"
                                                onClick={() => handleVote(proposal.id, 'for')}
                                            >
                                                <Check className="h-4 w-4 mr-2 text-green-500" />
                                                Vote For
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="flex-1 border-red-500/50 hover:bg-red-500/10"
                                                onClick={() => handleVote(proposal.id, 'against')}
                                            >
                                                <X className="h-4 w-4 mr-2 text-red-500" />
                                                Vote Against
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default TokenStaking;
