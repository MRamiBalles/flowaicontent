import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Zap, Shield, TrendingUp, Cpu, Database, Activity, Eye, BarChart3 } from "lucide-react";
import EntropyScreen from "@/components/linear/EntropyScreen";

const LinearVideoPlatform = () => {
  const [activeSequence, setActiveSequence] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);

  const complexityComparison = [
    { name: "Standard Transformer", complexity: "O(N²)", memory: "128 GB", speed: "1x", color: "bg-destructive" },
    { name: "Linear Attention", complexity: "O(N)", memory: "8 GB", speed: "12x", color: "bg-yellow-500" },
    { name: "Mamba SSM", complexity: "O(N)", memory: "0.5 GB", speed: "45x", color: "bg-green-500" },
    { name: "Ring Attention", complexity: "O(N²/P)", memory: "4 GB/node", speed: "25x", color: "bg-blue-500" },
  ];

  const verificationMetrics = {
    totalClaims: 47,
    verified: 38,
    partial: 6,
    disputed: 3,
    evidenceScore: 87.5,
    rewardMultiplier: 2.1,
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Linear Video Platform
          </h1>
          <p className="text-muted-foreground text-lg">
            O(N) Complexity • NABLA Attention • Valsci Truth Layer
          </p>
        </div>

        <Tabs defaultValue="backbone" className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full max-w-3xl mx-auto">
            <TabsTrigger value="backbone"><Cpu className="w-4 h-4 mr-2" />Backbone</TabsTrigger>
            <TabsTrigger value="nabla"><Zap className="w-4 h-4 mr-2" />NABLA</TabsTrigger>
            <TabsTrigger value="entropy"><BarChart3 className="w-4 h-4 mr-2" />Entropy</TabsTrigger>
            <TabsTrigger value="valsci"><Shield className="w-4 h-4 mr-2" />Valsci</TabsTrigger>
            <TabsTrigger value="metrics"><Activity className="w-4 h-4 mr-2" />Metrics</TabsTrigger>
          </TabsList>

          {/* Mamba SSM Backbone */}
          <TabsContent value="backbone" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" />
                    Selective State Space Model
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-muted-foreground">State Dimension</p>
                      <p className="text-2xl font-bold text-primary">16</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-muted-foreground">Layers</p>
                      <p className="text-2xl font-bold text-primary">24</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-muted-foreground">Expand Factor</p>
                      <p className="text-2xl font-bold text-primary">2x</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-muted-foreground">Complexity</p>
                      <p className="text-2xl font-bold text-green-500">O(N)</p>
                    </div>
                  </div>
                  <Button className="w-full" onClick={() => setActiveSequence("demo")}>
                    Initialize Video Sequence
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Complexity Comparison</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {complexityComparison.map((arch) => (
                    <div key={arch.name} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${arch.color}`} />
                        <span className="text-sm font-medium">{arch.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <Badge variant="outline">{arch.complexity}</Badge>
                        <span className="text-muted-foreground">{arch.memory}</span>
                        <span className="text-green-500 font-bold">{arch.speed}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Causal Cone Visualization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Causal Cone Visualization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 bg-gradient-to-b from-primary/20 via-primary/10 to-transparent rounded-lg flex items-end justify-center relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-0 h-0 border-l-[100px] border-r-[100px] border-b-[150px] border-l-transparent border-r-transparent border-b-primary/30" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 z-10">
                    Information flows through hidden state • Infinite effective context
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* NABLA Video Generation */}
          <TabsContent value="nabla" className="space-y-6">
            <Card className="border-purple-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-500" />
                  NABLA Block-Sparse Attention
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-3xl font-bold text-purple-500">2.7x</p>
                    <p className="text-sm text-muted-foreground">Speedup</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-3xl font-bold text-purple-500">70%</p>
                    <p className="text-sm text-muted-foreground">Sparsity</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-3xl font-bold text-purple-500">99.2%</p>
                    <p className="text-sm text-muted-foreground">Quality Retention</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Generation Progress</span>
                    <span>{processingProgress}%</span>
                  </div>
                  <Progress value={processingProgress} />
                </div>
                <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => setProcessingProgress(p => Math.min(p + 10, 100))}>
                  Generate 1080p Video
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Entropy Screen */}
          <TabsContent value="entropy" className="space-y-6">
            <EntropyScreen videoId="demo" totalFrames={120} fps={24} />
          </TabsContent>

          {/* Valsci Truth Layer */}
          <TabsContent value="valsci" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-green-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-500" />
                    Evidence Score
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <p className="text-5xl font-bold text-green-500">{verificationMetrics.evidenceScore}</p>
                    <Badge className="mt-2 bg-yellow-500">Gold Verified</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="p-2 bg-green-500/10 rounded text-center">
                      <p className="font-bold text-green-500">{verificationMetrics.verified}</p>
                      <p className="text-muted-foreground">Verified</p>
                    </div>
                    <div className="p-2 bg-yellow-500/10 rounded text-center">
                      <p className="font-bold text-yellow-500">{verificationMetrics.partial}</p>
                      <p className="text-muted-foreground">Partial</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Token Reward Multiplier
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <p className="text-5xl font-bold text-primary">{verificationMetrics.rewardMultiplier}x</p>
                    <p className="text-muted-foreground">Based on verification quality</p>
                  </div>
                  <Button variant="outline" className="w-full">
                    <Database className="w-4 h-4 mr-2" />
                    Run Auditor Node
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* System Metrics */}
          <TabsContent value="metrics">
            <Card>
              <CardHeader>
                <CardTitle>Architecture Efficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  {[
                    { label: "Memory Saved", value: "90%", icon: Database },
                    { label: "Speedup", value: "45x", icon: Zap },
                    { label: "Context Length", value: "∞", icon: Brain },
                    { label: "Quality", value: "98.5%", icon: Activity },
                  ].map((metric) => (
                    <div key={metric.label} className="text-center p-4 bg-muted rounded-lg">
                      <metric.icon className="w-8 h-8 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold">{metric.value}</p>
                      <p className="text-sm text-muted-foreground">{metric.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LinearVideoPlatform;
