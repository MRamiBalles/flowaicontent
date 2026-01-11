import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Coins, TrendingUp, History, Sparkles } from 'lucide-react';
import { WalletChart } from '@/components/WalletChart';
import { API_URL } from '@/lib/api';
interface Transaction {
    timestamp: number;
    amount: number;
    reason: string;
    type: string;
}

interface WalletData {
    balance: number;
    transactions: Transaction[];
}

/**
 * WalletCard Component
 * 
 * Displays Proof-of-Attention (PoA) token wallet with real-time updates.
 * 
 * Features:
 * - Real-time balance (fetches every 5s)
 * - Animated balance increase notifications
 * - Transaction history (last 5)
 * - Visual chart of earnings
 * - Glow effect when tokens are earned
 * 
 * PoA Integration:
 * - Connects to localhost:8000/api/v1/economy/balance
 * - Shows TKN balance earned from watching content
 * - Displays transaction reasons (Watch Video, Complete Quest, etc.)
 * 
 * Animations:
 * - Scale + rotate on new tokens
 * - Glow effect pulse
 * - Balance color change to yellow
 * - Sparkles icon spin
 * 
 * NOTE: Currently uses localhost API.
 * In production, should use environment variable.
 */
export const WalletCard = ({ userId }: { userId: string }) => {
    const [wallet, setWallet] = useState<WalletData | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);

    const fetchBalance = async () => {
        try {
            const response = await fetch(`${API_URL}/economy/balance/${userId}`);
            if (response.ok) {
                const data = await response.json();
                setWallet(prev => {
                    if (prev && data.balance > prev.balance) {
                        setIsAnimating(true);
                        setTimeout(() => setIsAnimating(false), 2000);
                    }
                    return data;
                });
            }
        } catch (error) {
            console.error("Failed to fetch wallet:", error);
        }
    };

    useEffect(() => {
        fetchBalance();
        const interval = setInterval(fetchBalance, 5000);
        return () => clearInterval(interval);
    }, [userId]);

    if (!wallet) return null;

    return (
        <Card className="relative overflow-hidden p-6 glass-panel border-yellow-500/10 group">
            {/* Background Glow Effect */}
            <div className={`absolute -right-10 -top-10 w-40 h-40 bg-yellow-500/20 rounded-full blur-3xl transition-opacity duration-1000 ${isAnimating ? 'opacity-100' : 'opacity-20'}`} />

            <div className="relative z-10 flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/20 transition-transform duration-500 ${isAnimating ? 'scale-110 rotate-12' : ''}`}>
                        <Coins className={`w-6 h-6 text-yellow-500 ${isAnimating ? 'animate-bounce' : ''}`} />
                    </div>
                    <div>
                        <h3 className="font-bold text-base text-white flex items-center gap-2">
                            Attention Wallet
                            {isAnimating && <Sparkles className="w-3 h-3 text-yellow-400 animate-spin" />}
                        </h3>
                        <p className="text-xs text-zinc-400">Proof-of-Attention Rewards</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className={`text-3xl font-black font-mono tracking-tight transition-all duration-300 ${isAnimating ? 'text-yellow-400 scale-105' : 'text-white'}`}>
                        {wallet.balance.toFixed(2)}
                    </div>
                    <div className="text-[10px] font-bold text-yellow-500/80 tracking-widest uppercase">TKN Balance</div>
                </div>
            </div>

            {/* Neon Chart */}
            <WalletChart />

            <div className="space-y-3 relative z-10 mt-4">
                <div className="flex items-center gap-2 text-xs text-zinc-500 uppercase tracking-wider font-bold pb-2 border-b border-white/5">
                    <History className="w-3 h-3" /> Recent Activity
                </div>
                <div className="space-y-2 max-h-[140px] overflow-y-auto pr-2 custom-scrollbar">
                    {wallet.transactions.slice().reverse().slice(0, 5).map((tx, i) => (
                        <div key={i} className="flex justify-between items-center text-xs p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-transparent hover:border-white/5 group/item">
                            <span className="truncate max-w-[180px] text-zinc-400 group-hover/item:text-zinc-200 transition-colors">{tx.reason}</span>
                            <span className="font-mono font-bold text-green-400 flex items-center gap-1 bg-green-500/10 px-1.5 py-0.5 rounded">
                                <TrendingUp className="w-3 h-3" />
                                +{tx.amount.toFixed(2)}
                            </span>
                        </div>
                    ))}
                    {wallet.transactions.length === 0 && (
                        <div className="text-center text-xs text-zinc-600 py-4 italic">
                            No transactions yet. Start watching to earn!
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};
