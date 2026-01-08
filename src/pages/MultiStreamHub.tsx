import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Radio, Play, Square, Settings, Plus, Check, X, 
  Users, MessageSquare, TrendingUp, Copy, Eye, Wifi,
  Youtube, Twitch, AlertCircle, Zap, BarChart3
} from "lucide-react";
import { toast } from "sonner";

interface Platform {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  connected: boolean;
  streamKey?: string;
  viewers?: number;
  chatRate?: number;
  health?: "excellent" | "good" | "poor";
}

const MultiStreamHub = () => {
  const [isLive, setIsLive] = useState(false);
  const [streamTitle, setStreamTitle] = useState("");
  const [showStreamKey, setShowStreamKey] = useState<Record<string, boolean>>({});
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [streamKeyInput, setStreamKeyInput] = useState("");

  const [platforms, setPlatforms] = useState<Platform[]>([
    { 
      id: "youtube", 
      name: "YouTube", 
      icon: <Youtube className="h-5 w-5" />, 
      color: "bg-red-500", 
      connected: false,
      viewers: 0,
      chatRate: 0
    },
    { 
      id: "twitch", 
      name: "Twitch", 
      icon: <Twitch className="h-5 w-5" />, 
      color: "bg-purple-500", 
      connected: true,
      streamKey: "live_xxxxx_xxxxxxxxxxxxxxxx",
      viewers: 3240,
      chatRate: 120,
      health: "excellent"
    },
    { 
      id: "kick", 
      name: "Kick", 
      icon: <span className="text-lg">💚</span>, 
      color: "bg-green-500", 
      connected: true,
      streamKey: "sk_xxxxxxxxxxxxxxxxxx",
      viewers: 890,
      chatRate: 65,
      health: "good"
    },
    { 
      id: "facebook", 
      name: "Facebook", 
      icon: <span className="text-lg">📘</span>, 
      color: "bg-blue-600", 
      connected: false 
    },
    { 
      id: "tiktok", 
      name: "TikTok", 
      icon: <span className="text-lg">🎵</span>, 
      color: "bg-black", 
      connected: false 
    }
  ]);

  const connectedPlatforms = platforms.filter(p => p.connected);
  const totalViewers = connectedPlatforms.reduce((sum, p) => sum + (p.viewers || 0), 0);
  const totalChatRate = connectedPlatforms.reduce((sum, p) => sum + (p.chatRate || 0), 0);

  const ingestUrl = "rtmp://ingest.flowai.com/multistream/abc123xyz";

  const handleConnect = (platformId: string) => {
    setSelectedPlatform(platformId);
    setStreamKeyInput("");
    setConnectDialogOpen(true);
  };

  const handleSaveConnection = () => {
    if (!selectedPlatform || !streamKeyInput) return;
    
    setPlatforms(prev => prev.map(p => 
      p.id === selectedPlatform 
        ? { ...p, connected: true, streamKey: streamKeyInput }
        : p
    ));
    toast.success(`${platforms.find(p => p.id === selectedPlatform)?.name} conectado`);
    setConnectDialogOpen(false);
  };

  const handleDisconnect = (platformId: string) => {
    setPlatforms(prev => prev.map(p => 
      p.id === platformId 
        ? { ...p, connected: false, streamKey: undefined, viewers: 0, chatRate: 0 }
        : p
    ));
    toast.success("Plataforma desconectada");
  };

  const handleGoLive = () => {
    if (!streamTitle) {
      toast.error("Ingresa un título para el stream");
      return;
    }
    if (connectedPlatforms.length === 0) {
      toast.error("Conecta al menos una plataforma");
      return;
    }
    setIsLive(true);
    toast.success(`¡En vivo en ${connectedPlatforms.length} plataformas!`);
  };

  const handleStopStream = () => {
    setIsLive(false);
    toast.success("Stream finalizado");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado al portapapeles");
  };

  const getHealthColor = (health?: string) => {
    switch (health) {
      case "excellent": return "text-emerald-400";
      case "good": return "text-amber-400";
      case "poor": return "text-red-400";
      default: return "text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Radio className="h-8 w-8 text-primary" />
              Multi-Streaming Hub
            </h1>
            <p className="text-muted-foreground mt-1">
              Transmite a YouTube, Twitch y Kick simultáneamente
            </p>
          </div>
          
          {!isLive ? (
            <Button 
              size="lg" 
              className="gap-2 bg-red-600 hover:bg-red-700"
              onClick={handleGoLive}
            >
              <Play className="h-5 w-5" />
              Iniciar Multi-Stream
            </Button>
          ) : (
            <Button 
              size="lg" 
              variant="destructive"
              className="gap-2"
              onClick={handleStopStream}
            >
              <Square className="h-5 w-5" />
              Detener Stream
            </Button>
          )}
        </div>

        {/* Live Stats Banner */}
        {isLive && (
          <Card className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    <span className="font-semibold text-red-400">EN VIVO</span>
                  </div>
                  <span className="text-muted-foreground">|</span>
                  <span className="font-medium">{streamTitle}</span>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{totalViewers.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Viewers totales</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{totalChatRate}</p>
                    <p className="text-xs text-muted-foreground">Mensajes/min</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{connectedPlatforms.length}</p>
                    <p className="text-xs text-muted-foreground">Plataformas</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Platforms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stream Settings */}
            <Card className="bg-card/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configuración del Stream
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Título del Stream</Label>
                  <Input 
                    placeholder="¡Bienvenidos al stream!" 
                    value={streamTitle}
                    onChange={(e) => setStreamTitle(e.target.value)}
                    disabled={isLive}
                  />
                </div>
                
                <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                  <Label className="text-sm">URL de Ingest FlowAI (para OBS/Streamlabs)</Label>
                  <div className="flex gap-2">
                    <Input value={ingestUrl} readOnly className="font-mono text-sm" />
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(ingestUrl)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Usa esta URL única en tu software de streaming. FlowAI redistribuirá a todas las plataformas conectadas.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Platforms Grid */}
            <Card className="bg-card/50">
              <CardHeader>
                <CardTitle className="text-lg">Plataformas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {platforms.map((platform) => (
                    <Card 
                      key={platform.id} 
                      className={`relative overflow-hidden ${platform.connected ? 'border-primary/30' : 'border-border/50'}`}
                    >
                      <div className={`absolute top-0 left-0 right-0 h-1 ${platform.color}`} />
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${platform.color} bg-opacity-20`}>
                              {platform.icon}
                            </div>
                            <div>
                              <h3 className="font-medium">{platform.name}</h3>
                              {platform.connected && (
                                <p className={`text-xs ${getHealthColor(platform.health)}`}>
                                  {platform.health === "excellent" && "● Conexión excelente"}
                                  {platform.health === "good" && "● Conexión buena"}
                                  {platform.health === "poor" && "● Conexión débil"}
                                  {!platform.health && "Conectado"}
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge variant={platform.connected ? "default" : "outline"}>
                            {platform.connected ? "Activo" : "No conectado"}
                          </Badge>
                        </div>

                        {platform.connected && isLive && (
                          <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Eye className="h-4 w-4 text-muted-foreground" />
                              <span>{platform.viewers?.toLocaleString() || 0}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4 text-muted-foreground" />
                              <span>{platform.chatRate || 0}/min</span>
                            </div>
                          </div>
                        )}

                        {platform.connected ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">Stream Key</span>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setShowStreamKey(prev => ({ ...prev, [platform.id]: !prev[platform.id] }))}
                              >
                                {showStreamKey[platform.id] ? "Ocultar" : "Mostrar"}
                              </Button>
                            </div>
                            <Input 
                              type={showStreamKey[platform.id] ? "text" : "password"}
                              value={platform.streamKey}
                              readOnly
                              className="font-mono text-xs"
                            />
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="w-full text-destructive"
                              onClick={() => handleDisconnect(platform.id)}
                              disabled={isLive}
                            >
                              Desconectar
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            variant="outline" 
                            className="w-full gap-2"
                            onClick={() => handleConnect(platform.id)}
                          >
                            <Plus className="h-4 w-4" />
                            Conectar {platform.name}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Analytics */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="bg-card/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Estadísticas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Viewers Totales</span>
                    <span className="font-medium">{totalViewers.toLocaleString()}</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Chat Rate</span>
                    <span className="font-medium">{totalChatRate} msg/min</span>
                  </div>
                  <Progress value={60} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Bitrate</span>
                    <span className="font-medium">6000 kbps</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>

                <div className="pt-4 border-t border-border/50">
                  <h4 className="text-sm font-medium mb-3">Por Plataforma</h4>
                  <div className="space-y-3">
                    {connectedPlatforms.map((p) => (
                      <div key={p.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {p.icon}
                          <span className="text-sm">{p.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm font-medium">{p.viewers?.toLocaleString() || 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium mb-1">Consejo Pro</h4>
                    <p className="text-sm text-muted-foreground">
                      FlowAI optimiza automáticamente el bitrate para cada plataforma, 
                      asegurando la mejor calidad posible.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Revenue Split Info */}
            <Card className="bg-card/50">
              <CardContent className="p-4 space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  Revenue Split FlowAI
                </h4>
                <div className="text-3xl font-bold text-emerald-400">95%</div>
                <p className="text-sm text-muted-foreground">
                  Tú te quedas el 95% de todas las donaciones y suscripciones 
                  procesadas a través de FlowAI.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Connect Platform Dialog */}
      <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Conectar {platforms.find(p => p.id === selectedPlatform)?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-medium mb-2">Cómo obtener tu Stream Key:</h4>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                {selectedPlatform === "youtube" && (
                  <>
                    <li>Ve a YouTube Studio → Crear → Transmitir en vivo</li>
                    <li>Copia la "Clave de transmisión"</li>
                  </>
                )}
                {selectedPlatform === "twitch" && (
                  <>
                    <li>Ve a Twitch Dashboard → Configuración → Transmisión</li>
                    <li>Copia la "Clave de transmisión principal"</li>
                  </>
                )}
                {selectedPlatform === "kick" && (
                  <>
                    <li>Ve a Kick Dashboard → Settings → Stream</li>
                    <li>Copia tu "Stream Key"</li>
                  </>
                )}
                {selectedPlatform === "facebook" && (
                  <>
                    <li>Ve a Facebook Gaming Creator → Live Dashboard</li>
                    <li>Copia la "Persistent Stream Key"</li>
                  </>
                )}
                {selectedPlatform === "tiktok" && (
                  <>
                    <li>Ve a TikTok LIVE Studio (requiere 1000+ followers)</li>
                    <li>Copia tu "Stream Key"</li>
                  </>
                )}
              </ol>
            </div>

            <div className="space-y-2">
              <Label>Stream Key</Label>
              <Input 
                type="password"
                placeholder="Pega tu stream key aquí..."
                value={streamKeyInput}
                onChange={(e) => setStreamKeyInput(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-lg">
              <AlertCircle className="h-4 w-4 text-amber-400" />
              <p className="text-xs text-muted-foreground">
                Tu stream key se almacena de forma segura y nunca se comparte.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConnectDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveConnection} disabled={!streamKeyInput}>
                Conectar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MultiStreamHub;
