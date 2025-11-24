import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Brain, Cpu, Zap, Activity, ShieldCheck, AlertTriangle, Eye } from 'lucide-react';

interface LRMVisualizerProps {
    isProcessing: boolean;
    data: any | null;
}

export const LRMVisualizer = ({ isProcessing, data }: LRMVisualizerProps) => {
    const [activeExperts, setActiveExperts] = useState<number[]>([]);
    const [progress, setProgress] = useState(0);

    // Simulación de animación de expertos
    useEffect(() => {
        if (isProcessing) {
            const interval = setInterval(() => {
                // Randomly activate 2 out of 4 experts
                const experts = [0, 1, 2, 3].sort(() => 0.5 - Math.random()).slice(0, 2);
                setActiveExperts(experts);
                setProgress((prev) => Math.min(prev + 5, 95));
            }, 200);
            return () => clearInterval(interval);
        } else if (data) {
            setProgress(100);
            setActiveExperts([]);
        } else {
            setProgress(0);
            setActiveExperts([]);
        }
    }, [isProcessing, data]);

    if (!isProcessing && !data) return null;

    return (
        <Card className="mt-4 p-4 bg-black/5 border-primary/20 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3">
                <Brain className={`w-5 h-5 ${isProcessing ? 'text-primary animate-pulse' : 'text-primary'}`} />
                <h3 className="font-semibold text-sm">LRM Core State</h3>
                {isProcessing && <span className="text-xs text-muted-foreground ml-auto animate-pulse">Processing...</span>}
            </div>

            <div className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Context Ingestion</span>
                        <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-1" />
                </div>

                {/* Experts Visualization */}
                <div className="grid grid-cols-4 gap-2">
                    {[0, 1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className={`
                h-12 rounded-md border flex flex-col items-center justify-center transition-all duration-200
                ${activeExperts.includes(i)
                                    ? 'bg-primary/20 border-primary shadow-[0_0_10px_rgba(var(--primary),0.3)] scale-105'
                                    : 'bg-background/50 border-border opacity-50'}
              `}
                        >
                            <Cpu className="w-4 h-4 mb-1" />
                            <span className="text-[10px] font-mono">EXP-{i}</span>
                        </div>
                    ))}
                </div>

                {/* Metrics */}
                {data && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
                        <div className="flex items-center gap-2 text-xs">
                            <Activity className="w-3 h-3 text-green-500" />
                            <span className="text-muted-foreground">Tokens:</span>
                            <span className="font-mono">{data.processed_tokens}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <Zap className="w-3 h-3 text-yellow-500" />
                            <span className="text-muted-foreground">Latency:</span>
                            <span className="font-mono">~45ms</span>
                        </div>

                        {/* COMPASS Metrics */}
                        {data.compass_metrics && (
                            <div className="col-span-2 mt-2 space-y-2 border-t border-border/50 pt-2">
                                <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-1">
                                        <ShieldCheck className="w-3 h-3 text-primary" />
                                        <span className="text-muted-foreground font-semibold">COMPASS Safety Layer</span>
                                    </div>
                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${data.compass_metrics.verification_status === 'verified'
                                            ? 'bg-green-500/10 text-green-600 border-green-500/20'
                                            : 'bg-red-500/10 text-red-600 border-red-500/20'
                                        }`}>
                                        {data.compass_metrics.verification_status.toUpperCase()}
                                    </span>
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                            <Eye className="w-3 h-3" /> CRS
                                        </div>
                                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                                style={{ width: `${data.compass_metrics.crs * 100}%` }}
                                            />
                                        </div>
                                        <div className="text-[10px] font-mono text-right">{data.compass_metrics.crs}</div>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                            <ShieldCheck className="w-3 h-3" /> Safety
                                        </div>
                                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-green-500 rounded-full transition-all duration-500"
                                                style={{ width: `${data.compass_metrics.safety_score * 100}%` }}
                                            />
                                        </div>
                                        <div className="text-[10px] font-mono text-right">{data.compass_metrics.safety_score}</div>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                            <AlertTriangle className="w-3 h-3" /> Risk
                                        </div>
                                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-red-500 rounded-full transition-all duration-500"
                                                style={{ width: `${data.compass_metrics.hallucination_risk * 100}%` }}
                                            />
                                        </div>
                                        <div className="text-[10px] font-mono text-right">{data.compass_metrics.hallucination_risk}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="col-span-2 text-[10px] font-mono text-muted-foreground mt-1 truncate">
                            Output Shape: {data.summary?.split('Output shape: ')[1] || 'N/A'}
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
};
