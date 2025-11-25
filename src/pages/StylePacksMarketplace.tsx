import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Palette, Download, Check, ShoppingCart, Star, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { supabase } from '@/integrations/supabase/client';

interface StylePack {
    id: string;
    name: string;
    description: string;
    price_cents: number;
    preview_images: string[];
    downloads: number;
    tags: string[];
    is_owned?: boolean;
}

export const StylePacksMarketplace = () => {
    const [packs, setPacks] = useState<StylePack[]>([]);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState<string | null>(null);

    useEffect(() => {
        fetchStylePacks();
    }, []);

    const fetchStylePacks = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch('http://localhost:8000/v1/style-packs', {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });
            const data = await response.json();
            setPacks(data);
        } catch (error) {
            toast.error('Failed to load style packs');
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async (packId: string) => {
        setPurchasing(packId);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (!token) {
                toast.error('Please login to purchase');
                setPurchasing(null);
                return;
            }

            const response = await fetch('http://localhost:8000/v1/style-packs/purchase', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    style_pack_id: packId,
                    success_url: `${window.location.origin}/marketplace?purchase=success`,
                    cancel_url: `${window.location.origin}/marketplace?purchase=canceled`
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Purchase failed');
            }

            const data = await response.json();
            window.location.href = data.url;
        } catch (error: any) {
            toast.error(error.message);
            setPurchasing(null);
        }
    };

    const handleDownload = async (packId: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (!token) {
                toast.error('Please login to download');
                return;
            }

            const response = await fetch(`http://localhost:8000/v1/style-packs/download/${packId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Download failed');

            const data = await response.json();

            // Open download URL in new tab
            window.open(data.download_url, '_blank');
            toast.success('Download started!');
        } catch (error) {
            toast.error('Failed to download style pack');
        }
    };

    const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-white">Loading marketplace...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black py-20 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold text-white mb-4 flex items-center justify-center gap-3">
                        <Palette className="w-12 h-12 text-purple-400" />
                        Style Packs Marketplace
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                        Premium LoRA adapters to unlock unique visual styles for your AI videos
                    </p>
                </div>

                {/* Style Packs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {packs.map((pack) => (
                        <Card
                            key={pack.id}
                            className="glass-panel border-white/10 hover:border-purple-500/50 transition-all duration-300 overflow-hidden group"
                        >
                            {/* Preview Image */}
                            <div className="relative h-48 bg-gradient-to-br from-purple-900/20 to-pink-900/20 overflow-hidden">
                                {pack.preview_images[0] ? (
                                    <OptimizedImage
                                        src={pack.preview_images[0]}
                                        alt={pack.name}
                                        width={600}
                                        height={192}
                                        objectFit="cover"
                                        className="w-full h-full group-hover:scale-110 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <Palette className="w-16 h-16 text-purple-400/30" />
                                    </div>
                                )}

                                {/* Owned Badge */}
                                {pack.is_owned && (
                                    <div className="absolute top-3 right-3 bg-green-500/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                        <Check className="w-3 h-3" />
                                        OWNED
                                    </div>
                                )}

                                {/* Stats Overlay */}
                                <div className="absolute bottom-3 left-3 flex gap-2">
                                    <Badge className="bg-black/60 backdrop-blur-sm text-white text-xs">
                                        <TrendingUp className="w-3 h-3 mr-1" />
                                        {pack.downloads} downloads
                                    </Badge>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-4">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">{pack.name}</h3>
                                    <p className="text-sm text-zinc-400 line-clamp-2">{pack.description}</p>
                                </div>

                                {/* Tags */}
                                <div className="flex flex-wrap gap-2">
                                    {pack.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="text-xs bg-white/5 text-zinc-400 px-2 py-1 rounded border border-white/10"
                                        >
                                            #{tag}
                                        </span>
                                    ))}
                                </div>

                                {/* Price & CTA */}
                                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                    <div className="text-2xl font-bold text-white">
                                        {formatPrice(pack.price_cents)}
                                    </div>

                                    {pack.is_owned ? (
                                        <Button
                                            onClick={() => handleDownload(pack.id)}
                                            className="bg-green-500/20 hover:bg-green-500/40 text-green-300 border border-green-500/50"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Download
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={() => handlePurchase(pack.id)}
                                            disabled={purchasing === pack.id}
                                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                                        >
                                            {purchasing === pack.id ? (
                                                'Processing...'
                                            ) : (
                                                <>
                                                    <ShoppingCart className="w-4 h-4 mr-2" />
                                                    Buy Now
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Empty State */}
                {packs.length === 0 && (
                    <div className="text-center py-20">
                        <Palette className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                        <p className="text-zinc-500">No style packs available yet</p>
                    </div>
                )}
            </div>
        </div>
    );
};
