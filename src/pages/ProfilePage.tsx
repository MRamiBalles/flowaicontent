import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserPlus, UserCheck, MessageSquare, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Profile {
    id: string;
    username: string;
    avatar_url: string;
    bio: string;
    flow_points: number;
    total_minutes_watched: number;
}

export default function ProfilePage() {
    const { id } = useParams<{ id: string }>();
    const { user, isAdmin } = useUser();
    const queryClient = useQueryClient();
    const [isFollowing, setIsFollowing] = useState(false);

    // Fetch Profile Data
    const { data: profile, isLoading } = useQuery({
        queryKey: ["profile", id],
        queryFn: async () => {
            // In a real app, we'd join with a 'profiles' table. 
            // For now, mocking or fetching basic auth user data if public, 
            // but since RLS might restrict auth.users, we typically read from a public 'profiles' table.
            // Assuming 'profiles' table exists from previous context.
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", id)
                .single();

            if (error) throw error;
            return data as Profile;
        },
        enabled: !!id
    });

    // Check Follow Status
    useEffect(() => {
        async function checkFollow() {
            if (!user || !id) return;
            const { data } = await supabase
                .from("followers")
                .select("*")
                .eq("follower_id", user.id)
                .eq("following_id", id)
                .maybeSingle();
            setIsFollowing(!!data);
        }
        checkFollow();
    }, [user, id]);

    // Follow/Unfollow Mutation
    const toggleFollowMutation = useMutation({
        mutationFn: async () => {
            if (!user) throw new Error("Must be logged in");

            if (isFollowing) {
                const { error } = await supabase
                    .from("followers")
                    .delete()
                    .eq("follower_id", user.id)
                    .eq("following_id", id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("followers")
                    .insert({ follower_id: user.id, following_id: id });
                if (error) throw error;
            }
        },
        onSuccess: () => {
            setIsFollowing(!isFollowing);
            toast.success(isFollowing ? "Unfollowed" : "Following!");
            queryClient.invalidateQueries({ queryKey: ["followers", id] });
        },
        onError: () => toast.error("Action failed")
    });

    if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;
    if (!profile) return <div className="p-8">User not found</div>;

    return (
        <AppLayout user={user} isAdmin={isAdmin}>
            <div className="container mx-auto p-6 max-w-4xl space-y-8">

                {/* Header / Banner */}
                <div className="relative h-48 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 mb-16">
                    <div className="absolute -bottom-12 left-8 flex items-end gap-6">
                        <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
                            <AvatarImage src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`} />
                            <AvatarFallback>{profile.username?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="mb-4 space-y-1">
                            <h1 className="text-3xl font-bold text-white shadow-sm">{profile.username || "Anonymous Creator"}</h1>
                            <div className="flex gap-2">
                                <Badge variant="secondary" className="bg-black/40 text-white hover:bg-black/60">
                                    Level 5 Creator
                                </Badge>
                                <Badge variant="secondary" className="bg-yellow-500/80 text-black hover:bg-yellow-500">
                                    Top Rated
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <div className="absolute bottom-4 right-8 flex gap-3">
                        {user?.id !== id && (
                            <Button
                                variant={isFollowing ? "secondary" : "default"}
                                onClick={() => toggleFollowMutation.mutate()}
                                disabled={toggleFollowMutation.isPending}
                            >
                                {isFollowing ? <UserCheck className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
                                {isFollowing ? "Following" : "Follow"}
                            </Button>
                        )}
                        <Button variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                            <MessageSquare className="mr-2 h-4 w-4" /> Message
                        </Button>
                    </div>
                </div>

                {/* Stats Grid - Learn to Earn */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                    <Card>
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-3 bg-yellow-500/10 rounded-full text-yellow-500">
                                <Trophy className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Flow Points</p>
                                <p className="text-2xl font-bold">{profile.flow_points || 0}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-3 bg-blue-500/10 rounded-full text-blue-500">
                                <UserPlus className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Followers</p>
                                <p className="text-2xl font-bold">128</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-3 bg-green-500/10 rounded-full text-green-500">
                                <Loader2 className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Minutes Watched</p>
                                <p className="text-2xl font-bold">{profile.total_minutes_watched || 0}m</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Content Tabs */}
                <div className="space-y-4">
                    <div className="flex border-b border-border w-full">
                        <button className="px-4 py-2 border-b-2 border-primary font-medium text-sm">Videos</button>
                        <button className="px-4 py-2 border-b-2 border-transparent text-muted-foreground hover:text-foreground font-medium text-sm">Playlists</button>
                        <button className="px-4 py-2 border-b-2 border-transparent text-muted-foreground hover:text-foreground font-medium text-sm">Community</button>
                        <button className="px-4 py-2 border-b-2 border-transparent text-muted-foreground hover:text-foreground font-medium text-sm">About</button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="group cursor-pointer space-y-2">
                                <div className="aspect-video bg-muted rounded-xl overflow-hidden relative border border-border/50">
                                    <img
                                        src={`https://images.unsplash.com/photo-${1600000000000 + i}?w=400&auto=format&fit=crop&q=60`}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded">10:00</div>
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm leading-tight group-hover:text-primary transition-colors">How to build a SaaS in 2025 #{i}</h4>
                                    <p className="text-xs text-muted-foreground">1.2K views • 3 days ago</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </AppLayout>
    );
}
