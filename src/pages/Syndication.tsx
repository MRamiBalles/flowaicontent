import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
    Share2, Link2, Unlink, Send, Calendar, CheckCircle2,
    Loader2, Plus, ExternalLink
} from 'lucide-react';

interface Platform {
    name: string;
    icon: string;
    color: string;
}

interface ConnectedPlatform {
    id: string;
    platform: string;
    platform_username: string;
    is_active: boolean;
}

interface Post {
    id: string;
    title: string;
    target_platforms: string[];
    status: string;
    created_at: string;
    publish_results: Record<string, { success: boolean; url?: string }>;
}

const PLATFORMS: Record<string, Platform> = {
    youtube: { name: "YouTube", icon: "📺", color: "#FF0000" },
    tiktok: { name: "TikTok", icon: "🎵", color: "#000000" },
    instagram: { name: "Instagram", icon: "📸", color: "#E4405F" },
    twitter: { name: "Twitter/X", icon: "🐦", color: "#1DA1F2" },
};

const Syndication = () => {
    const { user } = useAuth();
    const [connected, setConnected] = useState<ConnectedPlatform[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPublishing, setIsPublishing] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [contentUrl, setContentUrl] = useState('');
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

    useEffect(() => {
        if (user) loadData();
    }, [user]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;

            const [connectedRes, postsRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/syndication`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ action: 'get_connected' }),
                }),
                fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/syndication`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ action: 'get_my_posts' }),
                }),
            ]);

            const connectedData = await connectedRes.json();
            const postsData = await postsRes.json();

            if (connectedData.connected) setConnected(connectedData.connected);
            if (postsData.posts) setPosts(postsData.posts);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load data');
        } finally {
            setIsLoading(false);
        }
    };

    const connectPlatform = async (platform: string) => {
        try {
            const session = await supabase.auth.getSession();
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/syndication`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.data.session?.access_token}`,
                },
                body: JSON.stringify({ action: 'connect_platform', platform }),
            });

            const data = await response.json();
            if (data.success) {
                toast.success(`Connected to ${PLATFORMS[platform].name}!`);
                loadData();
            }
        } catch (error) {
            toast.error('Failed to connect');
        }
    };

    const handlePlatformToggle = (platform: string) => {
        setSelectedPlatforms(prev =>
            prev.includes(platform)
                ? prev.filter(p => p !== platform)
                : [...prev, platform]
        );
    };

    const handlePublish = async () => {
        if (!title || !contentUrl || selectedPlatforms.length === 0) {
            toast.error('Please fill in all fields and select platforms');
            return;
        }

        setIsPublishing(true);
        try {
            const session = await supabase.auth.getSession();

            // Create post
            const createRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/syndication`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.data.session?.access_token}`,
                },
                body: JSON.stringify({
                    action: 'create_post',
                    title,
                    description,
                    contentUrl,
                    contentType: 'video',
                    targetPlatforms: selectedPlatforms,
                }),
            });

            const createData = await createRes.json();
            if (!createData.success) throw new Error(createData.error);

            // Publish immediately
            const publishRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/syndication`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.data.session?.access_token}`,
                },
                body: JSON.stringify({ action: 'publish_now', postId: createData.post.id }),
            });

            const publishData = await publishRes.json();
            if (publishData.success) {
                toast.success('Published to all platforms!');
                setTitle('');
                setDescription('');
                setContentUrl('');
                setSelectedPlatforms([]);
                loadData();
            }
        } catch (error) {
            toast.error('Publishing failed');
        } finally {
            setIsPublishing(false);
        }
    };

    const connectedPlatformsList = connected.map(c => c.platform);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Header */}
            <div className="text-center mb-10">
                <h1 className="text-4xl font-bold flex items-center justify-center gap-3 mb-4">
                    <Share2 className="h-10 w-10 text-primary" />
                    Multi-Platform Syndication
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Publish your content to YouTube, TikTok, Instagram & Twitter in one click
                </p>
            </div>

            <Tabs defaultValue="publish" className="space-y-6">
                <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto">
                    <TabsTrigger value="publish">Publish</TabsTrigger>
                    <TabsTrigger value="accounts">Connected Accounts</TabsTrigger>
                </TabsList>

                <TabsContent value="publish" className="space-y-6">
                    <div className="grid lg:grid-cols-2 gap-8">
                        {/* Publish Form */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Send className="h-5 w-5 text-primary" />
                                    Create Post
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <div className="space-y-2">
                                    <Label>Title</Label>
                                    <Input
                                        placeholder="Post title..."
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Textarea
                                        placeholder="Caption/description..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={3}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Content URL</Label>
                                    <Input
                                        placeholder="https://..."
                                        value={contentUrl}
                                        onChange={(e) => setContentUrl(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label>Publish To ({selectedPlatforms.length} selected)</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {Object.entries(PLATFORMS).map(([key, platform]) => {
                                            const isConnected = connectedPlatformsList.includes(key);
                                            return (
                                                <button
                                                    key={key}
                                                    onClick={() => isConnected && handlePlatformToggle(key)}
                                                    disabled={!isConnected}
                                                    className={`p-4 rounded-lg border flex items-center gap-3 transition-all ${!isConnected
                                                            ? 'opacity-50 cursor-not-allowed'
                                                            : selectedPlatforms.includes(key)
                                                                ? 'border-primary bg-primary/10'
                                                                : 'hover:border-primary/50'
                                                        }`}
                                                >
                                                    <Checkbox
                                                        checked={selectedPlatforms.includes(key)}
                                                        disabled={!isConnected}
                                                    />
                                                    <span className="text-2xl">{platform.icon}</span>
                                                    <span className="font-medium">{platform.name}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {connectedPlatformsList.length === 0 && (
                                        <p className="text-sm text-muted-foreground">
                                            Connect platforms in the "Connected Accounts" tab first.
                                        </p>
                                    )}
                                </div>

                                <Button
                                    className="w-full"
                                    size="lg"
                                    onClick={handlePublish}
                                    disabled={isPublishing || !title || selectedPlatforms.length === 0}
                                >
                                    {isPublishing ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Send className="h-4 w-4 mr-2" />
                                    )}
                                    Publish to {selectedPlatforms.length} Platform(s)
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Recent Posts */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Posts</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {posts.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Share2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                        <p>No posts yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {posts.slice(0, 5).map((post) => (
                                            <div key={post.id} className="p-4 border rounded-lg">
                                                <div className="flex items-start justify-between mb-2">
                                                    <p className="font-medium">{post.title}</p>
                                                    <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                                                        {post.status}
                                                    </Badge>
                                                </div>
                                                <div className="flex gap-2">
                                                    {post.target_platforms.map((p) => (
                                                        <span key={p} className="text-lg" title={PLATFORMS[p]?.name}>
                                                            {PLATFORMS[p]?.icon}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="accounts">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Link2 className="h-5 w-5 text-primary" />
                                Connected Platforms
                            </CardTitle>
                            <CardDescription>
                                Connect your social media accounts to enable cross-posting
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {Object.entries(PLATFORMS).map(([key, platform]) => {
                                    const connection = connected.find(c => c.platform === key);
                                    return (
                                        <Card key={key} className="text-center">
                                            <CardContent className="pt-6">
                                                <div className="text-4xl mb-3">{platform.icon}</div>
                                                <h3 className="font-semibold mb-1">{platform.name}</h3>
                                                {connection ? (
                                                    <>
                                                        <p className="text-sm text-muted-foreground mb-3">
                                                            @{connection.platform_username}
                                                        </p>
                                                        <Badge className="bg-green-500">Connected</Badge>
                                                    </>
                                                ) : (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="mt-2"
                                                        onClick={() => connectPlatform(key)}
                                                    >
                                                        <Plus className="h-3 w-3 mr-1" />
                                                        Connect
                                                    </Button>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default Syndication;
