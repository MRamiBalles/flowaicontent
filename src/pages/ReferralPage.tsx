import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Copy, Mail, TrendingUp, Award, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { API_URL } from '@/lib/api';

interface ReferralStats {
    total_invites: number;
    total_signups: number;
    total_paying: number;
    total_earned: number;
    conversion_rate: number;
}

export const ReferralPage = () => {
    const [code, setCode] = useState('');
    const [link, setLink] = useState('');
    const [stats, setStats] = useState<ReferralStats | null>(null);
    const [emails, setEmails] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchReferralData();
    }, []);

    const fetchReferralData = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (token) {
                // Get referral code
                const codeRes = await fetch(`${API_URL.replace('/api/v1', '/v1')}/referrals/my-code`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const codeData = await codeRes.json();
                setCode(codeData.code);
                setLink(codeData.link);

                // Get stats
                const statsRes = await fetch(`${API_URL.replace('/api/v1', '/v1')}/referrals/stats`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const statsData = await statsRes.json();
                setStats(statsData);
            }
        } catch (error) {
            toast.error('Failed to load referral data');
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(link);
        toast.success('Link copied to clipboard!');
    };

    const sendInvites = async () => {
        if (!emails.trim()) {
            toast.error('Please enter at least one email');
            return;
        }

        setLoading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (!token) {
                toast.error('Please login to send invites');
                return;
            }

            const emailList = emails.split(',').map(e => e.trim()).filter(e => e);

            const response = await fetch(`${API_URL.replace('/api/v1', '/v1')}/referrals/invite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ emails: emailList })
            });

            if (!response.ok) throw new Error('Failed to send invites');

            const data = await response.json();
            toast.success(`Sent ${data.invited_count} invites!`);
            setEmails('');
            fetchReferralData();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold text-white mb-4 flex items-center justify-center gap-3">
                        <Users className="w-12 h-12 text-blue-400" />
                        Invite Friends, Earn Tokens
                    </h1>
                    <p className="text-xl text-zinc-400">
                        Get <span className="text-green-400 font-bold">100 tokens</span> for every friend who signs up
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Referral Link Card */}
                    <Card className="glass-panel p-6 border-white/10">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                            <Gift className="w-6 h-6 text-purple-400" />
                            Your Referral Link
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-zinc-400 mb-2 block">Referral Code</label>
                                <div className="flex gap-2">
                                    <Input
                                        value={code}
                                        readOnly
                                        className="bg-black/50 border-white/20 text-white font-mono text-lg"
                                    />
                                    <Button
                                        onClick={copyLink}
                                        className="bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 border border-purple-500/50"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm text-zinc-400 mb-2 block">Share Link</label>
                                <div className="flex gap-2">
                                    <Input
                                        value={link}
                                        readOnly
                                        className="bg-black/50 border-white/20 text-white text-sm"
                                    />
                                    <Button
                                        onClick={copyLink}
                                        className="bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 border border-blue-500/50"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                                <h3 className="text-green-300 font-bold mb-2">How it Works</h3>
                                <ul className="space-y-1 text-sm text-zinc-300">
                                    <li>✅ Friend signs up → You get <span className="text-green-400 font-bold">100 tokens</span></li>
                                    <li>✅ They get <span className="text-green-400 font-bold">50 tokens</span> bonus!</li>
                                    <li>✅ Friend upgrades to PRO → You get <span className="text-green-400 font-bold">200 more</span></li>
                                </ul>
                            </div>
                        </div>
                    </Card>

                    {/* Invite by Email */}
                    <Card className="glass-panel p-6 border-white/10">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                            <Mail className="w-6 h-6 text-blue-400" />
                            Invite by Email
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-zinc-400 mb-2 block">
                                    Email addresses (comma separated)
                                </label>
                                <textarea
                                    value={emails}
                                    onChange={(e) => setEmails(e.target.value)}
                                    placeholder="friend1@email.com, friend2@email.com, ..."
                                    className="w-full h-32 bg-black/50 border border-white/20 rounded-lg p-3 text-white placeholder-zinc-600 resize-none"
                                />
                            </div>

                            <Button
                                onClick={sendInvites}
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold"
                            >
                                {loading ? 'Sending...' : (
                                    <>
                                        <Mail className="w-4 h-4 mr-2" />
                                        Send Invites
                                    </>
                                )}
                            </Button>

                            <p className="text-xs text-zinc-500 text-center">
                                We'll send them a personalized invite with your referral link
                            </p>
                        </div>
                    </Card>
                </div>

                {/* Stats Grid */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <Card className="glass-panel p-4 border-white/10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-zinc-400">Total Invites</p>
                                    <p className="text-3xl font-bold text-white">{stats.total_invites}</p>
                                </div>
                                <Users className="w-8 h-8 text-blue-400" />
                            </div>
                        </Card>

                        <Card className="glass-panel p-4 border-white/10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-zinc-400">Sign Ups</p>
                                    <p className="text-3xl font-bold text-green-400">{stats.total_signups}</p>
                                </div>
                                <TrendingUp className="w-8 h-8 text-green-400" />
                            </div>
                        </Card>

                        <Card className="glass-panel p-4 border-white/10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-zinc-400">Converted</p>
                                    <p className="text-3xl font-bold text-purple-400">{stats.total_paying}</p>
                                </div>
                                <Award className="w-8 h-8 text-purple-400" />
                            </div>
                        </Card>

                        <Card className="glass-panel p-4 border-white/10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-zinc-400">Tokens Earned</p>
                                    <p className="text-3xl font-bold text-yellow-400">{stats.total_earned}</p>
                                </div>
                                <Gift className="w-8 h-8 text-yellow-400" />
                            </div>
                        </Card>
                    </div>
                )}

                {/* Conversion Rate */}
                {stats && stats.total_invites > 0 && (
                    <Card className="glass-panel p-6 border-white/10">
                        <h3 className="text-lg font-bold text-white mb-4">Your Performance</h3>
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-zinc-400">Conversion Rate</span>
                                    <span className="text-white font-bold">{stats.conversion_rate}%</span>
                                </div>
                                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-green-500 to-blue-500"
                                        style={{ width: `${Math.min(stats.conversion_rate, 100)}%` }}
                                    />
                                </div>
                            </div>
                            <div className="text-sm text-zinc-500">
                                {stats.conversion_rate > 20 ? '🔥 Amazing!' : stats.conversion_rate > 10 ? '👍 Good' : '💪 Keep going'}
                            </div>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};
