import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import {
    DollarSign,
    Users,
    TrendingUp,
    TrendingDown,
    BarChart3,
    PieChart,
    Activity
} from 'lucide-react';

interface Metrics {
    mrr: number;                           // Monthly Recurring Revenue
    arr: number;                           // Annual Recurring Revenue (MRR * 12)
    active_subscribers: number;
    new_subscribers_this_month: number;
    churned_subscribers_this_month: number;
    churn_rate: number;                    // % monthly churn
    cac: number;                           // Customer Acquisition Cost
    ltv: number;                           // Lifetime Value
    ltv_cac_ratio: number;                 // Target: 3x+
    conversion_rate: number;               // % free to paid
    arpu: number;                          // Average Revenue Per User
    total_users: number;
    paying_users: number;
}

/**
 * AnalyticsDashboard Component
 * 
 * Real-time SaaS business metrics dashboard.
 * 
 * Key Metrics Displayed:
 * - MRR/ARR: Monthly and annual recurring revenue
 * - Active Subscribers: Current paying customer count
 * - Churn Rate: % customers canceling monthly (target: <5%)
 * - Conversion Rate: Free to paid conversion %
 * - ARPU: Average revenue per user per month
 * - LTV/CAC Ratio: Customer lifetime value vs acquisition cost (target: 3x+)
 * 
 * API Integration:
 * - Fetches from local analytics API (port 8000)
 * - Uses Supabase auth token for authentication
 * - Updates in real-time
 * 
 * Health Indicators:
 * - Green: MRR growing, churn <5%, LTV/CAC >3x
 * - Orange/Red: Metrics below target
 * 
 * Note: Currently uses hardcoded API URL (localhost:8000)
 * In production, should use environment variable
 */
export const AnalyticsDashboard = () => {
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMetrics();
    }, []);

    const fetchMetrics = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (token) {
                const response = await fetch('http://localhost:8000/v1/analytics/metrics', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await response.json();
                setMetrics(data);
            }
        } catch (error) {
            console.error('Failed to load metrics');
        } finally {
            setLoading(false);
        }
    };

    if (loading || !metrics) {
        return <div className="text-white p-8">Loading analytics...</div>;
    }

    const formatCurrency = (amount: number) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    const formatPercent = (value: number) => `${value.toFixed(1)}%`;

    const metricCards = [
        {
            title: 'MRR',
            value: formatCurrency(metrics.mrr),
            subtitle: `ARR: ${formatCurrency(metrics.arr)}`,
            icon: DollarSign,
            color: 'green',
            trend: metrics.new_subscribers_this_month > metrics.churned_subscribers_this_month ? 'up' : 'down'
        },
        {
            title: 'Active Subscribers',
            value: metrics.active_subscribers.toLocaleString(),
            subtitle: `${metrics.new_subscribers_this_month} new this month`,
            icon: Users,
            color: 'blue'
        },
        {
            title: 'Churn Rate',
            value: formatPercent(metrics.churn_rate),
            subtitle: `${metrics.churned_subscribers_this_month} churned`,
            icon: Activity,
            color: metrics.churn_rate < 5 ? 'green' : 'red'
        },
        {
            title: 'Conversion Rate',
            value: formatPercent(metrics.conversion_rate),
            subtitle: `${metrics.paying_users} / ${metrics.total_users} users`,
            icon: TrendingUp,
            color: 'purple'
        },
        {
            title: 'ARPU',
            value: formatCurrency(metrics.arpu),
            subtitle: 'Avg revenue per user/month',
            icon: BarChart3,
            color: 'yellow'
        },
        {
            title: 'LTV / CAC',
            value: metrics.ltv_cac_ratio.toFixed(1) + 'x',
            subtitle: `LTV: ${formatCurrency(metrics.ltv)} | CAC: ${formatCurrency(metrics.cac)}`,
            icon: PieChart,
            color: metrics.ltv_cac_ratio >= 3 ? 'green' : 'orange'
        }
    ];

    const getColorClass = (color: string) => {
        const colors: Record<string, string> = {
            green: 'from-green-500/20 to-emerald-500/10 border-green-500/50',
            blue: 'from-blue-500/20 to-cyan-500/10 border-blue-500/50',
            red: 'from-red-500/20 to-orange-500/10 border-red-500/50',
            purple: 'from-purple-500/20 to-pink-500/10 border-purple-500/50',
            yellow: 'from-yellow-500/20 to-orange-500/10 border-yellow-500/50',
            orange: 'from-orange-500/20 to-red-500/10 border-orange-500/50'
        };
        return colors[color] || colors.blue;
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Analytics Dashboard</h1>
                    <p className="text-zinc-400">Real-time business metrics and insights</p>
                </div>

                {/* Metric Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {metricCards.map((card) => {
                        const Icon = card.icon;
                        return (
                            <Card
                                key={card.title}
                                className={`p-6 bg-gradient-to-br ${getColorClass(card.color)} border-2 backdrop-blur-sm`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <p className="text-sm text-zinc-400 mb-1">{card.title}</p>
                                        <p className="text-3xl font-bold text-white">{card.value}</p>
                                    </div>
                                    <div className="bg-white/10 p-3 rounded-full">
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {card.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-400" />}
                                    {card.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-400" />}
                                    <p className="text-xs text-zinc-500">{card.subtitle}</p>
                                </div>
                            </Card>
                        );
                    })}
                </div>

                {/* Health Indicators */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Conversion Funnel */}
                    <Card className="glass-panel p-6 border-white/10">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-400" />
                            Conversion Funnel
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-zinc-400">Total Users</span>
                                    <span className="text-white font-bold">{metrics.total_users}</span>
                                </div>
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500" style={{ width: '100%' }} />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-zinc-400">Paying Users</span>
                                    <span className="text-white font-bold">{metrics.paying_users}</span>
                                </div>
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-green-500"
                                        style={{ width: `${metrics.conversion_rate}%` }}
                                    />
                                </div>
                            </div>

                            <div className="pt-2 border-t border-white/10">
                                <span className="text-xs text-zinc-500">
                                    Conversion Rate: <span className="text-white font-bold">{formatPercent(metrics.conversion_rate)}</span>
                                </span>
                            </div>
                        </div>
                    </Card>

                    {/* Unit Economics */}
                    <Card className="glass-panel p-6 border-white/10">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-green-400" />
                            Unit Economics
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-zinc-400">Customer Lifetime Value</span>
                                <span className="text-2xl font-bold text-white">{formatCurrency(metrics.ltv)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-zinc-400">Customer Acquisition Cost</span>
                                <span className="text-2xl font-bold text-white">{formatCurrency(metrics.cac)}</span>
                            </div>
                            <div className="pt-3 border-t border-white/10">
                                <div className="flex justify-between items-center">
                                    <span className="text-zinc-400">LTV / CAC Ratio</span>
                                    <span className={`text-3xl font-bold ${metrics.ltv_cac_ratio >= 3 ? 'text-green-400' : 'text-orange-400'}`}>
                                        {metrics.ltv_cac_ratio.toFixed(1)}x
                                    </span>
                                </div>
                                <p className="text-xs text-zinc-600 mt-2">
                                    {metrics.ltv_cac_ratio >= 3
                                        ? '✅ Healthy ratio (target: 3x+)'
                                        : '⚠️ Below target (aim for 3x)'}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
