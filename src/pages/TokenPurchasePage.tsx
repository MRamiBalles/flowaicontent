import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Coins, ArrowUpRight, ArrowDownLeft, Zap, Gift } from 'lucide-react';
import { toast } from 'sonner';

import { supabase } from '@/integrations/supabase/client';

interface TokenPricing {
    base_rate: number;
    bonus_tiers: Array<{ min_purchase: number; bonus_percent: number }>;
    cashout_fee_percent: number;
    minimum_cashout: number;
}

export const TokenPurchasePage = () => {
    const [balance, setBalance] = useState(0);
    const [amount, setAmount] = useState(10);
    const [pricing, setPricing] = useState<TokenPricing | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchBalance();
        fetchPricing();
    }, []);

    const fetchBalance = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (!token) return;

            const response = await fetch('http://localhost:8000/v1/tokens/balance', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            setBalance(data.balance);
        } catch (error) {
            console.error('Failed to load balance');
        }
    };

    const fetchPricing = async () => {
        try {
            const response = await fetch('http://localhost:8000/v1/tokens/pricing');
            const data = await response.json();
            setPricing(data);
        } catch (error) {
            console.error('Failed to load pricing');
        }
    };

    const calculateTokens = (usd: number) => {
        if (!pricing) return 0;

        const baseTokens = usd * pricing.base_rate;

        // Find applicable bonus tier
        const tier = [...pricing.bonus_tiers]
            .reverse()
            .find(t => usd >= t.min_purchase);

        if (tier) {
            const bonus = baseTokens * (tier.bonus_percent / 100);
            return Math.floor(baseTokens + bonus);
        }

        return Math.floor(baseTokens);
    };

    const handlePurchase = async () => {
        setLoading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (!token) {
                toast.error('Please login to purchase tokens');
                return;
            }

            const response = await fetch('http://localhost:8000/v1/tokens/purchase', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount_usd: amount,
                    success_url: `${window.location.origin}/wallet?purchase=success`,
                    cancel_url: `${window.location.origin}/wallet?purchase=canceled`
                })
            });

            if (!response.ok) throw new Error('Purchase failed');

            const data = await response.json();
            window.location.href = data.url;
        } catch (error: any) {
            toast.error(error.message);
            setLoading(false);
        }
    };

    const quickAmounts = [10, 25, 50, 100];
    const tokens = calculateTokens(amount);
    const baseTokens = pricing ? amount * pricing.base_rate : 0;
    const bonusTokens = tokens - baseTokens;

    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold text-white mb-4 flex items-center justify-center gap-3">
                        <Coins className="w-12 h-12 text-yellow-400" />
                        Buy FLO Tokens
                    </h1>
                    <p className="text-xl text-zinc-400">
                        Power your FlowAI experience with tokens
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Purchase Form */}
                    <Card className="glass-panel p-8 border-yellow-500/30">
                        <h2 className="text-2xl font-bold text-white mb-6">Purchase Tokens</h2>

                        {/* Current Balance */}
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
                            <p className="text-sm text-zinc-400 mb-1">Your Balance</p>
                            <p className="text-3xl font-bold text-yellow-400 flex items-center gap-2">
                                <Coins className="w-8 h-8" />
                                {balance.toLocaleString()} FLO
                            </p>
                        </div>

                        {/* Amount Input */}
                        <div className="mb-6">
                            <label className="text-sm text-zinc-400 mb-2 block">Amount (USD)</label>
                            <Input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(Number(e.target.value))}
                                min={1}
                                className="bg-black/50 border-white/20 text-white text-2xl font-bold"
                            />
                        </div>

                        {/* Quick Amount Buttons */}
                        <div className="grid grid-cols-4 gap-2 mb-6">
                            {quickAmounts.map((amt) => (
                                <Button
                                    key={amt}
                                    onClick={() => setAmount(amt)}
                                    variant="outline"
                                    className={`${amount === amt
                                        ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300'
                                        : 'border-white/20'
                                        }`}
                                >
                                    ${amt}
                                </Button>
                            ))}
                        </div>

                        {/* Token Preview */}
                        <div className="bg-black/40 rounded-lg p-4 mb-6 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-400">Base Tokens</span>
                                <span className="text-white font-mono">{baseTokens.toLocaleString()} FLO</span>
                            </div>
                            {bonusTokens > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-green-400 flex items-center gap-1">
                                        <Gift className="w-4 h-4" />
                                        Bonus Tokens
                                    </span>
                                    <span className="text-green-400 font-mono">+{bonusTokens.toLocaleString()} FLO</span>
                                </div>
                            )}
                            <div className="border-t border-white/10 pt-2 flex justify-between">
                                <span className="text-white font-bold">Total</span>
                                <span className="text-yellow-400 font-bold text-lg">{tokens.toLocaleString()} FLO</span>
                            </div>
                        </div>

                        {/* Purchase Button */}
                        <Button
                            onClick={handlePurchase}
                            disabled={loading || amount < 1}
                            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold text-lg h-12"
                        >
                            {loading ? (
                                'Processing...'
                            ) : (
                                <>
                                    <ArrowUpRight className="w-5 h-5 mr-2" />
                                    Purchase for ${amount}
                                </>
                            )}
                        </Button>
                    </Card>

                    {/* Info Panel */}
                    <div className="space-y-6">
                        {/* Bonus Tiers */}
                        <Card className="glass-panel p-6 border-white/10">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-yellow-400" />
                                Bonus Tiers
                            </h3>
                            <div className="space-y-3">
                                {pricing?.bonus_tiers.map((tier) => (
                                    <div
                                        key={tier.min_purchase}
                                        className={`p-3 rounded-lg border ${amount >= tier.min_purchase
                                            ? 'bg-yellow-500/10 border-yellow-500/50'
                                            : 'bg-white/5 border-white/10'
                                            }`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-white font-bold">${tier.min_purchase}+</p>
                                                <p className="text-xs text-zinc-500">Purchase amount</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-green-400 font-bold">+{tier.bonus_percent}%</p>
                                                <p className="text-xs text-zinc-500">Bonus</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Use Cases */}
                        <Card className="glass-panel p-6 border-white/10">
                            <h3 className="text-xl font-bold text-white mb-4">What can I do with tokens?</h3>
                            <ul className="space-y-3 text-sm text-zinc-400">
                                <li className="flex items-start gap-2">
                                    <span className="text-purple-400">💜</span>
                                    Tip your favorite creators
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-400">🚀</span>
                                    Boost your clips to trending
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-yellow-400">💎</span>
                                    Create bounties for custom content
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-400">💰</span>
                                    Cash out earnings (20% fee)
                                </li>
                            </ul>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};
