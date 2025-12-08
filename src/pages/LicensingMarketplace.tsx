import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
    FileText,
    DollarSign,
    ShoppingCart,
    Tag,
    Globe,
    Clock,
    Shield,
    TrendingUp,
    Loader2,
    Plus,
    ExternalLink,
    CheckCircle,
    Key
} from 'lucide-react';

interface License {
    id: string;
    content_type: string;
    content_title: string;
    content_preview_url: string | null;
    creator_id: string;
    license_type: string;
    price_cents: number;
    usage_rights: string[];
    duration_days: number | null;
    territory: string[];
    royalty_percentage: number;
    requires_attribution: boolean;
    allows_ai_training: boolean;
    total_purchases: number;
    created_at: string;
    creator?: {
        username: string;
        avatar_url: string;
    };
}

interface LicensePurchase {
    id: string;
    license_key: string;
    license_id: string;
    amount_paid_cents: number;
    status: string;
    expires_at: string | null;
    usage_count: number;
    usage_limit: number | null;
    created_at: string;
    license?: License;
}

const LICENSE_TYPES = [
    { value: 'royalty_free', label: 'Royalty Free', description: 'One-time payment, unlimited use' },
    { value: 'rights_managed', label: 'Rights Managed', description: 'Per-use royalties apply' },
    { value: 'editorial', label: 'Editorial', description: 'News/education only' },
    { value: 'commercial', label: 'Commercial', description: 'Full commercial rights' },
    { value: 'exclusive', label: 'Exclusive', description: 'Buyer gets exclusive rights' },
];

const USAGE_RIGHTS = [
    { value: 'web', label: 'Website/App' },
    { value: 'social', label: 'Social Media' },
    { value: 'broadcast', label: 'Broadcast/TV' },
    { value: 'print', label: 'Print' },
    { value: 'merchandise', label: 'Merchandise' },
    { value: 'nft', label: 'NFT/Web3' },
    { value: 'ai_training', label: 'AI Training' },
];

