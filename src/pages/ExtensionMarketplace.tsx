import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, Star, Download, Verified, Plus, Package, Code, 
  Layers, Smartphone, ArrowRight, Users, DollarSign, Zap,
  ExternalLink, Shield, TrendingUp
} from "lucide-react";
import { toast } from "sonner";

interface Extension {
  id: string;
  name: string;
  description: string;
  type: "overlay" | "panel" | "component" | "mobile";
  installs: number;
  rating: number;
  verified: boolean;
  price: number;
  developer: string;
  icon: string;
  category: string;
  featured?: boolean;
}

const mockExtensions: Extension[] = [
  {
    id: "ext_streamlabs",
    name: "StreamLabs Integration",
    description: "Connect your StreamLabs alerts, donations, and widgets seamlessly",
    type: "overlay",
    installs: 15000,
    rating: 4.8,
    verified: true,
    price: 0,
    developer: "StreamLabs",
    icon: "🎮",
    category: "Alerts",
    featured: true
  },
  {
    id: "ext_chatgpt",
    name: "AI Chat Moderator",
    description: "GPT-powered chat moderation with auto-responses and spam detection",
    type: "component",
    installs: 8500,
    rating: 4.6,
    verified: true,
    price: 4.99,
    developer: "FlowAI Labs",
    icon: "🤖",
    category: "Moderation",
    featured: true
  },
  {
    id: "ext_minigames",
    name: "Viewer Minigames",
    description: "Interactive games for your viewers with channel points integration",
    type: "panel",
    installs: 12000,
    rating: 4.7,
    verified: true,
    price: 2.99,
    developer: "GameDev Studio",
    icon: "🎲",
    category: "Engagement"
  },
  {
    id: "ext_predictions",
    name: "AI Predictions",
    description: "Let viewers bet on stream outcomes using channel points",
    type: "component",
    installs: 6200,
    rating: 4.5,
    verified: true,
    price: 0,
    developer: "FlowAI",
    icon: "🎯",
    category: "Engagement"
  },
  {
    id: "ext_overlays",
    name: "Premium Overlays Pack",
    description: "100+ animated overlays, alerts, and scene transitions",
    type: "overlay",
    installs: 9800,
    rating: 4.9,
    verified: true,
    price: 9.99,
    developer: "OverlayPro",
    icon: "✨",
    category: "Visuals",
    featured: true
  },
  {
    id: "ext_music",
    name: "Spotify Now Playing",
    description: "Display currently playing Spotify track on stream",
    type: "overlay",
    installs: 11200,
    rating: 4.4,
    verified: true,
    price: 0,
    developer: "MusicSync",
    icon: "🎵",
    category: "Music"
  },
  {
    id: "ext_polls",
    name: "Advanced Polls & Voting",
    description: "Create polls, voting, and viewer decisions with analytics",
    type: "panel",
    installs: 7300,
    rating: 4.6,
    verified: false,
    price: 1.99,
    developer: "PollMaster",
    icon: "📊",
    category: "Engagement"
  },
  {
    id: "ext_countdown",
    name: "Stream Countdown Timer",
    description: "Customizable countdown timer with sound effects",
    type: "overlay",
    installs: 5400,
    rating: 4.3,
    verified: true,
    price: 0,
    developer: "TimerTools",
    icon: "⏱️",
    category: "Utility"
  }
];

const categories = ["All", "Alerts", "Moderation", "Engagement", "Visuals", "Music", "Utility"];

