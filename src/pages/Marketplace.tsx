import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Plus, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { ConnectWallet } from "@/components/web3/ConnectWallet";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { useUser } from "@/hooks/useUser";
import { AppLayout } from "@/components/layout/AppLayout";

interface Listing {
    id: string;
    title: string;
    description: string;
    image_url: string;
    price: number;
    seller: string;
    type: string;
}

export default function Marketplace() {
    const { toast } = useToast();
    const { user, isAdmin } = useUser();

    const { data: listings, isLoading } = useQuery({
        queryKey: ["marketplace-listings"],
        queryFn: async () => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/marketplace/listings`);
            if (!response.ok) throw new Error("Failed to fetch listings");
            return response.json() as Promise<Listing[]>;
        }
    });

    const buyMutation = useMutation({
        mutationFn: async (listingId: string) => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Please login first");

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/marketplace/buy/${listingId}`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${session.access_token}`
                }
            });
            if (!response.ok) throw new Error("Purchase failed");
            return response.json();
        },
        onSuccess: () => {
            toast({
                title: "Purchase Successful! 🛍️",
                description: "The NFT has been transferred to your wallet.",
            });
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        }
    });

    return (
        <AppLayout user={user} isAdmin={isAdmin}>
            <div className="container mx-auto p-6 space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">
                            NFT Marketplace
                        </h1>
                        <p className="text-muted-foreground">Trade unique AI-generated assets.</p>
                    </div>
                    <div className="flex gap-4">
                        <ConnectWallet />
                        <Button className="bg-gradient-to-r from-pink-600 to-violet-600">
                            <Plus className="mr-2 h-4 w-4" />
                            Mint New Asset
                        </Button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-80 rounded-xl bg-muted/20 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {listings?.map((item) => (
                            <Card key={item.id} className="group overflow-hidden border-primary/20 hover:border-primary/50 transition-all">
                                <div className="aspect-square overflow-hidden bg-muted relative">
                                    <OptimizedImage
                                        src={item.image_url}
                                        alt={item.title}
                                        width={400}
                                        height={400}
                                        objectFit="cover"
                                        className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <Badge className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm">
                                        {item.type}
                                    </Badge>
                                </div>

                                <CardHeader className="p-4">
                                    <CardTitle className="text-lg truncate">{item.title}</CardTitle>
                                    <CardDescription className="text-xs truncate">
                                        by {item.seller.slice(0, 6)}...{item.seller.slice(-4)}
                                    </CardDescription>
                                </CardHeader>

                                <CardFooter className="p-4 pt-0 flex justify-between items-center">
                                    <div className="flex items-center gap-1 font-bold text-lg text-primary">
                                        <Tag className="h-4 w-4" />
                                        {item.price} FLOW
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => buyMutation.mutate(item.id)}
                                        disabled={buyMutation.isPending}
                                    >
                                        <ShoppingCart className="mr-2 h-4 w-4" />
                                        Buy Now
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
