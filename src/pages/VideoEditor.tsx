import { useState } from "react";
import { Timeline } from "@/components/editor/Timeline";
import { PreviewPlayer } from "@/components/editor/PreviewPlayer";
import { Button } from "@/components/ui/button";
import { Save, Download, Wand2 } from "lucide-react";
import { toast } from "sonner";

export default function VideoEditor() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);

    const handleExport = () => {
        toast.success("Export started! You will be notified when ready.");
    };

    const handleMagicEdit = () => {
        toast.info("AI Magic Edit: Analyzing footage...");
        // Mock AI processing
        setTimeout(() => {
            toast.success("AI Edit complete: Removed silence and enhanced colors.");
        }, 2000);
    };

    return (
        <div className="flex flex-col h-screen bg-background text-foreground">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-3 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <h1 className="text-lg font-semibold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                    FlowAI Editor <span className="text-xs text-muted-foreground font-normal ml-2">Beta</span>
                </h1>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={handleMagicEdit}>
                        <Wand2 className="w-4 h-4 mr-2" />
                        AI Magic
                    </Button>
                    <Button variant="outline" size="sm">
                        <Save className="w-4 h-4 mr-2" />
                        Save
                    </Button>
                    <Button size="sm" onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Preview Area */}
                <div className="flex-1 p-6 flex items-center justify-center bg-muted/20">
                    <PreviewPlayer isPlaying={isPlaying} currentTime={currentTime} />
                </div>

                {/* Sidebar (Assets) - Hidden on mobile for now */}
                <div className="hidden md:flex w-64 border-l border-border/40 flex-col p-4 gap-4">
                    <h3 className="font-medium">Assets</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="aspect-video bg-muted rounded-md cursor-pointer hover:ring-2 ring-primary/50 transition-all" />
                        ))}
                    </div>
                </div>
            </div>

            {/* Timeline Area */}
            <div className="h-72 border-t border-border/40 bg-background/95 backdrop-blur">
                <Timeline
                    isPlaying={isPlaying}
                    onPlayPause={() => setIsPlaying(!isPlaying)}
                    currentTime={currentTime}
                    onSeek={setCurrentTime}
                />
            </div>
        </div>
    );
}
