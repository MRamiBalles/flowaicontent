import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, AreaChart, Area, BarChart, Bar
} from "recharts";
import { Activity, Zap, Database, Play, Pause, RefreshCw } from "lucide-react";

interface EntropyDataPoint {
    frameIndex: number;
    timestampMs: number;
    spatialEntropy: number;
    temporalEntropy: number;
    totalEntropy: number;
    compressionRatio: number;
    attentionDensity: number;
}

interface EntropyScreenProps {
    videoId?: string;
    totalFrames?: number;
    fps?: number;
}

const EntropyScreen = ({
    videoId = "demo",
    totalFrames = 120,
    fps = 24
}: EntropyScreenProps) => {
    const [entropyData, setEntropyData] = useState<EntropyDataPoint[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [currentFrame, setCurrentFrame] = useState(0);
    const [compressionLevel, setCompressionLevel] = useState([70]);
    const [bitrateEstimate, setbitrateEstimate] = useState(12.5);

    // Generate realistic entropy data
    const generateEntropyPoint = useCallback((frameIdx: number): EntropyDataPoint => {
        const baseEntropy = 4.5 + Math.sin(frameIdx / 10) * 0.5;
        const motionEntropy = Math.abs(Math.sin(frameIdx / 5)) * 2;
        const sceneChange = frameIdx % 30 === 0 ? 1.5 : 0;

        return {
            frameIndex: frameIdx,
            timestampMs: (frameIdx / fps) * 1000,
            spatialEntropy: baseEntropy + sceneChange,
            temporalEntropy: motionEntropy,
            totalEntropy: baseEntropy + motionEntropy + sceneChange,
            compressionRatio: 1 / (1 + motionEntropy),
            attentionDensity: 1 - (motionEntropy / 3)
        };
    }, [fps]);

    // Initialize data
    useEffect(() => {
        const initialData = Array.from({ length: 30 }, (_, i) => generateEntropyPoint(i));
        setEntropyData(initialData);
    }, [generateEntropyPoint]);

    // Streaming simulation
    useEffect(() => {
        if (!isStreaming) return;

        const interval = setInterval(() => {
            setCurrentFrame(prev => {
                if (prev >= totalFrames - 1) {
                    setIsStreaming(false);
                    return prev;
                }
                return prev + 1;
            });

            setEntropyData(prev => {
                const newPoint = generateEntropyPoint(currentFrame + 1);
                const updated = [...prev, newPoint].slice(-60); // Keep last 60 frames

                // Update bitrate estimate
                const avgEntropy = updated.reduce((sum, p) => sum + p.totalEntropy, 0) / updated.length;
                setbitrateEstimate(8 + avgEntropy);

                return updated;
            });
        }, 1000 / fps);

        return () => clearInterval(interval);
    }, [isStreaming, currentFrame, totalFrames, fps, generateEntropyPoint]);

    // Calculate averages
    const avgSpatial = entropyData.length > 0
        ? (entropyData.reduce((sum, p) => sum + p.spatialEntropy, 0) / entropyData.length).toFixed(2)
        : "0.00";
    const avgTemporal = entropyData.length > 0
        ? (entropyData.reduce((sum, p) => sum + p.temporalEntropy, 0) / entropyData.length).toFixed(2)
        : "0.00";
    const avgCompression = entropyData.length > 0
        ? ((entropyData.reduce((sum, p) => sum + p.compressionRatio, 0) / entropyData.length) * 100).toFixed(1)
        : "0.0";

    return (
        <div className="space-y-6 p-4">
            {/* Header Controls */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Activity className="w-6 h-6 text-purple-500" />
                        Entropy Screen
                    </h2>
                    <p className="text-muted-foreground">
                        Real-time video compression analysis • Frame {currentFrame}/{totalFrames}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant={isStreaming ? "destructive" : "default"}
                        onClick={() => setIsStreaming(!isStreaming)}
                    >
                        {isStreaming ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                        {isStreaming ? "Pause" : "Stream"}
                    </Button>
                    <Button variant="outline" onClick={() => {
                        setCurrentFrame(0);
                        setEntropyData(Array.from({ length: 30 }, (_, i) => generateEntropyPoint(i)));
                    }}>
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-4 gap-4">
                <Card className="border-purple-500/20">
                    <CardContent className="pt-4 text-center">
                        <p className="text-3xl font-bold text-purple-500">{avgSpatial}</p>
                        <p className="text-sm text-muted-foreground">Spatial Entropy</p>
                    </CardContent>
                </Card>
                <Card className="border-blue-500/20">
                    <CardContent className="pt-4 text-center">
                        <p className="text-3xl font-bold text-blue-500">{avgTemporal}</p>
                        <p className="text-sm text-muted-foreground">Temporal Entropy</p>
                    </CardContent>
                </Card>
                <Card className="border-green-500/20">
                    <CardContent className="pt-4 text-center">
                        <p className="text-3xl font-bold text-green-500">{avgCompression}%</p>
                        <p className="text-sm text-muted-foreground">Compression Ratio</p>
                    </CardContent>
                </Card>
                <Card className="border-yellow-500/20">
                    <CardContent className="pt-4 text-center">
                        <p className="text-3xl font-bold text-yellow-500">{bitrateEstimate.toFixed(1)}</p>
                        <p className="text-sm text-muted-foreground">Bitrate (Mbps)</p>
                    </CardContent>
                </Card>
            </div>

            {/* Entropy Timeline Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Entropy Timeline</span>
                        <Badge variant="outline">Live</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={entropyData}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis
                                dataKey="frameIndex"
                                label={{ value: 'Frame', position: 'bottom' }}
                            />
                            <YAxis label={{ value: 'Entropy (bits)', angle: -90, position: 'left' }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                                formatter={(value: number) => value.toFixed(3)}
                            />
                            <Area
                                type="monotone"
                                dataKey="spatialEntropy"
                                stackId="1"
                                stroke="#a855f7"
                                fill="#a855f7"
                                fillOpacity={0.3}
                                name="Spatial"
                            />
                            <Area
                                type="monotone"
                                dataKey="temporalEntropy"
                                stackId="1"
                                stroke="#3b82f6"
                                fill="#3b82f6"
                                fillOpacity={0.3}
                                name="Temporal"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Compression & Attention Density */}
            <div className="grid md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="w-4 h-4" />
                            Compression Efficiency
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={entropyData}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="frameIndex" />
                                <YAxis domain={[0, 1]} />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="compressionRatio"
                                    stroke="#22c55e"
                                    strokeWidth={2}
                                    dot={false}
                                    name="Ratio"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="w-4 h-4" />
                            Attention Density
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={entropyData.slice(-20)}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="frameIndex" />
                                <YAxis domain={[0, 1]} />
                                <Tooltip />
                                <Bar
                                    dataKey="attentionDensity"
                                    fill="#f59e0b"
                                    name="Density"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Compression Control */}
            <Card>
                <CardHeader>
                    <CardTitle>NABLA Sparsity Control</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm">Sparsity Threshold</span>
                        <span className="text-sm font-bold text-purple-500">{compressionLevel[0]}%</span>
                    </div>
                    <Slider
                        value={compressionLevel}
                        onValueChange={setCompressionLevel}
                        max={95}
                        min={50}
                        step={5}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Higher Quality</span>
                        <span>Faster Processing</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-4">
                        <div className="p-2 bg-muted rounded text-center">
                            <p className="text-lg font-bold">{(100 - compressionLevel[0]) / 10 + 1.5}x</p>
                            <p className="text-xs text-muted-foreground">Speedup</p>
                        </div>
                        <div className="p-2 bg-muted rounded text-center">
                            <p className="text-lg font-bold">{(100 - (compressionLevel[0] / 5)).toFixed(1)}%</p>
                            <p className="text-xs text-muted-foreground">Quality</p>
                        </div>
                        <div className="p-2 bg-muted rounded text-center">
                            <p className="text-lg font-bold">{(bitrateEstimate * (1 - compressionLevel[0] / 200)).toFixed(1)}</p>
                            <p className="text-xs text-muted-foreground">Est. Mbps</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default EntropyScreen;
