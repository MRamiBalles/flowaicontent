import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Percent, 
  Sparkles, 
  Search, 
  Puzzle, 
  Shield, 
  ArrowRight,
  Zap,
  Crown,
  Globe,
  Download
} from "lucide-react";

interface CompetitiveAdvantageProps {
  showCTA?: boolean;
  onGetStarted?: () => void;
}

export const CompetitiveAdvantages = ({ 
  showCTA = true, 
  onGetStarted 
}: CompetitiveAdvantageProps) => {
  const advantages = [
    {
      id: "revenue-split",
      title: "95/5 Revenue Split",
      subtitle: "Best of Kick",
      description: "Keep 95% of your earnings. The most creator-friendly split in the industry.",
      comparison: [
        { platform: "FlowAI", value: "95%", highlight: true },
        { platform: "Kick", value: "95%", highlight: false },
        { platform: "YouTube", value: "70%", highlight: false },
        { platform: "Twitch", value: "50%", highlight: false }
      ],
      icon: <Percent className="w-6 h-6" />,
      color: "emerald",
      badge: "Industry Leading"
    },
    {
      id: "ai-tools",
      title: "AI-Powered Creation",
      subtitle: "Exclusive to FlowAI",
      description: "Generate videos, emotes, and voice clones with cutting-edge AI. No equipment needed.",
      features: [
        "Video Generation",
        "Emote Generator", 
        "Voice Cloning",
        "Style Packs"
      ],
      icon: <Sparkles className="w-6 h-6" />,
      color: "purple",
      badge: "AI Native"
    },
    {
      id: "seo-vod",
      title: "Auto-SEO VODs",
      subtitle: "YouTube Killer",
      description: "Your streams automatically become SEO-optimized VODs. Discoverable forever.",
      features: [
        "AI Title Optimization",
        "Auto-Generated Chapters",
        "Smart Thumbnails",
        "Long-tail Discovery"
      ],
      icon: <Search className="w-6 h-6" />,
      color: "blue",
      badge: "Always Discoverable"
    },
    {
      id: "extensions-api",
      title: "Extensions API",
      subtitle: "Twitch Community Tools",
      description: "Open API for third-party developers. Build overlays, games, and integrations.",
      features: [
        "WebSocket Events",
        "OAuth2 Auth",
        "Overlay SDK",
        "Marketplace"
      ],
      icon: <Puzzle className="w-6 h-6" />,
      color: "orange",
      badge: "Open Platform"
    },
    {
      id: "ownership",
      title: "Own Your Content",
      subtitle: "Unique Value",
      description: "True ownership with NFTs, fractional shares, and EU Data Act compliant portability.",
      features: [
        "NFT Minting",
        "Fractional Ownership",
        "$FLOW Token Staking",
        "Full Data Export"
      ],
      icon: <Shield className="w-6 h-6" />,
      color: "cyan",
      badge: "Web3 Native"
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; border: string; text: string; badge: string }> = {
      emerald: {
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        text: "text-emerald-400",
        badge: "bg-emerald-500/20 text-emerald-300"
      },
      purple: {
        bg: "bg-purple-500/10",
        border: "border-purple-500/20",
        text: "text-purple-400",
        badge: "bg-purple-500/20 text-purple-300"
      },
      blue: {
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
        text: "text-blue-400",
        badge: "bg-blue-500/20 text-blue-300"
      },
      orange: {
        bg: "bg-orange-500/10",
        border: "border-orange-500/20",
        text: "text-orange-400",
        badge: "bg-orange-500/20 text-orange-300"
      },
      cyan: {
        bg: "bg-cyan-500/10",
        border: "border-cyan-500/20",
        text: "text-cyan-400",
        badge: "bg-cyan-500/20 text-cyan-300"
      }
    };
    return colors[color] || colors.purple;
  };

  return (
    <section className="py-16 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            <Crown className="w-3.5 h-3.5 mr-2" />
            Why FlowAI?
          </Badge>
          <h2 className="text-4xl font-bold mb-4">
            The Best of <span className="text-emerald-400">Kick</span>,{" "}
            <span className="text-red-400">YouTube</span> &{" "}
            <span className="text-purple-400">Twitch</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We took the best features from every platform and added AI superpowers.
            The only platform where creators truly own their content.
          </p>
        </div>

        {/* Advantages Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {advantages.map((adv) => {
            const colors = getColorClasses(adv.color);
            return (
              <Card 
                key={adv.id}
                className={`border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${colors.border}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className={`w-12 h-12 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center ${colors.text}`}>
                      {adv.icon}
                    </div>
                    <Badge className={colors.badge}>
                      {adv.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{adv.title}</CardTitle>
                  <p className="text-xs text-muted-foreground">{adv.subtitle}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {adv.description}
                  </p>
                  
                  {/* Revenue Comparison */}
                  {adv.comparison && (
                    <div className="space-y-2">
                      {adv.comparison.map((item) => (
                        <div 
                          key={item.platform}
                          className={`flex justify-between items-center p-2 rounded-lg ${
                            item.highlight 
                              ? 'bg-emerald-500/10 border border-emerald-500/20' 
                              : 'bg-muted/30'
                          }`}
                        >
                          <span className={`text-sm ${item.highlight ? 'font-semibold' : 'text-muted-foreground'}`}>
                            {item.platform}
                          </span>
                          <span className={`font-bold ${item.highlight ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Features List */}
                  {adv.features && (
                    <div className="grid grid-cols-2 gap-2">
                      {adv.features.map((feature) => (
                        <div 
                          key={feature}
                          className="flex items-center gap-2 text-xs text-muted-foreground"
                        >
                          <Zap className={`w-3 h-3 ${colors.text}`} />
                          {feature}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Ownership CTA */}
        <div className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 rounded-2xl p-8 border border-primary/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">
                  The Platform Where Creators <span className="text-primary">OWN</span> Their Content
                </h3>
                <p className="text-muted-foreground">
                  EU Data Act compliant • Full export anytime • Web3 ownership
                </p>
              </div>
            </div>
            
            {showCTA && (
              <div className="flex gap-3">
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Export Demo
                </Button>
                <Button onClick={onGetStarted} className="gap-2">
                  Start Creating
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CompetitiveAdvantages;
