import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import {
    TrendingUp, TrendingDown, Eye, Heart, DollarSign, Users,
    Lightbulb, RefreshCw, Play, ExternalLink, Loader2
} from 'lucide-react';

interface AnalyticsSummary {
    totalViews: number;
    totalRevenue: number;
    totalFollowers: number;
    avgEngagement: string;
}

interface ChartDataPoint {
    date: string;
    total_views: number;
    total_likes: number;
    revenue_cents: number;
}

interface AIInsight {
    id: string;
    insight_type: string;
    title: string;
    description: string;
    action_suggestion: string;
    confidence_score: number;
}

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

const CreatorAnalytics = () => {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [insights, setInsights] = useState<AIInsight[]>([]);

    useEffect(() => {
        if (user) loadDashboard();
    }, [user]);

    const loadDashboard = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analytics-insights`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
                },
                body: JSON.stringify({ action: 'get_dashboard' }),
            });

            if (!response.ok) throw new Error('Failed to load analytics');

            const data = await response.json();
            setSummary(data.summary);
            setChartData(data.chartData);
            setInsights(data.insights);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load analytics');
        } finally {
            setIsLoading(false);
        }
    };

    const generateInsights = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analytics-insights`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
                },
                body: JSON.stringify({ action: 'generate_insights' }),
            });

            if (response.ok) {
                toast.success('AI insights generated!');
                loadDashboard();
            }
        } catch (error) {
            toast.error('Failed to generate insights');
        }
    };

    const formatCurrency = (cents: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(cents / 100);
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <TrendingUp className="h-8 w-8 text-primary" />
                        Creator Analytics Pro
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        AI-powered insights to grow your audience
                    </p>
                </div>
                <Button onClick={loadDashboard} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Views</p>
                                <p className="text-2xl font-bold">{formatNumber(summary?.totalViews || 0)}</p>
                            </div>
                            <Eye className="h-8 w-8 text-purple-500 opacity-80" />
                        </div>
                        <div className="flex items-center gap-1 mt-2 text-sm text-green-500">
                            <TrendingUp className="h-3 w-3" />
                            +12.5% vs last month
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Revenue</p>
                                <p className="text-2xl font-bold">{formatCurrency(summary?.totalRevenue || 0)}</p>
                            </div>
                            <DollarSign className="h-8 w-8 text-green-500 opacity-80" />
                        </div>
                        <div className="flex items-center gap-1 mt-2 text-sm text-green-500">
                            <TrendingUp className="h-3 w-3" />
                            +8.3% vs last month
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">New Followers</p>
                                <p className="text-2xl font-bold">{formatNumber(summary?.totalFollowers || 0)}</p>
                            </div>
                            <Users className="h-8 w-8 text-blue-500 opacity-80" />
                        </div>
                        <div className="flex items-center gap-1 mt-2 text-sm text-green-500">
                            <TrendingUp className="h-3 w-3" />
                            +24.1% vs last month
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-pink-500/10 to-pink-500/5 border-pink-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Engagement Rate</p>
                                <p className="text-2xl font-bold">{summary?.avgEngagement || '0'}%</p>
                            </div>
                            <Heart className="h-8 w-8 text-pink-500 opacity-80" />
                        </div>
                        <div className="flex items-center gap-1 mt-2 text-sm text-red-500">
                            <TrendingDown className="h-3 w-3" />
                            -2.1% vs last month
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="insights">AI Insights</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    {/* Views Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Views Over Time</CardTitle>
                            <CardDescription>Last 30 days performance</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                        <XAxis
                                            dataKey="date"
                                            stroke="#888"
                                            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        />
                                        <YAxis stroke="#888" />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333' }}
                                            labelFormatter={(value) => new Date(value).toLocaleDateString()}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="total_views"
                                            stroke="#8b5cf6"
                                            strokeWidth={2}
                                            dot={false}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Revenue Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Revenue Breakdown</CardTitle>
                            <CardDescription>Daily earnings over the last 30 days</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                        <XAxis
                                            dataKey="date"
                                            stroke="#888"
                                            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { day: 'numeric' })}
                                        />
                                        <YAxis stroke="#888" tickFormatter={(value) => `$${value / 100}`} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333' }}
                                            formatter={(value: number) => formatCurrency(value)}
                                        />
                                        <Bar dataKey="revenue_cents" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="insights" className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">AI-Powered Insights</h2>
                        <Button onClick={generateInsights}>
                            <Lightbulb className="h-4 w-4 mr-2" />
                            Generate New Insights
                        </Button>
                    </div>

                    {insights.length === 0 ? (
                        <Card className="text-center py-12">
                            <Lightbulb className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <p className="text-muted-foreground">No insights yet. Click "Generate New Insights" to get AI recommendations.</p>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {insights.map((insight) => (
                                <Card key={insight.id} className="hover:border-primary/50 transition-colors">
                                    <CardContent className="pt-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Badge variant="secondary">{insight.insight_type.replace('_', ' ')}</Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        {Math.round(insight.confidence_score * 100)}% confidence
                                                    </span>
                                                </div>
                                                <h3 className="font-semibold text-lg">{insight.title}</h3>
                                                <p className="text-muted-foreground mt-1">{insight.description}</p>
                                                {insight.action_suggestion && (
                                                    <div className="mt-3 p-3 bg-primary/10 rounded-lg">
                                                        <p className="text-sm font-medium">💡 Suggested Action</p>
                                                        <p className="text-sm text-muted-foreground">{insight.action_suggestion}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default CreatorAnalytics;
