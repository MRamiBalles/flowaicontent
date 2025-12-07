import { useState, useRef, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Mic, MicOff, Video, VideoOff, Flag, ThumbsUp, X } from "lucide-react";
import { toast } from "sonner";

export default function FlowRoulette() {
    const { user, isAdmin } = useUser();
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [micOn, setMicOn] = useState(true);
    const [cameraOn, setCameraOn] = useState(true);
    const [partner, setPartner] = useState<any>(null);

    useEffect(() => {
        // Auto-start camera on mount
        startCamera();
        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Camera error", err);
            // toast.error("Could not access camera");
        }
    };

    const stopCamera = () => {
        if (localVideoRef.current && localVideoRef.current.srcObject) {
            const tracks = (localVideoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
        }
    };

    const toggleSearch = () => {
        if (isConnected) {
            disconnect();
        }

        setIsSearching(!isSearching);

        if (!isSearching) {
            // Simulate matching process
            setTimeout(() => {
                setIsSearching(false);
                setIsConnected(true);
                setPartner({
                    name: "CryptoEducator_99",
                    rating: 4.8,
                    interests: ["Blockchain", "Trading"],
                    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=crypto"
                });
                toast.success("Match Found! Say hello 👋");
            }, 2500);
        }
    };

    const disconnect = () => {
        setIsConnected(false);
        setPartner(null);
        setIsSearching(true); // Auto-search next?
        // For demo, just stop
        setIsSearching(false);
        toast.info("Disconnected");
    };

    return (
        <AppLayout user={user} isAdmin={isAdmin}>
            <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
                {/* Main Video Area */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 relative">

                    {/* Local User */}
                    <div className="relative rounded-2xl overflow-hidden bg-black/80 border border-border/50">
                        <video ref={localVideoRef} autoPlay playsInline muted className={`w-full h-full object-cover transform scale-x-[-1] ${!cameraOn && 'hidden'}`} />
                        {!cameraOn && (
                            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                                <VideoOff className="w-12 h-12" />
                            </div>
                        )}
                        <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded-full text-white text-sm font-medium">
                            You {user?.email?.split('@')[0]}
                        </div>
                    </div>

                    {/* Remote Partner */}
                    <div className="relative rounded-2xl overflow-hidden bg-black/90 border border-border/50 flex items-center justify-center">
                        {isSearching ? (
                            <div className="text-center space-y-4 animate-pulse">
                                <div className="w-24 h-24 rounded-full bg-primary/20 mx-auto flex items-center justify-center relative">
                                    <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                                    <Loader2 className="w-10 h-10 text-primary" />
                                </div>
                                <p className="text-lg font-medium text-primary">Looking for a constructive partner...</p>
                                <Badge variant="outline" className="bg-background/50">Category: General</Badge>
                            </div>
                        ) : isConnected && partner ? (
                            <>
                                {/* Mock Remote Video */}
                                <img
                                    src={`https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=800&auto=format&fit=crop&q=60`}
                                    className="w-full h-full object-cover opacity-80"
                                    alt="Partner"
                                />
                                <div className="absolute top-4 left-4 flex items-center gap-2">
                                    <Badge variant="secondary" className="bg-black/60 text-white hover:bg-black/70 gap-1">
                                        ⭐ {partner.rating}
                                    </Badge>
                                    {partner.interests.map((int: string) => (
                                        <Badge key={int} variant="outline" className="bg-black/40 text-white border-white/20">
                                            {int}
                                        </Badge>
                                    ))}
                                </div>
                                <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded-full text-white text-sm font-medium flex items-center gap-2">
                                    <Avatar className="w-6 h-6 border border-white/20">
                                        <AvatarImage src={partner.avatar} />
                                        <AvatarFallback>P</AvatarFallback>
                                    </Avatar>
                                    {partner.name}
                                </div>
                            </>
                        ) : (
                            <div className="text-center space-y-4">
                                <div className="w-20 h-20 bg-muted rounded-full mx-auto flex items-center justify-center mb-4">
                                    <Video className="w-10 h-10 text-muted-foreground" />
                                </div>
                                <h2 className="text-2xl font-bold">Ready to Connect?</h2>
                                <p className="text-muted-foreground max-w-sm mx-auto">
                                    Meet creators, teachers, and learners from around the world.
                                    Keep it constructive to earn more Flow Points.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Controls Bar */}
                <div className="h-20 bg-card border-t border-border/50 px-6 flex items-center justify-between">
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => setMicOn(!micOn)} className={!micOn ? "bg-red-500/10 text-red-500 border-red-500/20" : ""}>
                            {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => setCameraOn(!cameraOn)} className={!cameraOn ? "bg-red-500/10 text-red-500 border-red-500/20" : ""}>
                            {cameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                        </Button>
                    </div>

                    <div className="flex gap-4">
                        {isConnected ? (
                            <Button
                                size="lg"
                                variant="destructive"
                                className="rounded-full px-8 shadow-lg shadow-red-500/20"
                                onClick={disconnect}
                            >
                                <X className="w-5 h-5 mr-2" /> End Call
                            </Button>
                        ) : (
                            <Button
                                size="lg"
                                className={`rounded-full px-8 shadow-lg transition-all ${isSearching ? 'bg-yellow-500 hover:bg-yellow-600 shadow-yellow-500/20' : 'bg-green-600 hover:bg-green-700 shadow-green-500/20'}`}
                                onClick={toggleSearch}
                            >
                                {isSearching ? "Searching..." : "Start Random Chat"}
                            </Button>
                        )}
                    </div>

                    <div className="flex gap-2 opacity-50 hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" title="Report User">
                            <Flag className="w-5 h-5 text-red-500" />
                        </Button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
