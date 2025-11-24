import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BarChart3, Zap, Calendar, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

export const SubscriptionSettings = () => {
    const [subscription, setSubscription] = useState<any>(null);
    const [usage, setUsage] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSubscriptionData();
        fetchUsageData();
    }, []);

    const fetchSubscriptionData = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (token) {
                const response = await fetch('http://localhost:8000/v1/subscriptions/current', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await response.json();
                setSubscription(data);
            }
        } catch (error) {
            toast.error('Failed to load subscription data');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsageData = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (token) {
                const response = await fetch('http://localhost:8000/v1/subscriptions/usage', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await response.json();
                setUsage(data.usage);
            }
        } catch (error) {
            console.error('Failed to load usage data');
        }
    };

    const handleCancelSubscription = async () => {
        if (!confirm('Are you sure you want to cancel your subscription? You\'ll keep access until the end of your billing period.')) {
            return;
        }

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (!token) return;

            const response = await fetch('http://localhost:8000/v1/subscriptions/cancel', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                toast.success('Subscription will be canceled at period end');
                fetchSubscriptionData();
            } else {
                throw new Error('Failed to cancel');
            }
        } catch (error) {
            toast.error('Failed to cancel subscription');
        }
    };

    const handleReactivate = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (!token) return;

            const response = await fetch('http://localhost:8000/v1/subscriptions/reactivate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                toast.success('Subscription reactivated!');
                fetchSubscriptionData();
            } else {
                throw new Error('Failed to reactivate');
            }
        } catch (error) {
            toast.error('Failed to reactivate subscription');
        }
    };

    const handleManageBilling = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (!token) return;

            const response = await fetch('http://localhost:8000/v1/subscriptions/portal?return_url=' + window.location.href, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            window.location.href = data.url;
        } catch (error) {
            toast.error('Failed to open billing portal');
        }
    };

    if (loading) {
        return <div className="text-white">Loading...</div>;
    }

    const usagePercentage = usage ? (usage.generations_today / usage.daily_limit) * 100 : 0;

    return (
        <div className="max-w-4xl mx-auto p-8 space-y-6">
            <h1 className="text-3xl font-bold text-white mb-8">Subscription & Usage</h1>

            {/* Current Plan */}
            <Card className="glass-panel p-6 border-white/10">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-400" />
                        Current Plan
                    </h2>
                    <span className="text-2xl font-bold text-purple-400 uppercase">{subscription?.tier || 'FREE'}</span>
                </div>

                {subscription?.tier !== 'free' && (
                    <div className="space-y-3 text-sm text-zinc-400">
                        <div className="flex justify-between">
                            <span>Status:</span>
                            <span className={`font-bold ${subscription?.status === 'active' ? 'text-green-400' : 'text-orange-400'}`}>
                                {subscription?.status?.toUpperCase()}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>Renews on:</span>
                            <span className="text-white">{new Date(subscription?.current_period_end).toLocaleDateString()}</span>
                        </div>
                        {subscription?.cancel_at_period_end && (
                            <div className="bg-orange-500/10 border border-orange-500/30 rounded p-3 text-orange-400 text-xs">
                                ⚠️ Your subscription will be canceled on {new Date(subscription?.current_period_end).toLocaleDateString()}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex gap-3 mt-6">
                    {subscription?.tier === 'free' ? (
                        <Button
                            onClick={() => window.location.href = '/pricing'}
                            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                        >
                            Upgrade Plan
                        </Button>
                    ) : (
                        <>
                            <Button
                                onClick={handleManageBilling}
                                variant="outline"
                                className="flex-1 border-white/20"
                            >
                                <CreditCard className="w-4 h-4 mr-2" />
                                Manage Billing
                            </Button>
                            {subscription?.cancel_at_period_end ? (
                                <Button
                                    onClick={handleReactivate}
                                    className="flex-1 bg-green-500/20 hover:bg-green-500/40 text-green-300"
                                >
                                    Reactivate
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleCancelSubscription}
                                    variant="outline"
                                    className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10"
                                >
                                    Cancel Plan
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </Card>

            {/* Usage Stats */}
            {usage && (
                <Card className="glass-panel p-6 border-white/10">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                        <BarChart3 className="w-5 h-5 text-blue-400" />
                        Usage This Month
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-zinc-400">Generations Today</span>
                                <span className="text-white font-bold">
                                    {usage.generations_today} / {usage.daily_limit === 999999 ? '∞' : usage.daily_limit}
                                </span>
                            </div>
                            <Progress value={Math.min(usagePercentage, 100)} className="h-2" />
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                            <div>
                                <div className="text-xs text-zinc-500 mb-1">Remaining Today</div>
                                <div className="text-2xl font-bold text-white">
                                    {usage.remaining === 999999 ? '∞' : usage.remaining}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-zinc-500 mb-1 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Resets At
                                </div>
                                <div className="text-sm font-mono text-zinc-400">
                                    {new Date(usage.reset_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>

                        {usagePercentage > 80 && usage.daily_limit < 999999 && (
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3 text-yellow-400 text-xs flex items-start gap-2">
                                <Zap className="w-4 h-4 shrink-0 mt-0.5" />
                                <div>
                                    You're running low on generations! Consider upgrading to a higher tier for unlimited access.
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
};
