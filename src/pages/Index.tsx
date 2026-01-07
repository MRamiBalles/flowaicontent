import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Video, Coins, TrendingUp, Users, Zap, Shield, Sparkles, Play, CheckCircle2 } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageProvider";
import { LanguageSelector } from "@/components/ui/LanguageSelector";
import { CompetitiveAdvantages, RevenueCalculator, OwnershipBanner } from "@/components/competitive";

const Index = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const features = [
    {
      icon: <Sparkles className="w-6 h-6" />,
      titleKey: "landing.features.aiContent.title",
      descKey: "landing.features.aiContent.description",
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20"
    },
    {
      icon: <Video className="w-6 h-6" />,
      titleKey: "landing.features.videoStudio.title",
      descKey: "landing.features.videoStudio.description",
      color: "text-pink-400",
      bg: "bg-pink-500/10",
      border: "border-pink-500/20"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      titleKey: "landing.features.analytics.title",
      descKey: "landing.features.analytics.description",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20"
    },
    {
      icon: <Coins className="w-6 h-6" />,
      titleKey: "landing.features.economy.title",
      descKey: "landing.features.economy.description",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20"
    },
    {
      icon: <Users className="w-6 h-6" />,
      titleKey: "landing.features.collaboration.title",
      descKey: "landing.features.collaboration.description",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      titleKey: "landing.features.enterprise.title",
      descKey: "landing.features.enterprise.description",
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/20"
    }
  ];

  const stats = [
    { value: "10k+", labelKey: "landing.stats.creators" },
    { value: "1M+", labelKey: "landing.stats.content" },
    { value: "$500k+", labelKey: "landing.stats.earnings" },
    { value: "99.9%", labelKey: "landing.stats.uptime" }
  ];

  // Unified pricing tiers matching documentation
  const pricingPlans = [
    {
      name: t("pricing.tiers.free.name"),
      price: "$0",
      period: t("pricing.perMonth"),
      description: t("pricing.tiers.free.description"),
      features: (t("pricing.tiers.free.features") as unknown as string[]),
      cta: t("common.getStarted"),
      popular: false
    },
    {
      name: t("pricing.tiers.creator.name"),
      price: "$9.99",
      period: t("pricing.perMonth"),
      description: t("pricing.tiers.creator.description"),
      features: (t("pricing.tiers.creator.features") as unknown as string[]),
      cta: t("pricing.startTrial"),
      popular: false
    },
    {
      name: t("pricing.tiers.pro.name"),
      price: "$99.99",
      period: t("pricing.perMonth"),
      description: t("pricing.tiers.pro.description"),
      features: (t("pricing.tiers.pro.features") as unknown as string[]),
      cta: t("pricing.upgrade"),
      popular: true
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl tracking-tight">FlowAI</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t("nav.features")}
            </a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t("nav.pricing")}
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t("nav.docs")}
            </a>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSelector />
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              {t("common.signIn")}
            </Button>
            <Button onClick={() => navigate("/auth")} className="bg-primary hover:bg-primary/90">
              {t("common.getStarted")}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto text-center">
          <Badge variant="secondary" className="mb-6 px-4 py-1.5">
            <Sparkles className="w-3.5 h-3.5 mr-2" />
            {t("landing.hero.badge")}
          </Badge>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
            {t("landing.hero.title")}
            <br />
            <span className="bg-gradient-to-r from-primary via-pink-500 to-primary bg-clip-text text-transparent">
              {t("landing.hero.titleHighlight")}
            </span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            {t("landing.hero.subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button size="lg" onClick={() => navigate("/auth")} className="h-12 px-8 text-base">
              {t("landing.hero.cta")}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base">
              <Play className="mr-2 w-5 h-5" />
              {t("landing.hero.watchDemo")}
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{t(stat.labelKey)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">{t("nav.features")}</Badge>
            <h2 className="text-4xl font-bold mb-4">{t("landing.features.title")}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("landing.features.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card key={i} className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl ${feature.bg} ${feature.border} border flex items-center justify-center mb-4 ${feature.color}`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{t(feature.titleKey)}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{t(feature.descKey)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Competitive Advantages Section - NEW */}
      <CompetitiveAdvantages 
        showCTA={true} 
        onGetStarted={() => navigate("/auth")} 
      />

      {/* Revenue Calculator - NEW */}
      <section className="py-16 px-6 bg-card/20">
        <div className="max-w-xl mx-auto">
          <RevenueCalculator />
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">{t("nav.pricing")}</Badge>
            <h2 className="text-4xl font-bold mb-4">{t("pricing.title")}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("pricing.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <Card key={i} className={`relative border-border/50 bg-card/50 backdrop-blur-sm ${plan.popular ? 'border-primary shadow-lg shadow-primary/10' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary">{t("pricing.mostPopular")}</Badge>
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="text-muted-foreground text-sm mb-6">{plan.description}</p>

                  <ul className="space-y-3 mb-6">
                    {Array.isArray(plan.features) ? plan.features.map((feature, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        {feature}
                      </li>
                    )) : null}
                  </ul>

                  <Button className="w-full" variant={plan.popular ? "default" : "outline"} onClick={() => navigate("/auth")}>
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Enterprise CTA */}
          <div className="mt-12 text-center max-w-2xl mx-auto p-6 rounded-2xl bg-muted/30 border border-border/50">
            <h3 className="text-lg font-semibold mb-2">{t("pricing.enterprise.title")}</h3>
            <p className="text-muted-foreground mb-4">
              {t("pricing.enterprise.subtitle")}
            </p>
            <Button variant="secondary">{t("pricing.enterprise.cta")}</Button>
          </div>
        </div>
      </section>

      {/* Ownership Banner - NEW */}
      <OwnershipBanner 
        variant="full"
        onExportClick={() => navigate("/settings")}
        onLearnMore={() => navigate("/auth")}
      />

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-card/30 to-background">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">{t("landing.cta.title")}</h2>
          <p className="text-muted-foreground text-lg mb-8">
            {t("landing.cta.subtitle")}
          </p>
          <Button size="lg" onClick={() => navigate("/auth")} className="h-12 px-8 text-base">
            {t("landing.cta.button")}
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold">FlowAI</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="/privacy" className="hover:text-foreground transition-colors">{t("common.privacy")}</a>
            <a href="/terms" className="hover:text-foreground transition-colors">{t("common.terms")}</a>
            <a href="#" className="hover:text-foreground transition-colors">{t("common.contact")}</a>
          </div>
          <p className="text-sm text-muted-foreground">{t("landing.footer.copyright")}</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
