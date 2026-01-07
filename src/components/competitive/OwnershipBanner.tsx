import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Download, 
  Coins, 
  Key, 
  ArrowRight, 
  CheckCircle2,
  Globe
} from "lucide-react";

interface OwnershipBannerProps {
  variant?: "full" | "compact";
  onExportClick?: () => void;
  onLearnMore?: () => void;
}

export const OwnershipBanner = ({ 
  variant = "full",
  onExportClick,
  onLearnMore 
}: OwnershipBannerProps) => {
  const features = [
    {
      icon: <Coins className="w-4 h-4" />,
      title: "NFT Ownership",
      description: "Mint your content as NFTs with fractional shares"
    },
    {
      icon: <Key className="w-4 h-4" />,
      title: "$FLOW Token",
      description: "Stake tokens, earn rewards, vote on governance"
    },
    {
      icon: <Download className="w-4 h-4" />,
      title: "Full Portability",
      description: "Export everything: data, vectors, source files"
    },
    {
      icon: <Globe className="w-4 h-4" />,
      title: "EU Data Act",
      description: "100% compliant with 2026 data portability laws"
    }
  ];

  if (variant === "compact") {
    return (
      <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl p-4 border border-cyan-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">You Own Your Content</h4>
              <p className="text-xs text-muted-foreground">
                NFTs • $FLOW Token • Full Export
              </p>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={onLearnMore}>
            Learn More
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <section className="py-16 px-6 bg-gradient-to-b from-background to-cyan-950/20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <Badge variant="secondary" className="mb-4 bg-cyan-500/20 text-cyan-300">
            <Shield className="w-3.5 h-3.5 mr-2" />
            True Content Ownership
          </Badge>
          <h2 className="text-4xl font-bold mb-4">
            The Only Platform Where You{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Actually Own
            </span>{" "}
            Your Content
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            No lock-in. No platform dependency. Your content, your data, your rules.
            Export everything anytime with EU Data Act compliance.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {features.map((feature, i) => (
            <div 
              key={i}
              className="bg-card/50 border border-cyan-500/10 rounded-xl p-5 hover:border-cyan-500/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-3">
                {feature.icon}
              </div>
              <h3 className="font-semibold mb-1">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Comparison */}
        <div className="bg-card/30 border border-border/50 rounded-2xl p-6 mb-8">
          <h3 className="font-semibold mb-4 text-center">Platform Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-3 px-4">Feature</th>
                  <th className="text-center py-3 px-4 text-cyan-400">FlowAI</th>
                  <th className="text-center py-3 px-4 text-muted-foreground">YouTube</th>
                  <th className="text-center py-3 px-4 text-muted-foreground">Twitch</th>
                  <th className="text-center py-3 px-4 text-muted-foreground">Kick</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Revenue Split", flowai: "95%", youtube: "70%", twitch: "50%", kick: "95%" },
                  { feature: "NFT Minting", flowai: true, youtube: false, twitch: false, kick: false },
                  { feature: "Token Staking", flowai: true, youtube: false, twitch: false, kick: false },
                  { feature: "Full Data Export", flowai: true, youtube: false, twitch: false, kick: false },
                  { feature: "AI Video Generation", flowai: true, youtube: false, twitch: false, kick: false },
                  { feature: "Voice Cloning", flowai: true, youtube: false, twitch: false, kick: false },
                  { feature: "Auto-SEO VODs", flowai: true, youtube: false, twitch: false, kick: false },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-border/30">
                    <td className="py-3 px-4 font-medium">{row.feature}</td>
                    <td className="text-center py-3 px-4">
                      {typeof row.flowai === 'boolean' ? (
                        row.flowai ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )
                      ) : (
                        <span className="text-cyan-400 font-semibold">{row.flowai}</span>
                      )}
                    </td>
                    <td className="text-center py-3 px-4">
                      {typeof row.youtube === 'boolean' ? (
                        row.youtube ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )
                      ) : (
                        <span className="text-muted-foreground">{row.youtube}</span>
                      )}
                    </td>
                    <td className="text-center py-3 px-4">
                      {typeof row.twitch === 'boolean' ? (
                        row.twitch ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )
                      ) : (
                        <span className="text-muted-foreground">{row.twitch}</span>
                      )}
                    </td>
                    <td className="text-center py-3 px-4">
                      {typeof row.kick === 'boolean' ? (
                        row.kick ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )
                      ) : (
                        <span className="text-muted-foreground">{row.kick}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button size="lg" onClick={onExportClick} className="gap-2">
            <Download className="w-5 h-5" />
            Try Full Export Demo
          </Button>
          <p className="text-xs text-muted-foreground mt-3">
            Export your data anytime. No questions asked.
          </p>
        </div>
      </div>
    </section>
  );
};

export default OwnershipBanner;
