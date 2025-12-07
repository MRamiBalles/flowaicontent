import { useState, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Smile, Zap, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

const EMOTE_STYLES = [
    { id: "pixel", name: "Pixel Art", emoji: "👾" },
    { id: "anime", name: "Anime", emoji: "👺" },
    { id: "chibi", name: "Chibi", emoji: "👶" },
    { id: "pepe", name: "Rare Pepe", emoji: "🐸" },
];

export default function StreamerStudio() {
    const { user, isAdmin } = useUser();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [selectedStyle, setSelectedStyle] = useState("pixel");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedEmotes, setGeneratedEmotes] = useState<string[]>([]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsCameraOn(true);
            }
        } catch (err) {
            toast.error("Could not access webcam");
        }
    };

    const generateEmote = () => {
        if (!isCameraOn) {
            toast.error("Turn on camera first!");
            return;
        }
        setIsGenerating(true);

        // Mock AI generation delay
        setTimeout(() => {
            setIsGenerating(false);
            // Add a mock result
            const mockResult = `https://api.dicebear.com/7.x/${selectedStyle === 'pixel' ? 'pixel-art' : 'avataaars'}/svg?seed=${Date.now()}`;
            setGeneratedEmotes(prev => [mockResult, ...prev]);
            toast.success("Emote generated! +50 XP");
        }, 2000);
    };

    return (
        <AppLayout user={user} isAdmin={isAdmin}>
            <div className="container mx-auto p-6 space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent">
                            Streamer Studio 🎮
                        </h1>
                        <p className="text-muted-foreground">Turn your reactions into viral emotes instantly.</p>
                    </div>
                    <div className="bg-yellow-500/10 text-yellow-500 px-4 py-1 rounded-full text-sm font-medium border border-yellow-500/20">
                        Beta Access
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Capture Area */}
                    <Card className="border-border/50 bg-card/50 backdrop-blur">
                        <CardContent className="p-6 space-y-6">
                            <div className="aspect-video bg-black/80 rounded-xl overflow-hidden relative flex items-center justify-center border-2 border-dashed border-muted-foreground/20">
                                {isCameraOn ? (
                                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
                                ) : (
                                    <div className="text-center space-y-4">
                                        <Camera className="w-12 h-12 text-muted-foreground mx-auto" />
                                        <Button onClick={startCamera} variant="outline">
                                            Enable Webcam
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <label className="text-sm font-medium">Choose Emote Style</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {EMOTE_STYLES.map(style => (
                                        <button
                                            key={style.id}
                                            onClick={() => setSelectedStyle(style.id)}
                                            className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all ${selectedStyle === style.id
                                                    ? "border-purple-500 bg-purple-500/10 text-purple-500"
                                                    : "border-border hover:border-primary/50"
                                                }`}
                                        >
                                            <span className="text-2xl">{style.emoji}</span>
                                            <span className="text-xs font-medium">{style.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Button
                                size="lg"
                                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                                onClick={generateEmote}
                                disabled={isGenerating || !isCameraOn}
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Generating Magic...
                                    </>
                                ) : (
                                    <>
                                        <Zap className="w-4 h-4 mr-2" />
                                        Generate Emote
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Results Area */}
                    <Card className="border-border/50 bg-card/50 backdrop-blur">
                        <CardContent className="p-6">
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                                <Smile className="w-4 h-4 text-primary" />
                                Your Emote Gallery
                            </h3>

                            {generatedEmotes.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    No emotes yet. Make a funny face and hit generate!
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-4">
                                    {generatedEmotes.map((url, idx) => (
                                        <div key={idx} className="group relative aspect-square bg-muted/20 rounded-lg p-2 border border-border/50 hover:border-primary/50 transition-all">
                                            <img src={url} alt="Emote" className="w-full h-full object-contain" />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                                <Button size="icon" variant="secondary" className="h-8 w-8">
                                                    <Download className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            <div className="absolute top-1 right-1 bg-black/60 text-[10px] px-1 rounded text-white font-mono">
                                                112x112
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
