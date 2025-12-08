import { useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useUser } from "@/hooks/useUser";
import { CommentSection } from "@/components/Social/CommentSection";
import { DonationModal } from "@/components/Social/DonationModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { ThumbsUp, Share2, MoreHorizontal, Eye } from "lucide-react";

export default function Watch() {
    const { videoId } = useParams<{ videoId: string }>();
    const { user, isAdmin } = useUser();

    // Mock Video Data
    const videoData = {
        title: "Understanding Blockchain consensus mechanisms visually 🧊⛓️",
        views: "12,403",
        date: "2 hours ago",
        description: "In this video we break down Proof of Work vs Proof of Stake...",
        creator: {
            id: "creator-uuid-mock",
            name: "CryptoEducator_99",
            subs: "45K",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=crypto"
        },
        category: "Education",
        multiplier: 1.5
    };

    return (
        <AppLayout user={user} isAdmin={isAdmin}>
            <div className="container mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Main Video Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Player Mock */}
                    <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl relative group">
                        <img
                            src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&auto=format&fit=crop&q=60"
                            alt="Video Thumbnail"
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                                <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-white border-b-[12px] border-b-transparent ml-1"></div>
                            </div>
                        </div>
                        {/* HLS/DASH Player would go here */}
                    </div>

                    {/* Video Checksum / Info */}
                    <div className="space-y-4">
                        <h1 className="text-2xl font-bold">{videoData.title}</h1>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                            <div className="flex items-center gap-4">
                                <Avatar className="w-10 h-10 border border-primary/20">
                                    <AvatarImage src={videoData.creator.avatar} />
                                    <AvatarFallback>CE</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-semibold">{videoData.creator.name}</h3>
                                    <p className="text-xs text-muted-foreground">{videoData.creator.subs} subscribers</p>
                                </div>
                                <Button variant="secondary" className="rounded-full ml-2">Subscribe</Button>
                            </div>

                            <div className="flex items-center gap-2">
                                <DonationModal streamerId={videoData.creator.id} streamerName={videoData.creator.name} />
                                <div className="bg-secondary rounded-full flex items-center h-10">
                                    <Button variant="ghost" className="rounded-l-full px-4 hover:bg-secondary/80">
                                        <ThumbsUp className="w-4 h-4 mr-2" /> 982
                                    </Button>
                                    <div className="w-[1px] h-6 bg-border"></div>
                                    <Button variant="ghost" className="rounded-r-full px-4 hover:bg-secondary/80">
                                        <ThumbsUp className="w-4 h-4 rotate-180" />
                                    </Button>
                                </div>
                                <Button size="icon" variant="secondary" className="rounded-full"><Share2 className="w-4 h-4" /></Button>
                            </div>
                        </div>

                        <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <span>{videoData.views} views</span>
                                <span>•</span>
                                <span>{videoData.date}</span>
                                <span>•</span>
                                <Badge variant="outline" className="text-green-500 border-green-500/20 bg-green-500/10">
                                    Earn x{videoData.multiplier}
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {videoData.description}
                            </p>
                        </div>
                    </div>

                    {/* Comments */}
                    <CommentSection videoId={videoId || "demo"} />
                </div>

                {/* Recommended Sidebar */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Recommended for You</h3>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Card key={i} className="hover:bg-muted/50 transition-colors cursor-pointer border-transparent shadow-none">
                            <CardContent className="p-0 flex gap-2">
                                <div className="w-40 aspect-video bg-muted rounded-lg overflow-hidden relative flex-shrink-0">
                                    <img
                                        src={`https://images.unsplash.com/photo-${1600000000000 + i}?w=400&auto=format&fit=crop&q=60`}
                                        className="w-full h-full object-cover"
                                    />
                                    <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded">12:0{i}</span>
                                </div>
                                <div className="flex-1 min-w-0 py-1 space-y-1">
                                    <h4 className="text-sm font-semibold leading-tight line-clamp-2">Advanced AI patterns for future trading</h4>
                                    <p className="text-xs text-muted-foreground">FlowAI Official</p>
                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                        <span>5K views</span> • <span>2 days ago</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

            </div>
        </AppLayout>
    );
}
