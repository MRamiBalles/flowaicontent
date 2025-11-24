import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Coins, TrendingUp, History } from 'lucide-react';

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

export const WalletCard = ({ userId }: { userId: string }) => {
    const [wallet, setWallet] = useState<WalletData | null>(null);

    const fetchBalance = async () => {
        try {
            const response = await fetch(`http://localhost:8000/api/v1/economy/balance/${userId}`);
            if (response.ok) {
                const data = await response.json();
                setWallet(data);
            }
        } catch (error) {
            console.error("Failed to fetch wallet:", error);
        }
    };

    useEffect(() => {
        fetchBalance();
        // Poll every 5 seconds to update balance in real-time
        const interval = setInterval(fetchBalance, 5000);
        return () => clearInterval(interval);
    }, [userId]);

    if (!wallet) return null;

    return (
        <Card className="p-4 bg-gradient-to-br from-yellow-900/20 to-black border-yellow-500/20 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-yellow-500/10 rounded-full">
                        <Coins className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm text-yellow-500">Attention Wallet</h3>
                        <p className="text-[10px] text-muted-foreground">Proof-of-Attention Rewards</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold font-mono text-white">
                        {wallet.balance.toFixed(2)} <span className="text-xs text-yellow-500">TKN</span>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    <History className="w-3 h-3" /> Recent Activity
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-yellow-500/20">
                    {wallet.transactions.slice().reverse().slice(0, 5).map((tx, i) => (
                        <div key={i} className="flex justify-between items-center text-xs p-1.5 rounded bg-white/5 hover:bg-white/10 transition-colors">
                            <span className="truncate max-w-[150px] text-zinc-300">{tx.reason}</span>
                            <span className="font-mono text-green-400 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                +{tx.amount.toFixed(2)}
                            </span>
                        </div>
                    ))}
                    {wallet.transactions.length === 0 && (
                        <div className="text-center text-xs text-muted-foreground py-2 italic">
                            No transactions yet. Start watching to earn!
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};
