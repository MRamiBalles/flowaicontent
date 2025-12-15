import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Coins, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface CreditsBalanceProps {
    className?: string;
    autoRefresh?: boolean;      // Auto-fetch balance on mount
}

/**
 * CreditsBalance Component
 * 
 * Displays user's credit balance with manual refresh option.
 * 
 * Features:
 * - Real-time balance display
 * - Manual refresh button
 * - Auto-refresh on mount (optional)
 * - Spinner animation while loading
 * - Integrates with billing-engine Edge Function
 * 
 * Credits are used for:
 * - AI content generation (1-10 credits/generation)
 * - Voice cloning (50 credits per voice)
 * - Video rendering (varies by quality/duration)
 * - Text-to-speech (1 credit/1000 chars)
 * 
 * Integration:
 * - Calls billing-engine with action: 'get_balance'
 * - Returns numeric balance
 * - Errors silently to avoid spam (auto-refresh)
 */
export const CreditsBalance = ({ className = "", autoRefresh = true }: CreditsBalanceProps) => {
    const [balance, setBalance] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchBalance = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('billing-engine', {
                body: { action: 'get_balance' }
            });

            if (error) throw error;
            if (data && typeof data.balance === 'number') {
                setBalance(data.balance);
            }
        } catch (error) {
            console.error('Error fetching balance:', error);
            // Don't toast on auto-fetch to avoid spamming
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (autoRefresh) {
            fetchBalance();
        }
    }, [autoRefresh]);

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <Badge variant="secondary" className="px-3 py-1 text-sm font-medium flex items-center gap-2 bg-primary/10 hover:bg-primary/20 transition-colors border-primary/20">
                <Coins className="w-4 h-4 text-primary" />
                <span className="text-primary">{balance !== null ? balance.toLocaleString() : '---'}</span>
                <span className="text-muted-foreground ml-1">Credits</span>
            </Badge>
            <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-50 hover:opacity-100"
                onClick={fetchBalance}
                disabled={loading}
            >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
        </div>
    );
};
