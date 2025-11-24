import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Video, Swords } from "lucide-react";

interface Match {
    streamer: {
        id: string;
        name: string;
        genre: string;
        viewers: number;
        tags: string[];
    };
    match_score: number;
}

interface RaidInterfaceProps {
    match: Match;
    onClose: () => void;
}

export function RaidInterface({ match, onClose }: RaidInterfaceProps) {
    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-card/95 backdrop-blur-xl border-primary/20">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                        Collaborate with {match.streamer.name}
                        <Badge variant="outline" className="ml-auto border-green-500 text-green-500">
                            {match.match_score}% Match
                        </Badge>
                    </DialogTitle>
                    <DialogDescription>
                        Coordinate a co-stream or plan a raid event.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                        <Avatar className="h-16 w-16 border-2 border-primary">
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${match.streamer.id}`} />
                            <AvatarFallback>{match.streamer.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h4 className="font-semibold text-lg">{match.streamer.name}</h4>
                            <p className="text-sm text-muted-foreground">
                                Streaming {match.streamer.genre} to {match.streamer.viewers.toLocaleString()} viewers
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Button variant="outline" className="h-24 flex flex-col gap-2 hover:border-primary hover:bg-primary/5">
                            <Video className="h-8 w-8 text-blue-400" />
                            <span>Start Co-Stream</span>
                            <span className="text-xs text-muted-foreground font-normal">Share screen & audio</span>
                        </Button>
                        <Button variant="outline" className="h-24 flex flex-col gap-2 hover:border-red-500 hover:bg-red-500/5">
                            <Swords className="h-8 w-8 text-red-400" />
                            <span>Plan Raid</span>
                            <span className="text-xs text-muted-foreground font-normal">Redirect audience</span>
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Quick Message</label>
                        <div className="flex gap-2">
                            <input
                                className="flex-1 bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder={`Hi ${match.streamer.name}, want to collab?`}
                            />
                            <Button size="icon">
                                <MessageSquare className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