const ExtensionMarketplace = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [installedExtensions, setInstalledExtensions] = useState<string[]>(["ext_predictions"]);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);

  const filteredExtensions = mockExtensions.filter(ext => {
    const matchesSearch = ext.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ext.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || ext.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredExtensions = mockExtensions.filter(ext => ext.featured);

  const handleInstall = (extensionId: string, name: string) => {
    if (installedExtensions.includes(extensionId)) {
      setInstalledExtensions(prev => prev.filter(id => id !== extensionId));
      toast.success(`${name} desinstalada`);
    } else {
      setInstalledExtensions(prev => [...prev, extensionId]);
      toast.success(`${name} instalada correctamente`);
    }
  };

  const handlePublishExtension = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Extensión enviada para revisión");
    setPublishDialogOpen(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "overlay": return <Layers className="h-4 w-4" />;
      case "panel": return <Package className="h-4 w-4" />;
      case "component": return <Code className="h-4 w-4" />;
      case "mobile": return <Smartphone className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Package className="h-8 w-8 text-primary" />
              Extension Marketplace
            </h1>
            <p className="text-muted-foreground mt-1">
              Descubre y publica extensiones para potenciar tus streams
            </p>
          </div>
          
          <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Publicar Extensión
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Publicar Nueva Extensión</DialogTitle>
              </DialogHeader>
              <form onSubmit={handlePublishExtension} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre de la Extensión</Label>
                  <Input placeholder="Mi Extensión Increíble" required />
                </div>
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea placeholder="Describe qué hace tu extensión..." required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select defaultValue="overlay">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="overlay">Overlay</SelectItem>
                        <SelectItem value="panel">Panel</SelectItem>
                        <SelectItem value="component">Componente</SelectItem>
                        <SelectItem value="mobile">Mobile</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Precio (USD)</Label>
                    <Input type="number" step="0.01" min="0" placeholder="0.00" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>URL del Manifest</Label>
                  <Input placeholder="https://miextension.com/manifest.json" required />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setPublishDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Enviar para Revisión</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card/50">
            <CardContent className="p-4 text-center">
              <Package className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{mockExtensions.length}</p>
              <p className="text-sm text-muted-foreground">Extensiones</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-emerald-400" />
              <p className="text-2xl font-bold">2.4k</p>
              <p className="text-sm text-muted-foreground">Desarrolladores</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4 text-center">
              <Download className="h-8 w-8 mx-auto mb-2 text-blue-400" />
              <p className="text-2xl font-bold">85k+</p>
              <p className="text-sm text-muted-foreground">Instalaciones</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4 text-center">
              <DollarSign className="h-8 w-8 mx-auto mb-2 text-amber-400" />
              <p className="text-2xl font-bold">$120k</p>
              <p className="text-sm text-muted-foreground">Pagado a Devs</p>
            </CardContent>
          </Card>
        </div>

        {/* Featured Extensions */}
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-400" />
            Extensiones Destacadas
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {featuredExtensions.map((ext) => (
              <Card key={ext.id} className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent hover:shadow-lg transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{ext.icon}</span>
                      <div>
                        <h3 className="font-semibold flex items-center gap-1">
                          {ext.name}
                          {ext.verified && <Verified className="h-4 w-4 text-primary" />}
                        </h3>
                        <p className="text-xs text-muted-foreground">por {ext.developer}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{ext.category}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{ext.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                        {ext.rating}
                      </span>
                      <span className="flex items-center gap-1">
                        <Download className="h-3.5 w-3.5" />
                        {(ext.installs / 1000).toFixed(1)}k
                      </span>
                    </div>
                    <Button 
                      size="sm" 
                      variant={installedExtensions.includes(ext.id) ? "outline" : "default"}
                      onClick={() => handleInstall(ext.id, ext.name)}
                    >
                      {installedExtensions.includes(ext.id) ? "Instalada" : ext.price === 0 ? "Gratis" : `$${ext.price}`}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Main Content */}
        <Tabs defaultValue="browse">
          <TabsList>
            <TabsTrigger value="browse">Explorar</TabsTrigger>
            <TabsTrigger value="installed">Mis Extensiones ({installedExtensions.length})</TabsTrigger>
            <TabsTrigger value="developer">Para Desarrolladores</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            {/* Search & Filter */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar extensiones..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>

            {/* Extensions Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredExtensions.map((ext) => (
                <Card key={ext.id} className="bg-card/50 hover:bg-card transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{ext.icon}</span>
                        <div>
                          <h3 className="font-medium flex items-center gap-1">
                            {ext.name}
                            {ext.verified && <Verified className="h-3.5 w-3.5 text-primary" />}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {getTypeIcon(ext.type)}
                            <span className="capitalize">{ext.type}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{ext.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                          {ext.rating}
                        </span>
                        <span>{(ext.installs / 1000).toFixed(1)}k</span>
                      </div>
                      <Button 
                        size="sm" 
                        variant={installedExtensions.includes(ext.id) ? "secondary" : "outline"}
                        onClick={() => handleInstall(ext.id, ext.name)}
                      >
                        {installedExtensions.includes(ext.id) ? "✓ Instalada" : ext.price === 0 ? "Instalar" : `$${ext.price}`}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="installed" className="space-y-4">
            {installedExtensions.length === 0 ? (
              <Card className="bg-card/50">
                <CardContent className="p-12 text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No tienes extensiones instaladas</h3>
                  <p className="text-muted-foreground mb-4">Explora el marketplace y potencia tus streams</p>
                  <Button onClick={() => (document.querySelector('[value="browse"]') as HTMLButtonElement)?.click()}>
                    Explorar Extensiones
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {mockExtensions.filter(ext => installedExtensions.includes(ext.id)).map((ext) => (
                  <Card key={ext.id} className="bg-card/50">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{ext.icon}</span>
                          <div>
                            <h3 className="font-medium">{ext.name}</h3>
                            <p className="text-xs text-muted-foreground">por {ext.developer}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">Configurar</Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-destructive"
                            onClick={() => handleInstall(ext.id, ext.name)}
                          >
                            Desinstalar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="developer" className="space-y-6">
            <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/30">
              <CardContent className="p-8">
                <div className="flex items-start gap-6">
                  <div className="p-4 rounded-xl bg-primary/20">
                    <Code className="h-10 w-10 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-2">SDK para Desarrolladores</h2>
                    <p className="text-muted-foreground mb-4">
                      Construye extensiones y llega a miles de streamers. 
                      Gana 70% de cada venta.
                    </p>
                    <div className="flex gap-3">
                      <Button className="gap-2">
                        <ExternalLink className="h-4 w-4" />
                        Ver Documentación
                      </Button>
                      <Button variant="outline" onClick={() => setPublishDialogOpen(true)}>
                        Publicar Extensión
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-3 gap-4">
              <Card className="bg-card/50">
                <CardContent className="p-6">
                  <Shield className="h-8 w-8 text-emerald-400 mb-3" />
                  <h3 className="font-semibold mb-2">Sandbox Seguro</h3>
                  <p className="text-sm text-muted-foreground">
                    Extensiones aisladas en iframes con permisos granulares
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card/50">
                <CardContent className="p-6">
                  <Zap className="h-8 w-8 text-amber-400 mb-3" />
                  <h3 className="font-semibold mb-2">WebSocket Events</h3>
                  <p className="text-sm text-muted-foreground">
                    Eventos en tiempo real: chat, donaciones, viewers
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card/50">
                <CardContent className="p-6">
                  <TrendingUp className="h-8 w-8 text-blue-400 mb-3" />
                  <h3 className="font-semibold mb-2">Analytics Dashboard</h3>
                  <p className="text-sm text-muted-foreground">
                    Métricas de instalaciones, uso y revenue en tiempo real
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* API Example */}
            <Card className="bg-card/50">
              <CardHeader>
                <CardTitle className="text-lg">Ejemplo de Manifest</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted/50 p-4 rounded-lg overflow-x-auto text-sm">
{`{
  "name": "Mi Extension",
  "version": "1.0.0",
  "type": "overlay",
  "permissions": ["stream:read", "chat:read"],
  "entry_point": "https://miext.com/overlay.html",
  "config_schema": {
    "color": { "type": "string", "default": "#FF0000" },
    "position": { "type": "string", "enum": ["top", "bottom"] }
  }
}`}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ExtensionMarketplace;
