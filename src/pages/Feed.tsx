import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { useUser } from "@/hooks/useUser";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Flame, TrendingUp, BookOpen, Smile } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function Feed() {
    const { user, isAdmin } = useUser();

    // Mock fetching categories
    const { data: categories } = useQuery({
        queryKey: ["categories"],
        queryFn: async () => {
            const { data } = await supabase.from("categories").select("*");
            return data || [];
        }
    });

    return (
        <AppLayout user={user} isAdmin={isAdmin}>
            <div className="container mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Sidebar - Navigation & Categories */}
                <div className="hidden lg:block col-span-3 space-y-6">
                    <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-4 space-y-2">
                        <h3 className="font-semibold px-2 mb-2 text-muted-foreground uppercase text-xs">Discover</h3>
                        <Button variant="ghost" className="w-full justify-start text-primary bg-primary/10">
                            <Flame className="mr-2 h-4 w-4" /> For You
                        </Button>
                        <Button variant="ghost" className="w-full justify-start">
                            <TrendingUp className="mr-2 h-4 w-4" /> Trending
                        </Button>
                        <Button variant="ghost" className="w-full justify-start">
                            <Smile className="mr-2 h-4 w-4" /> Following
                        </Button>
                    </div>

                    <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-4">
                        <h3 className="font-semibold px-2 mb-4 text-muted-foreground uppercase text-xs">Learn & Earn Categories</h3>
                        <div className="space-y-1">
                            {categories?.map((cat: any) => (
                                <div key={cat.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors group">
                                    <span className="text-sm font-medium">{cat.name}</span>
                                    <Badge variant="outline" className={`text-xs ${cat.reward_multiplier > 1 ? 'text-green-500 border-green-500/20' : 'text-muted-foreground'}`}>
                                        x{cat.reward_multiplier} Boost
                                    </Badge>
                                </div>
                            ))}
                            {!categories?.length && (
                                <p className="text-sm text-muted-foreground px-2">Loading categories...</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Feed */}
                <div className="col-span-1 lg:col-span-6 space-y-6">
                    {/* Mock Post 1 */}
                    <Card className="bg-card border-border/50">
                        <CardContent className="p-0">
                            <div className="aspect-video bg-black/90 relative">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-muted-foreground">Video Placeholder (HLS Stream)</span>
                                </div>
                                <div className="absolute top-4 left-4">
                                    <Badge className="bg-red-500">LIVE</Badge>
                                </div>
                            </div>
                            <div className="p-4 space-y-2">
                                <h3 className="font-bold text-lg leading-tight">Building a Decentralized Social App from Scratch 🚀</h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Avatar className="w-6 h-6">
                                        <AvatarImage src="https://github.com/shadcn.png" />
                                        <AvatarFallback>CN</AvatarFallback>
                                    </Avatar>
                                    <span>CodeWithManu</span>
                                    <span>•</span>
                                    <Badge variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-500">Education x1.5</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Mock Post 2 */}
                    <Card className="bg-card border-border/50">
                        <CardContent className="p-0">
                            <div className="aspect-video bg-black/90 relative">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-muted-foreground">AI Video Generation Result</span>
                                </div>
                            </div>
                            <div className="p-4 space-y-2">
                                <h3 className="font-bold text-lg leading-tight">Cyberpunk City Flight [4K Upscale]</h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Avatar className="w-6 h-6">
                                        <AvatarFallback>AI</AvatarFallback>
                                    </Avatar>
                                    <span>FlowAI Official</span>
                                    <span>•</span>
                                    <Badge variant="secondary" className="text-[10px]">Art & Design</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Sidebar - Suggested Accounts */}
                <div className="hidden lg:block col-span-3 space-y-6">
                    <div className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-4">
                        <h3 className="font-semibold mb-4">Suggested Creators</h3>
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i * 55}`} />
                                        <AvatarFallback>U{i}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">Creator {i}</p>
                                        <p className="text-xs text-muted-foreground">10k Followers</p>
                                    </div>
                                    <Button size="sm" variant="outline" className="h-8">Follow</Button>
                                </div>
                            ))}
                        </div>
                        <Button variant="link" className="w-full mt-4 text-xs text-muted-foreground">
                            View All Recommendations
                        </Button>
                    </div>
                </div>

            </div>
        </AppLayout>
    );
}
