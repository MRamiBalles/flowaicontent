import { AspectRatio } from "@/components/ui/aspect-ratio";

interface PreviewPlayerProps {
    isPlaying: boolean;
    currentTime: number;
}

export function PreviewPlayer({ isPlaying, currentTime }: PreviewPlayerProps) {
    return (
        <div className="w-full max-w-3xl bg-black rounded-lg shadow-2xl overflow-hidden border border-border/20">
            <AspectRatio ratio={16 / 9}>
                <div className="w-full h-full flex items-center justify-center relative">
                    {/* Mock Video Content */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/50 to-purple-900/50 animate-pulse" />

                    <div className="z-10 text-center">
                        <h3 className="text-2xl font-bold text-white tracking-tight">
                            FlowAI Preview
                        </h3>
                        <p className="text-white/60 font-mono mt-2">
                            {isPlaying ? "Playing..." : "Paused"}
                        </p>
                        <p className="text-white/40 text-sm mt-1">
                            Frame: {Math.floor(currentTime * 30)}
                        </p>
                    </div>

                    {/* Grid Overlay */}
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-10">
                        <div className="border-r border-b border-white" />
                        <div className="border-r border-b border-white" />
                        <div className="border-b border-white" />
                        <div className="border-r border-b border-white" />
                        <div className="border-r border-b border-white" />
                        <div className="border-b border-white" />
                        <div className="border-r border-white" />
                        <div className="border-r border-white" />
                        <div />
                    </div>
                </div>
            </AspectRatio>
        </div>
    );
}
