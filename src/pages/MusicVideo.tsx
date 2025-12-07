import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Music, Upload, Play, Pause, BarChart3, Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

const VISUAL_THEMES = [
    { id: "neon", name: "Neon Cyberpunk", color: "bg-pink-500" },
    { id: "nature", name: "Ethereal Nature", color: "bg-green-500" },
    { id: "abstract", name: "Deep Abstract", color: "bg-blue-500" },
    { id: "retro", name: "VHS Glitch", color: "bg-orange-500" },
];

export default function MusicVideo() {
    const { user, isAdmin } = useUser();
    const [file, setFile] = useState<File | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [bpm, setBpm] = useState<number | null>(null);
    const [selectedTheme, setSelectedTheme] = useState("neon");
    const [generating, setGenerating] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploaded = e.target.files?.[0];
        if (uploaded) {
            setFile(uploaded);
            analyzeAudio(uploaded);
        }
    };

    const analyzeAudio = (file: File) => {
        setAnalyzing(true);
        // Mock analysis
        setTimeout(() => {
            setAnalyzing(false);
            setBpm(128);
            toast.success("Audio analyzed: 128 BPM detected");
        }, 1500);
    };

    const handleGenerate = () => {
        setGenerating(true);
        setProgress(0);

        // Mock progress
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setGenerating(false);
                    toast.success("Music Video ready! 🎵");
                    return 100;
                }
                return prev + 10;
            });
        }, 500);
    };

    return (
        <AppLayout user={user} isAdmin={isAdmin}>
            <div className="container mx-auto p-6 space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
                            Music Video Gen 🎵
                        </h1>
                        <p className="text-muted-foreground">Turn your audio tracks into stunning beat-synced visuals.</p>
                    </div>
                    <div className="bg-pink-500/10 text-pink-500 px-4 py-1 rounded-full text-sm font-medium border border-pink-500/20">
                        Early Access
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Upload & Settings */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="bg-card/50 backdrop-blur border-border/50">
                            <CardContent className="p-6 space-y-6">
                                <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-8 text-center hover:bg-muted/20 transition-colors cursor-pointer relative">
                                    <input
                                        type="file"
                                        accept="audio/*"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={handleFileUpload}
                                    />
                                    <div className="space-y-2">
                                        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Upload className="w-6 h-6 text-primary" />
                                        </div>
                                        <p className="font-medium">Upload Audio File</p>
                                        <p className="text-xs text-muted-foreground">MP3, WAV, FLAC (Max 50MB)</p>
                                    </div>
                                </div>

                                {file && (
                                    <div className="bg-muted p-4 rounded-lg flex items-center gap-4">
                                        <Music className="w-8 h-8 text-rose-500" />
                                        <div className="flex-1 overflow-hidden">
                                            <p className="text-sm font-medium truncate">{file.name}</p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                {analyzing ? (
                                                    <span className="flex items-center gap-1 text-yellow-500">
                                                        <Loader2 className="w-3 h-3 animate-spin" /> Analyzing...
                                                    </span>
                                                ) : (
                                                    <span className="text-green-500 font-mono">
                                                        {bpm} BPM
                                                    </span>
                                                )}
                                                <span>•</span>
                                                <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <label className="text-sm font-medium">Visual Theme</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {VISUAL_THEMES.map(theme => (
                                            <button
                                                key={theme.id}
                                                onClick={() => setSelectedTheme(theme.id)}
                                                className={`p-3 rounded-lg text-left text-sm font-medium transition-all ${selectedTheme === theme.id
                                                        ? "ring-2 ring-primary ring-offset-2 ring-offset-background bg-muted"
                                                        : "hover:bg-muted/50 border border-transparent"
                                                    }`}
                                            >
                                                <div className={`w-3 h-3 rounded-full ${theme.color} mb-2`}></div>
                                                {theme.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <Button
                                    className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700"
                                    size="lg"
                                    disabled={!file || analyzing || generating}
                                    onClick={handleGenerate}
                                >
                                    {generating ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Rendering {progress}%
                                        </>
                                    ) : (
                                        <>
                                            <Wand2 className="mr-2 h-4 w-4" />
                                            Generate Video
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Preview/Player */}
                    <div className="lg:col-span-2">
                        <Card className="bg-card/50 backdrop-blur border-border/50 h-full min-h-[500px] flex flex-col">
                            <CardContent className="p-6 flex-1 flex flex-col">
                                <div className="flex-1 bg-black/40 rounded-xl relative overflow-hidden group border border-border/30">
                                    {generating && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
                                            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                                            <p className="font-mono text-sm animate-pulse">Syncing beats to pixels...</p>
                                            <Progress value={progress} className="w-64 mt-4 h-2" />
                                        </div>
                                    )}

                                    {!generating && !progress && (
                                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground flex-col gap-4">
                                            <BarChart3 className="w-16 h-16 opacity-20" />
                                            <p>Visualizer Preview will appear here</p>
                                        </div>
                                    )}

                                    {!generating && progress === 100 && (
                                        <div className="absolute inset-0 flex items-center justify-center flex-col gap-4">
                                            <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-purple-900 opacity-50 flex items-center justify-center">
                                                <Play className="w-20 h-20 text-white opacity-80 cursor-pointer hover:scale-110 transition-transform" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
