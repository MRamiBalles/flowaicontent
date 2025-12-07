import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { RaidInterface } from "@/components/raid/RaidInterface";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Zap, Signal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { AppLayout } from "@/components/layout/AppLayout";
import { useUser } from "@/hooks/useUser";

interface Match {
    streamer: {
        id: string;
        name: string;
        genre: string;
        viewers: number;
        tags: string[];
    };
    match_score: number;
    match_reasons: string[];
}

export default function CoStream() {
    const { toast } = useToast();
    const { user, isAdmin } = useUser();
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

    const { data: matches, isLoading } = useQuery({
        queryKey: ["co-stream-matches"],
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/co-streaming/matches`, {
                headers: {
                    "Authorization": `Bearer ${session?.access_token}`
                }
            });
            if (!response.ok) throw new Error("Failed to fetch matches");
            return response.json() as Promise<Match[]>;
        }
    });

    const raidMutation = useMutation({
        mutationFn: async (targetId: string) => {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/co-streaming/raid`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ target_id: targetId })
            });
            if (!response.ok) throw new Error("Raid failed");
            return response.json();
        },
        onSuccess: (data) => {
            toast({
                title: "Raid Initiated! 🚀",
                description: `Raiding ${data.target_name}...`,
            });
        }
    });

    return (
        <AppLayout user={user} isAdmin={isAdmin}>
            <div className="container mx-auto p-6 space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                            AI Co-Streaming
                        </h1>
                        <p className="text-muted-foreground">Find your perfect streaming partners powered by AI.</p>
                    </div>
                    <Button variant="outline">
                        <Signal className="mr-2 h-4 w-4 text-green-500" />
                        Live Status
                    </Button>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-64 rounded-xl bg-muted/20 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {matches?.map((match) => (
                            <Card key={match.streamer.id} className="bg-card/50 backdrop-blur-sm border-primary/20 hover:border-primary/50 transition-all">
                                <CardHeader className="flex flex-row items-center gap-4">
                                    <Avatar className="h-12 w-12 border-2 border-primary">
                                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${match.streamer.id}`} />
                                        <AvatarFallback>{match.streamer.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <CardTitle className="text-lg">{match.streamer.name}</CardTitle>
                                        <CardDescription className="flex items-center gap-1">
                                            <Users className="h-3 w-3" />
                                            {match.streamer.viewers.toLocaleString()} viewers
                                        </CardDescription>
                                    </div>
                                    <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                                        {match.match_score}% Match
                                    </Badge>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex flex-wrap gap-2">
                                        {match.streamer.tags.map((tag) => (
                                            <Badge key={tag} variant="outline" className="text-xs">
                                                #{tag}
                                            </Badge>
                                        ))}
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-xs text-muted-foreground font-semibold uppercase">Why it matches</p>
                                        <ul className="text-sm space-y-1">
                                            {match.match_reasons.map((reason, idx) => (
                                                <li key={idx} className="flex items-center gap-2">
                                                    <Zap className="h-3 w-3 text-yellow-500" />
                                                    {reason}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <Button className="flex-1" onClick={() => setSelectedMatch(match)}>
                                            Collaborate
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                                            onClick={() => raidMutation.mutate(match.streamer.id)}
                                        >
                                            Raid ⚔️
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {selectedMatch && (
                    <RaidInterface
                        match={selectedMatch}
                        onClose={() => setSelectedMatch(null)}
                    />
                )}
            </div>
        </AppLayout>
    );
}
