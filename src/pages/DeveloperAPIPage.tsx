import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Code, Key, BarChart3, Copy, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { API_URL } from '@/lib/api';

interface APIKey {
    id: string;
    name: string;
    key: string;
    tier: string;
    rate_limit: number;
    created_at: string;
}

export const DeveloperAPIPage = () => {
    const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
    const [usage, setUsage] = useState<any>(null);
    const [showKey, setShowKey] = useState<Record<string, boolean>>({});
    const [creating, setCreating] = useState(false);
    const [keyName, setKeyName] = useState('');
    const [selectedTier, setSelectedTier] = useState('starter');

    useEffect(() => {
        fetchAPIData();
    }, []);

    const fetchAPIData = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (token) {
                // Get API keys
                const keysRes = await fetch(`${API_URL.replace('/api/v1', '/v1')}/api/keys`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const keysData = await keysRes.json();
                setApiKeys(keysData.keys || []);

                // Get usage stats
                const usageRes = await fetch(`${API_URL.replace('/api/v1', '/v1')}/api/usage`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const usageData = await usageRes.json();
                setUsage(usageData);
            }
        } catch (error) {
            console.error('Failed to load API data');
        }
    };

    const createAPIKey = async () => {
        if (!keyName.trim()) {
            toast.error('Please enter a key name');
            return;
        }

        setCreating(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (!token) {
                toast.error('Please login to create API key');
                setCreating(false);
                return;
            }

            const response = await fetch(`${API_URL.replace('/api/v1', '/v1')}/api/keys`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: keyName,
                    tier: selectedTier
                })
            });

            const data = await response.json();

            toast.success('API Key created! Save it now - you won\'t see it again.');

            // Show the key immediately
            setApiKeys([...apiKeys, {
                id: data.id,
                name: keyName,
                key: data.api_key,
                tier: selectedTier,
                rate_limit: data.rate_limit,
                created_at: new Date().toISOString()
            }]);

            setKeyName('');
            setCreating(false);
        } catch (error: any) {
            toast.error(error.message);
            setCreating(false);
        }
    };

    const copyKey = (key: string) => {
        navigator.clipboard.writeText(key);
        toast.success('API key copied!');
    };

    const pricing = {
        starter: { price: 0.10, limit: 100, name: 'Starter' },
        growth: { price: 0.08, limit: 1000, name: 'Growth' },
        enterprise: { price: 0.05, limit: 10000, name: 'Enterprise' }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-4xl font-bold text-white mb-4 flex items-center gap-3">
                        <Code className="w-10 h-10 text-blue-400" />
                        Developer API
                    </h1>
                    <p className="text-xl text-zinc-400">
                        Integrate FlowAI video generation into your applications
                    </p>
                </div>

                {/* Usage Stats */}
                {usage && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <Card className="glass-panel p-4">
                            <p className="text-sm text-zinc-400">This Month</p>
                            <p className="text-3xl font-bold text-white">{usage.total_generations}</p>
                            <p className="text-xs text-zinc-500">generations</p>
                        </Card>
                        <Card className="glass-panel p-4">
                            <p className="text-sm text-zinc-400">Total Cost</p>
                            <p className="text-3xl font-bold text-green-400">${usage.total_cost}</p>
                        </Card>
                        <Card className="glass-panel p-4">
                            <p className="text-sm text-zinc-400">Avg Cost/Gen</p>
                            <p className="text-3xl font-bold text-blue-400">${usage.average_cost_per_gen}</p>
                        </Card>
                    </div>
                )}

                {/* Pricing Tiers */}
                <Card className="glass-panel p-6 mb-8">
                    <h2 className="text-2xl font-bold text-white mb-4">API Pricing</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Object.entries(pricing).map(([tier, config]) => (
                            <div
                                key={tier}
                                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedTier === tier
                                    ? 'border-blue-500 bg-blue-500/10'
                                    : 'border-white/10 hover:border-white/30'
                                    }`}
                                onClick={() => setSelectedTier(tier)}
                            >
                                <h3 className="text-lg font-bold text-white mb-2">{config.name}</h3>
                                <p className="text-3xl font-bold text-blue-400 mb-2">${config.price}</p>
                                <p className="text-sm text-zinc-400 mb-4">per generation</p>
                                <ul className="text-sm text-zinc-300 space-y-1">
                                    <li>• {config.limit} req/hour</li>
                                    <li>• Full API access</li>
                                    <li>• Usage analytics</li>
                                </ul>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Create API Key */}
                <Card className="glass-panel p-6 mb-8">
                    <h2 className="text-2xl font-bold text-white mb-4">Create API Key</h2>
                    <div className="flex gap-4">
                        <Input
                            placeholder="Key name (e.g., Production)"
                            value={keyName}
                            onChange={(e) => setKeyName(e.target.value)}
                            className="flex-1 bg-black/50 border-white/20 text-white"
                        />
                        <Button
                            onClick={createAPIKey}
                            disabled={creating}
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                        >
                            <Key className="w-4 h-4 mr-2" />
                            {creating ? 'Creating...' : 'Create Key'}
                        </Button>
                    </div>
                </Card>

                {/* API Keys List */}
                <Card className="glass-panel p-6 mb-8">
                    <h2 className="text-2xl font-bold text-white mb-4">Your API Keys</h2>
                    <div className="space-y-3">
                        {apiKeys.map((key) => (
                            <div
                                key={key.id}
                                className="p-4 rounded-lg bg-white/5 border border-white/10"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <p className="font-bold text-white">{key.name}</p>
                                        <p className="text-xs text-zinc-500">
                                            Created: {new Date(key.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <Badge className="bg-blue-500/20 text-blue-300">
                                        {key.tier} - {key.rate_limit}/hr
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 bg-black/50 p-2 rounded font-mono text-sm text-white">
                                        {showKey[key.id] ? key.key : '••••••••••••••••••••••••••••••••'}
                                    </code>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowKey({ ...showKey, [key.id]: !showKey[key.id] })}
                                    >
                                        {showKey[key.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => copyKey(key.key)}
                                    >
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Documentation */}
                <Card className="glass-panel p-6">
                    <h2 className="text-2xl font-bold text-white mb-4">Quick Start</h2>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-zinc-400 mb-2">cURL Example:</p>
                            <pre className="bg-black/50 p-4 rounded overflow-x-auto">
                                <code className="text-sm text-green-400">{`curl -X POST https://api.flowai.com/v1/generate \\
  -H "Authorization: Bearer sk_live_xxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "epic dragon battle",
    "style": "cinematic",
    "duration": 5,
    "resolution": "1080p"
  }'`}</code>
                            </pre>
                        </div>
                        <div>
                            <p className="text-sm text-zinc-400 mb-2">Python Example:</p>
                            <pre className="bg-black/50 p-4 rounded overflow-x-auto">
                                <code className="text-sm text-blue-400">{`import requests

response = requests.post(
    "https://api.flowai.com/v1/generate",
    headers={"Authorization": "Bearer sk_live_xxxxx"},
    json={
        "prompt": "epic dragon battle",
        "style": "cinematic",
        "duration": 5
    }
)

video_url = response.json()["video_url"]`}</code>
                            </pre>
                        </div>
                    </div>
                    <div className="mt-4">
                        <Button variant="outline" className="mr-2">
                            <BarChart3 className="w-4 h-4 mr-2" />
                            View Full Docs
                        </Button>
                        <Button variant="outline">
                            Download SDKs
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
};
