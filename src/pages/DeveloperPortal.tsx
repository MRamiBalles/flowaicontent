import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
    Code2,
    Key,
    Webhook,
    BarChart3,
    Book,
    Plus,
    Copy,
    Trash2,
    Eye,
    EyeOff,
    Loader2,
    CheckCircle,
    XCircle,
    Clock,
    Zap,
    Server
} from 'lucide-react';

interface DeveloperAccount {
    id: string;
    tier: string;
    status: string;
    api_calls_limit: number;
    company_name?: string;
}

interface ApiKey {
    id: string;
    name: string;
    key_prefix: string;
    scopes: string[];
    last_used_at: string | null;
    total_requests: number;
    is_active: boolean;
    created_at: string;
}

interface UsageSummary {
    total_requests: number;
    successful_requests: number;
    failed_requests: number;
    credits_consumed: number;
    avg_response_time: number;
    top_endpoints: Array<{ endpoint: string; count: number }>;
}

interface WebhookConfig {
    id: string;
    name: string;
    url: string;
    events: string[];
    is_active: boolean;
    failure_count: number;
    last_triggered_at: string | null;
}

const DeveloperPortal: React.FC = () => {
    const { user, session } = useAuth();

    // State
    const [devAccount, setDevAccount] = useState<DeveloperAccount | null>(null);
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [usage, setUsage] = useState<UsageSummary | null>(null);
    const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // New key dialog
    const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
    const [isCreatingKey, setIsCreatingKey] = useState(false);

    // Register dialog
    const [showRegisterDialog, setShowRegisterDialog] = useState(false);
    const [registerForm, setRegisterForm] = useState({
        company_name: '',
        website_url: '',
        description: '',
    });
    const [isRegistering, setIsRegistering] = useState(false);

    useEffect(() => {
        if (user) {
            loadDeveloperData();
        }
    }, [user]);

    const callApiGateway = async (action: string, data?: Record<string, unknown>) => {
        const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-gateway`,
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

    const loadDeveloperData = async () => {
        setIsLoading(true);
        try {
            // Check for dev account
            const { data: account } = await supabase
                .from('developer_accounts')
                .select('*')
                .eq('user_id', user?.id)
                .single();

            if (account) {
                setDevAccount(account);

                // Load keys
                const keysResult = await callApiGateway('list_api_keys');
                if (keysResult.success) {
                    setApiKeys(keysResult.keys || []);
                }

                // Load usage
                const usageResult = await callApiGateway('get_usage');
                if (usageResult.success) {
                    setUsage(usageResult.usage);
                }

                // Load webhooks
                const webhooksResult = await callApiGateway('list_webhooks');
                if (webhooksResult.success) {
                    setWebhooks(webhooksResult.webhooks || []);
                }
            }
        } catch (error) {
            console.error('Error loading developer data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async () => {
        setIsRegistering(true);
        try {
            const result = await callApiGateway('register_developer', registerForm);

            if (!result.success) {
                throw new Error(result.error);
            }

            setDevAccount(result.developer);
            setShowRegisterDialog(false);
            toast.success('Developer account created!');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Registration failed');
        } finally {
            setIsRegistering(false);
        }
    };

    const handleCreateKey = async () => {
        if (!newKeyName.trim()) {
            toast.error('Key name is required');
            return;
        }

        setIsCreatingKey(true);
        try {
            const result = await callApiGateway('create_api_key', {
                name: newKeyName,
                scopes: ['read', 'write'],
            });

            if (!result.success) {
                throw new Error(result.error);
            }

            setNewKeyValue(result.api_key);
            setApiKeys([{
                id: result.key_id,
                name: newKeyName,
                key_prefix: result.key_prefix,
                scopes: ['read', 'write'],
                last_used_at: null,
                total_requests: 0,
                is_active: true,
                created_at: new Date().toISOString(),
            }, ...apiKeys]);

            toast.success('API key created');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to create key');
        } finally {
            setIsCreatingKey(false);
        }
    };

    const handleRevokeKey = async (keyId: string) => {
        if (!confirm('Revoke this API key? This cannot be undone.')) return;

        try {
            const result = await callApiGateway('revoke_api_key', { key_id: keyId });

            if (!result.success) {
                throw new Error(result.error);
            }

            setApiKeys(apiKeys.map(k =>
                k.id === keyId ? { ...k, is_active: false } : k
            ));
            toast.success('API key revoked');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to revoke key');
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    };

    const getTierBadgeColor = (tier: string) => {
        const colors: Record<string, string> = {
            free: 'bg-gray-100 text-gray-800',
            starter: 'bg-blue-100 text-blue-800',
            pro: 'bg-purple-100 text-purple-800',
            enterprise: 'bg-yellow-100 text-yellow-800',
        };
        return colors[tier] || colors.free;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Not registered
    if (!devAccount) {
        return (
            <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
                <Code2 className="h-16 w-16 mx-auto text-primary mb-4" />
                <h1 className="text-3xl font-bold mb-2">FlowAI Developer Portal</h1>
                <p className="text-muted-foreground mb-6">
                    Build amazing applications with the FlowAI API
                </p>

                <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
                    <DialogTrigger asChild>
                        <Button size="lg">
                            <Zap className="h-5 w-5 mr-2" />
                            Get Started
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Developer Account</DialogTitle>
                            <DialogDescription>
                                Register to access the FlowAI API
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Company Name (optional)</Label>
                                <Input
                                    value={registerForm.company_name}
                                    onChange={(e) => setRegisterForm({ ...registerForm, company_name: e.target.value })}
                                    placeholder="Acme Inc."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Website</Label>
                                <Input
                                    value={registerForm.website_url}
                                    onChange={(e) => setRegisterForm({ ...registerForm, website_url: e.target.value })}
                                    placeholder="https://example.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>What are you building?</Label>
                                <Textarea
                                    value={registerForm.description}
                                    onChange={(e) => setRegisterForm({ ...registerForm, description: e.target.value })}
                                    placeholder="Describe your project..."
                                    rows={3}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowRegisterDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleRegister} disabled={isRegistering}>
                                {isRegistering && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Create Account
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                <div className="grid grid-cols-3 gap-4 mt-12">
                    <Card>
                        <CardContent className="p-4 text-center">
                            <Server className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <h3 className="font-medium">RESTful API</h3>
                            <p className="text-xs text-muted-foreground">Simple integration</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <Zap className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <h3 className="font-medium">AI Powered</h3>
                            <p className="text-xs text-muted-foreground">Voice, video, content</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <BarChart3 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <h3 className="font-medium">Analytics</h3>
                            <p className="text-xs text-muted-foreground">Usage insights</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Code2 className="h-8 w-8 text-primary" />
                        Developer Portal
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your API access and integrations
                    </p>
                </div>
                <Badge className={getTierBadgeColor(devAccount.tier)}>
                    {devAccount.tier.toUpperCase()} Plan
                </Badge>
            </div>

            {/* Usage Overview */}
            {usage && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold">{usage.total_requests.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">Total Requests</div>
                            <Progress
                                value={(usage.total_requests / devAccount.api_calls_limit) * 100}
                                className="mt-2 h-1"
                            />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-green-600">
                                {usage.successful_requests.toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground">Successful</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-red-600">
                                {usage.failed_requests.toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground">Failed</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold">
                                {usage.avg_response_time?.toFixed(0) || 0}ms
                            </div>
                            <div className="text-xs text-muted-foreground">Avg Response</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Tabs defaultValue="keys" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="keys">
                        <Key className="h-4 w-4 mr-2" />
                        API Keys
                    </TabsTrigger>
                    <TabsTrigger value="webhooks">
                        <Webhook className="h-4 w-4 mr-2" />
                        Webhooks
                    </TabsTrigger>
                    <TabsTrigger value="docs">
                        <Book className="h-4 w-4 mr-2" />
                        Documentation
                    </TabsTrigger>
                </TabsList>

                {/* API Keys Tab */}
                <TabsContent value="keys" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">API Keys</h2>
                        <Dialog open={showNewKeyDialog} onOpenChange={(open) => {
                            setShowNewKeyDialog(open);
                            if (!open) {
                                setNewKeyValue(null);
                                setNewKeyName('');
                            }
                        }}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Key
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create API Key</DialogTitle>
                                    <DialogDescription>
                                        Generate a new API key for your application
                                    </DialogDescription>
                                </DialogHeader>

                                {newKeyValue ? (
                                    <div className="space-y-4 py-4">
                                        <div className="p-4 bg-green-50 rounded-lg">
                                            <div className="flex items-center gap-2 text-green-800 mb-2">
                                                <CheckCircle className="h-5 w-5" />
                                                <span className="font-medium">API Key Created</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <code className="flex-1 p-2 bg-white rounded text-sm font-mono break-all">
                                                    {newKeyValue}
                                                </code>
                                                <Button size="icon" variant="outline" onClick={() => copyToClipboard(newKeyValue)}>
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <p className="text-xs text-green-700 mt-2">
                                                Save this key now. It won't be shown again.
                                            </p>
                                        </div>
                                        <Button className="w-full" onClick={() => setShowNewKeyDialog(false)}>
                                            Done
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label>Key Name</Label>
                                                <Input
                                                    value={newKeyName}
                                                    onChange={(e) => setNewKeyName(e.target.value)}
                                                    placeholder="e.g., Production API"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" onClick={() => setShowNewKeyDialog(false)}>
                                                Cancel
                                            </Button>
                                            <Button onClick={handleCreateKey} disabled={isCreatingKey}>
                                                {isCreatingKey && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                                Create Key
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="space-y-2">
                        {apiKeys.length === 0 ? (
                            <Card className="p-8 text-center">
                                <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="font-medium mb-1">No API keys</h3>
                                <p className="text-sm text-muted-foreground">
                                    Create your first API key to get started
                                </p>
                            </Card>
                        ) : (
                            apiKeys.map((key) => (
                                <Card key={key.id}>
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{key.name}</span>
                                                {!key.is_active && (
                                                    <Badge variant="outline" className="text-red-600">Revoked</Badge>
                                                )}
                                            </div>
                                            <code className="text-sm text-muted-foreground font-mono">
                                                {key.key_prefix}...
                                            </code>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right text-sm text-muted-foreground">
                                                <div>{key.total_requests.toLocaleString()} requests</div>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {key.last_used_at ?
                                                        new Date(key.last_used_at).toLocaleDateString() :
                                                        'Never used'}
                                                </div>
                                            </div>
                                            {key.is_active && (
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="text-destructive"
                                                    onClick={() => handleRevokeKey(key.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>

                {/* Webhooks Tab */}
                <TabsContent value="webhooks" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Webhooks</h2>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Webhook
                        </Button>
                    </div>

                    {webhooks.length === 0 ? (
                        <Card className="p-8 text-center">
                            <Webhook className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="font-medium mb-1">No webhooks configured</h3>
                            <p className="text-sm text-muted-foreground">
                                Add webhooks to receive real-time event notifications
                            </p>
                        </Card>
                    ) : (
                        webhooks.map((hook) => (
                            <Card key={hook.id}>
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{hook.name}</span>
                                            {hook.is_active ? (
                                                <Badge className="bg-green-100 text-green-800">Active</Badge>
                                            ) : (
                                                <Badge variant="outline">Disabled</Badge>
                                            )}
                                        </div>
                                        <code className="text-sm text-muted-foreground">{hook.url}</code>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {hook.failure_count > 0 && (
                                            <span className="text-red-600">{hook.failure_count} failures</span>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>

                {/* Documentation Tab */}
                <TabsContent value="docs" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Start</CardTitle>
                            <CardDescription>Get started with the FlowAI API in minutes</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 bg-muted rounded-lg">
                                <h4 className="font-medium mb-2">Authentication</h4>
                                <p className="text-sm text-muted-foreground mb-2">
                                    Include your API key in the Authorization header:
                                </p>
                                <code className="block p-2 bg-background rounded text-sm">
                                    Authorization: Bearer fai_live_your_api_key
                                </code>
                            </div>

                            <div className="p-4 bg-muted rounded-lg">
                                <h4 className="font-medium mb-2">Base URL</h4>
                                <code className="block p-2 bg-background rounded text-sm">
                                    https://api.flowai.studio/v1
                                </code>
                            </div>

                            <div className="p-4 bg-muted rounded-lg">
                                <h4 className="font-medium mb-2">Example Request</h4>
                                <pre className="p-2 bg-background rounded text-sm overflow-x-auto">
                                    {`curl -X POST https://api.flowai.studio/v1/voice/clone \\
  -H "Authorization: Bearer fai_live_xxx" \\
  -H "Content-Type: multipart/form-data" \\
  -F "name=My Voice" \\
  -F "audio=@sample.mp3"`}
                                </pre>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default DeveloperPortal;