const LicensingMarketplace: React.FC = () => {
    const { user, session } = useAuth();

    // State
    const [licenses, setLicenses] = useState<License[]>([]);
    const [myLicenses, setMyLicenses] = useState<License[]>([]);
    const [myPurchases, setMyPurchases] = useState<LicensePurchase[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPurchasing, setIsPurchasing] = useState<string | null>(null);

    // Create license form
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [form, setForm] = useState({
        content_type: 'video' as const,
        content_id: '',
        content_title: '',
        license_type: 'royalty_free',
        price_cents: 999,
        usage_rights: ['web', 'social'],
        duration_days: undefined as number | undefined,
        royalty_percentage: 10,
        requires_attribution: false,
        allows_ai_training: false,
    });

    // Earnings summary
    const [earnings, setEarnings] = useState<{
        total_revenue_cents: number;
        total_sales: number;
        pending_royalties_cents: number;
    } | null>(null);

    useEffect(() => {
        if (user) {
            fetchLicenses();
            fetchMyLicenses();
            fetchMyPurchases();
            fetchEarnings();
        } else {
            fetchLicenses();
        }
    }, [user]);

    const fetchLicenses = async () => {
        try {
            const { data, error } = await supabase
                .from('content_licenses')
                .select(`
          *,
          creator:creator_id(username, avatar_url)
        `)
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setLicenses(data || []);
        } catch (error) {
            console.error('Error fetching licenses:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMyLicenses = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('content_licenses')
                .select('*')
                .eq('creator_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setMyLicenses(data || []);
        } catch (error) {
            console.error('Error fetching my licenses:', error);
        }
    };

    const fetchMyPurchases = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('license_purchases')
                .select(`
          *,
          license:license_id(*)
        `)
                .eq('buyer_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setMyPurchases(data || []);
        } catch (error) {
            console.error('Error fetching purchases:', error);
        }
    };

    const fetchEarnings = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .rpc('get_creator_earnings_summary', { p_creator_id: user.id });

            if (error) throw error;
            setEarnings(data);
        } catch (error) {
            console.error('Error fetching earnings:', error);
        }
    };

    const handleCreateLicense = async () => {
        if (!form.content_id || !form.content_title) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsCreating(true);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-license`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${session?.access_token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(form),
                }
            );

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error);
            }

            toast.success('License created successfully!');
            setShowCreateDialog(false);
            fetchMyLicenses();
            fetchLicenses();

            // Reset form
            setForm({
                content_type: 'video',
                content_id: '',
                content_title: '',
                license_type: 'royalty_free',
                price_cents: 999,
                usage_rights: ['web', 'social'],
                duration_days: undefined,
                royalty_percentage: 10,
                requires_attribution: false,
                allows_ai_training: false,
            });
        } catch (error) {
            console.error('Create error:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to create license');
        } finally {
            setIsCreating(false);
        }
    };

    const handlePurchase = async (license: License) => {
        if (!user) {
            toast.error('Please sign in to purchase licenses');
            return;
        }

        setIsPurchasing(license.id);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/purchase-license`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${session?.access_token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        license_id: license.id,
                        return_url: window.location.href,
                    }),
                }
            );

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error);
            }

            if (result.checkout_url) {
                // Redirect to Stripe Checkout
                window.location.href = result.checkout_url;
            } else {
                // Free license or dev mode
                toast.success('License activated!', {
                    description: `License key: ${result.license_key}`,
                });
                fetchMyPurchases();
            }
        } catch (error) {
            console.error('Purchase error:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to purchase');
        } finally {
            setIsPurchasing(null);
        }
    };

    const formatPrice = (cents: number) => {
        if (cents === 0) return 'Free';
        return `$${(cents / 100).toFixed(2)}`;
    };

    const getLicenseTypeBadge = (type: string) => {
        const colors: Record<string, string> = {
            royalty_free: 'bg-green-100 text-green-800',
            rights_managed: 'bg-blue-100 text-blue-800',
            editorial: 'bg-yellow-100 text-yellow-800',
            commercial: 'bg-purple-100 text-purple-800',
            exclusive: 'bg-red-100 text-red-800',
        };
        return colors[type] || 'bg-gray-100 text-gray-800';
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
                        <FileText className="h-8 w-8 text-primary" />
                        Licensing Marketplace
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        License AI-generated content for commercial use
                    </p>
                </div>

                {user && (
                    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                List Content
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Create License</DialogTitle>
                                <DialogDescription>
                                    List your content for licensing
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Content Type</Label>
                                    <Select
                                        value={form.content_type}
                                        onValueChange={(v) => setForm({ ...form, content_type: v as any })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="video">Video</SelectItem>
                                            <SelectItem value="style_pack">Style Pack</SelectItem>
                                            <SelectItem value="voice">Voice Clone</SelectItem>
                                            <SelectItem value="music">Music</SelectItem>
                                            <SelectItem value="template">Template</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Content ID</Label>
                                    <Input
                                        placeholder="UUID of your content"
                                        value={form.content_id}
                                        onChange={(e) => setForm({ ...form, content_id: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Title</Label>
                                    <Input
                                        placeholder="e.g., Cyberpunk City Animation"
                                        value={form.content_title}
                                        onChange={(e) => setForm({ ...form, content_title: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>License Type</Label>
                                    <Select
                                        value={form.license_type}
                                        onValueChange={(v) => setForm({ ...form, license_type: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {LICENSE_TYPES.map(type => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    <div>
                                                        <div className="font-medium">{type.label}</div>
                                                        <div className="text-xs text-muted-foreground">{type.description}</div>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Price (USD)</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="pl-9"
                                            value={(form.price_cents / 100).toFixed(2)}
                                            onChange={(e) => setForm({ ...form, price_cents: Math.round(parseFloat(e.target.value || '0') * 100) })}
                                        />
                                    </div>
                                </div>

                                {form.license_type === 'rights_managed' && (
                                    <div className="space-y-2">
                                        <Label>Royalty Percentage ({form.royalty_percentage}%)</Label>
                                        <Input
                                            type="range"
                                            min="0"
                                            max="50"
                                            value={form.royalty_percentage}
                                            onChange={(e) => setForm({ ...form, royalty_percentage: parseInt(e.target.value) })}
                                        />
                                    </div>
                                )}

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="attribution"
                                        checked={form.requires_attribution}
                                        onCheckedChange={(c) => setForm({ ...form, requires_attribution: c === true })}
                                    />
                                    <Label htmlFor="attribution">Require attribution</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="ai_training"
                                        checked={form.allows_ai_training}
                                        onCheckedChange={(c) => setForm({ ...form, allows_ai_training: c === true })}
                                    />
                                    <Label htmlFor="ai_training">Allow AI training use</Label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleCreateLicense} disabled={isCreating}>
                                    {isCreating ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        'Create License'
                                    )}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* Earnings Summary (for creators) */}
            {user && earnings && (earnings.total_sales > 0 || myLicenses.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                <TrendingUp className="h-4 w-4" />
                                Total Revenue
                            </div>
                            <div className="text-2xl font-bold">
                                {formatPrice(earnings.total_revenue_cents || 0)}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                <ShoppingCart className="h-4 w-4" />
                                Total Sales
                            </div>
                            <div className="text-2xl font-bold">{earnings.total_sales || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                <Tag className="h-4 w-4" />
                                Active Licenses
                            </div>
                            <div className="text-2xl font-bold">{myLicenses.filter(l => l).length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                <DollarSign className="h-4 w-4" />
                                Pending Royalties
                            </div>
                            <div className="text-2xl font-bold">
                                {formatPrice(earnings.pending_royalties_cents || 0)}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Tabs defaultValue="browse" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="browse">Browse Licenses</TabsTrigger>
                    {user && <TabsTrigger value="my-licenses">My Listings</TabsTrigger>}
                    {user && <TabsTrigger value="purchases">My Purchases</TabsTrigger>}
                </TabsList>

                {/* Browse Tab */}
                <TabsContent value="browse" className="space-y-4">
                    {licenses.length === 0 ? (
                        <Card className="p-8 text-center">
                            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="font-medium mb-1">No licenses available</h3>
                            <p className="text-sm text-muted-foreground">
                                Be the first to list your content for licensing
                            </p>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {licenses.map((license) => (
                                <Card key={license.id} className="hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <CardTitle className="text-lg line-clamp-1">
                                                    {license.content_title}
                                                </CardTitle>
                                                <CardDescription className="flex items-center gap-1 mt-1">
                                                    <span className="capitalize">{license.content_type}</span>
                                                    {license.creator && (
                                                        <>
                                                            <span>•</span>
                                                            <span>by {license.creator.username}</span>
                                                        </>
                                                    )}
                                                </CardDescription>
                                            </div>
                                            <Badge className={getLicenseTypeBadge(license.license_type)}>
                                                {license.license_type.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pb-2">
                                        <div className="flex flex-wrap gap-1 mb-3">
                                            {license.usage_rights?.slice(0, 3).map(right => (
                                                <Badge key={right} variant="outline" className="text-xs">
                                                    {right}
                                                </Badge>
                                            ))}
                                            {license.usage_rights?.length > 3 && (
                                                <Badge variant="outline" className="text-xs">
                                                    +{license.usage_rights.length - 3}
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            {license.duration_days ? (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {license.duration_days} days
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1">
                                                    <Shield className="h-3 w-3" />
                                                    Perpetual
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <Globe className="h-3 w-3" />
                                                {license.territory?.includes('worldwide') ? 'Worldwide' : license.territory?.length + ' regions'}
                                            </span>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="pt-2 flex items-center justify-between">
                                        <div className="text-2xl font-bold text-primary">
                                            {formatPrice(license.price_cents)}
                                        </div>
                                        <Button
                                            onClick={() => handlePurchase(license)}
                                            disabled={isPurchasing === license.id || license.creator_id === user?.id}
                                        >
                                            {isPurchasing === license.id ? (
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                                <ShoppingCart className="h-4 w-4 mr-2" />
                                            )}
                                            {license.creator_id === user?.id ? 'Your License' : 'Purchase'}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* My Licenses Tab */}
                {user && (
                    <TabsContent value="my-licenses" className="space-y-4">
                        {myLicenses.length === 0 ? (
                            <Card className="p-8 text-center">
                                <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="font-medium mb-1">No licenses listed</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Start earning by licensing your content
                                </p>
                                <Button onClick={() => setShowCreateDialog(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Your First License
                                </Button>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {myLicenses.map((license) => (
                                    <Card key={license.id}>
                                        <CardContent className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div>
                                                    <h3 className="font-medium">{license.content_title}</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        {license.content_type} • {license.license_type.replace('_', ' ')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <div className="text-lg font-bold">{formatPrice(license.price_cents)}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {license.total_purchases} sales
                                                    </div>
                                                </div>
                                                <Badge variant={license.is_active ? 'default' : 'secondary'}>
                                                    {license.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                )}

                {/* Purchases Tab */}
                {user && (
                    <TabsContent value="purchases" className="space-y-4">
                        {myPurchases.length === 0 ? (
                            <Card className="p-8 text-center">
                                <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="font-medium mb-1">No purchases yet</h3>
                                <p className="text-sm text-muted-foreground">
                                    Browse licenses to find content for your projects
                                </p>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {myPurchases.map((purchase) => (
                                    <Card key={purchase.id}>
                                        <CardContent className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <CheckCircle className="h-8 w-8 text-green-500" />
                                                <div>
                                                    <h3 className="font-medium">
                                                        {purchase.license?.content_title || 'License'}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                                        <Key className="h-3 w-3" />
                                                        {purchase.license_key.substring(0, 8)}...
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <div className="text-sm">
                                                        {purchase.expires_at
                                                            ? `Expires ${new Date(purchase.expires_at).toLocaleDateString()}`
                                                            : 'Perpetual'
                                                        }
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {purchase.usage_limit
                                                            ? `${purchase.usage_count}/${purchase.usage_limit} uses`
                                                            : 'Unlimited uses'
                                                        }
                                                    </div>
                                                </div>
                                                <Badge variant={purchase.status === 'active' ? 'default' : 'secondary'}>
                                                    {purchase.status}
                                                </Badge>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
};

export default LicensingMarketplace;
