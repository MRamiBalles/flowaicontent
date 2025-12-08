import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
    Handshake,
    Search,
    Sparkles,
    DollarSign,
    Users,
    Clock,
    Star,
    MessageSquare,
    CheckCircle,
    AlertCircle,
    Loader2,
    Send,
    Briefcase,
    TrendingUp,
    Target
} from 'lucide-react';

interface Campaign {
    campaign_id: string;
    title: string;
    brand_name: string;
    budget_per_creator: number;
    match_score: number;
    deadline: string;
}

interface Deal {
    id: string;
    status: string;
    agreed_amount_cents: number;
    match_score: number;
    campaign?: {
        title: string;
        content_type: string;
        content_deadline: string;
    };
    brand?: {
        name: string;
        logo_url: string;
    };
}

interface MediaKit {
    id: string;
    display_name: string;
    bio: string;
    total_followers: number;
    engagement_rate: number;
    content_niches: string[];
    rate_per_post_min: number;
    rate_per_post_max: number;
}

const BrandDealsMarketplace: React.FC = () => {
    const { user, session } = useAuth();

    // State
    const [matchingCampaigns, setMatchingCampaigns] = useState<Campaign[]>([]);
    const [myDeals, setMyDeals] = useState<Deal[]>([]);
    const [mediaKit, setMediaKit] = useState<MediaKit | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isApplying, setIsApplying] = useState<string | null>(null);

    // Media kit form
    const [showMediaKitDialog, setShowMediaKitDialog] = useState(false);
    const [mediaKitForm, setMediaKitForm] = useState({
        display_name: '',
        bio: '',
        total_followers: 0,
        engagement_rate: 0,
        content_niches: [] as string[],
        rate_per_post_min: 0,
        rate_per_post_max: 0,
    });
    const [isSavingKit, setIsSavingKit] = useState(false);

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Check for media kit
            const { data: kit } = await supabase
                .from('creator_media_kits')
                .select('*')
                .eq('user_id', user?.id)
                .single();

            if (kit) {
                setMediaKit(kit);
                setMediaKitForm({
                    display_name: kit.display_name || '',
                    bio: kit.bio || '',
                    total_followers: kit.total_followers || 0,
                    engagement_rate: kit.engagement_rate || 0,
                    content_niches: kit.content_niches || [],
                    rate_per_post_min: kit.rate_per_post_min || 0,
                    rate_per_post_max: kit.rate_per_post_max || 0,
                });

                // Load matching campaigns
                await loadMatchingCampaigns();
            }

            // Load deals
            await loadMyDeals();
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadMatchingCampaigns = async () => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/brand-deals`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${session?.access_token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: 'get_matching_campaigns',
                        data: { limit: 20 },
                    }),
                }
            );

            const result = await response.json();
            if (result.success) {
                setMatchingCampaigns(result.campaigns || []);
            }
        } catch (error) {
            console.error('Error loading campaigns:', error);
        }
    };

    const loadMyDeals = async () => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/brand-deals`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${session?.access_token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ action: 'get_my_deals' }),
                }
            );

            const result = await response.json();
            if (result.success) {
                setMyDeals(result.deals || []);
            }
        } catch (error) {
            console.error('Error loading deals:', error);
        }
    };

    const handleSaveMediaKit = async () => {
        if (!mediaKitForm.display_name.trim()) {
            toast.error('Display name is required');
            return;
        }

        setIsSavingKit(true);
        try {
            const { data, error } = await supabase
                .from('creator_media_kits')
                .upsert({
                    user_id: user?.id,
                    ...mediaKitForm,
                })
                .select()
                .single();

            if (error) throw error;

            setMediaKit(data);
            setShowMediaKitDialog(false);
            toast.success('Media kit saved!');

            // Refresh campaigns
            await loadMatchingCampaigns();
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Failed to save media kit');
        } finally {
            setIsSavingKit(false);
        }
    };

    const handleApply = async (campaignId: string) => {
        setIsApplying(campaignId);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/brand-deals`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${session?.access_token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: 'apply_to_campaign',
                        data: { campaign_id: campaignId },
                    }),
                }
            );

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error);
            }

            toast.success('Application sent!', {
                description: `Match score: ${result.match_score?.toFixed(0)}%`,
            });

            // Remove from list and refresh deals
            setMatchingCampaigns(prev => prev.filter(c => c.campaign_id !== campaignId));
            await loadMyDeals();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to apply');
        } finally {
            setIsApplying(null);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-800',
            negotiating: 'bg-blue-100 text-blue-800',
            accepted: 'bg-green-100 text-green-800',
            in_progress: 'bg-purple-100 text-purple-800',
            review: 'bg-orange-100 text-orange-800',
            approved: 'bg-teal-100 text-teal-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const formatCurrency = (cents: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(cents / 100);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Handshake className="h-8 w-8 text-primary" />
                        Brand Deals
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        AI-powered brand partnership matching
                    </p>
                </div>

                <Dialog open={showMediaKitDialog} onOpenChange={setShowMediaKitDialog}>
                    <DialogTrigger asChild>
                        <Button variant={mediaKit ? 'outline' : 'default'}>
                            <Briefcase className="h-4 w-4 mr-2" />
                            {mediaKit ? 'Edit Media Kit' : 'Create Media Kit'}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Your Media Kit</DialogTitle>
                            <DialogDescription>
                                Showcase your profile to brands
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                            <div className="space-y-2">
                                <Label>Display Name</Label>
                                <Input
                                    value={mediaKitForm.display_name}
                                    onChange={(e) => setMediaKitForm({ ...mediaKitForm, display_name: e.target.value })}
                                    placeholder="Your creator name"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Bio</Label>
                                <Textarea
                                    value={mediaKitForm.bio}
                                    onChange={(e) => setMediaKitForm({ ...mediaKitForm, bio: e.target.value })}
                                    placeholder="Tell brands about yourself..."
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Total Followers</Label>
                                    <Input
                                        type="number"
                                        value={mediaKitForm.total_followers}
                                        onChange={(e) => setMediaKitForm({ ...mediaKitForm, total_followers: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Engagement Rate (%)</Label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={mediaKitForm.engagement_rate}
                                        onChange={(e) => setMediaKitForm({ ...mediaKitForm, engagement_rate: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Rate Min ($)</Label>
                                    <Input
                                        type="number"
                                        value={mediaKitForm.rate_per_post_min / 100}
                                        onChange={(e) => setMediaKitForm({ ...mediaKitForm, rate_per_post_min: (parseFloat(e.target.value) || 0) * 100 })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Rate Max ($)</Label>
                                    <Input
                                        type="number"
                                        value={mediaKitForm.rate_per_post_max / 100}
                                        onChange={(e) => setMediaKitForm({ ...mediaKitForm, rate_per_post_max: (parseFloat(e.target.value) || 0) * 100 })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Content Niches (comma-separated)</Label>
                                <Input
                                    value={mediaKitForm.content_niches.join(', ')}
                                    onChange={(e) => setMediaKitForm({
                                        ...mediaKitForm,
                                        content_niches: e.target.value.split(',').map(n => n.trim()).filter(Boolean)
                                    })}
                                    placeholder="gaming, tech, lifestyle"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowMediaKitDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSaveMediaKit} disabled={isSavingKit}>
                                {isSavingKit && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Save Media Kit
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* No Media Kit Warning */}
            {!mediaKit && (
                <Card className="mb-6 border-yellow-200 bg-yellow-50">
                    <CardContent className="p-4 flex items-center gap-4">
                        <AlertCircle className="h-8 w-8 text-yellow-600" />
                        <div>
                            <h3 className="font-medium text-yellow-800">Create Your Media Kit</h3>
                            <p className="text-sm text-yellow-700">
                                You need a media kit to apply for brand deals and get matched with campaigns.
                            </p>
                        </div>
                        <Button
                            className="ml-auto"
                            onClick={() => setShowMediaKitDialog(true)}
                        >
                            Create Now
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Stats Summary */}
            {mediaKit && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Card>
                        <CardContent className="p-4 text-center">
                            <Users className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                            <div className="text-2xl font-bold">{mediaKit.total_followers.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">Followers</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <TrendingUp className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                            <div className="text-2xl font-bold">{mediaKit.engagement_rate}%</div>
                            <div className="text-xs text-muted-foreground">Engagement</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <Target className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                            <div className="text-2xl font-bold">{matchingCampaigns.length}</div>
                            <div className="text-xs text-muted-foreground">Matching Campaigns</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <Briefcase className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                            <div className="text-2xl font-bold">{myDeals.length}</div>
                            <div className="text-xs text-muted-foreground">Active Deals</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Tabs defaultValue="opportunities" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="opportunities">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Opportunities
                    </TabsTrigger>
                    <TabsTrigger value="deals">
                        <Handshake className="h-4 w-4 mr-2" />
                        My Deals ({myDeals.length})
                    </TabsTrigger>
                </TabsList>

                {/* Opportunities Tab */}
                <TabsContent value="opportunities" className="space-y-4">
                    {!mediaKit ? (
                        <Card className="p-8 text-center">
                            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="font-medium mb-1">Create your media kit first</h3>
                            <p className="text-sm text-muted-foreground">
                                Brands need to see your profile before you can apply
                            </p>
                        </Card>
                    ) : matchingCampaigns.length === 0 ? (
                        <Card className="p-8 text-center">
                            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="font-medium mb-1">No matching campaigns</h3>
                            <p className="text-sm text-muted-foreground">
                                Check back later for new brand opportunities
                            </p>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {matchingCampaigns.map((campaign) => (
                                <Card key={campaign.campaign_id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold text-lg">{campaign.title}</h3>
                                                    <Badge className="bg-primary/10 text-primary">
                                                        <Sparkles className="h-3 w-3 mr-1" />
                                                        {campaign.match_score.toFixed(0)}% match
                                                    </Badge>
                                                </div>
                                                <p className="text-muted-foreground text-sm mb-3">
                                                    by {campaign.brand_name}
                                                </p>
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <DollarSign className="h-4 w-4" />
                                                        {formatCurrency(campaign.budget_per_creator)}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-4 w-4" />
                                                        Deadline: {new Date(campaign.deadline).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => handleApply(campaign.campaign_id)}
                                                disabled={isApplying === campaign.campaign_id}
                                            >
                                                {isApplying === campaign.campaign_id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <Send className="h-4 w-4 mr-2" />
                                                        Apply
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* My Deals Tab */}
                <TabsContent value="deals" className="space-y-4">
                    {myDeals.length === 0 ? (
                        <Card className="p-8 text-center">
                            <Handshake className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="font-medium mb-1">No deals yet</h3>
                            <p className="text-sm text-muted-foreground">
                                Apply to campaigns to start getting brand deals
                            </p>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {myDeals.map((deal) => (
                                <Card key={deal.id}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-12 w-12">
                                                    {deal.brand?.logo_url && <AvatarImage src={deal.brand.logo_url} />}
                                                    <AvatarFallback>{deal.brand?.name?.charAt(0) || 'B'}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <h3 className="font-medium">{deal.campaign?.title}</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        {deal.brand?.name} • {deal.campaign?.content_type}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <div className="font-semibold">{formatCurrency(deal.agreed_amount_cents)}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Due: {deal.campaign?.content_deadline ?
                                                            new Date(deal.campaign.content_deadline).toLocaleDateString() : 'TBD'}
                                                    </div>
                                                </div>
                                                <Badge className={getStatusColor(deal.status)}>
                                                    {deal.status.replace('_', ' ')}
                                                </Badge>
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

export default BrandDealsMarketplace;
