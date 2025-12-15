import { Check, Star, Zap, Building, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { useUser } from "@/hooks/useUser";
import { useTranslation } from "@/i18n/LanguageProvider";
import { toast } from "sonner";

/**
 * Pricing Page
 * 
 * Displays subscription tiers with features and pricing.
 * 
 * Unified Pricing (coherent across all docs):
 * - Free: $0 (20 gen/day, 720p, watermarked)
 * - Creator: $9.99/mo (500 gen/month, 1080p, no watermark)
 * - Pro: $99.99/mo (unlimited, 4K, voice cloning, API)
 * - Enterprise: Custom (white-label, custom models, SSO)
 * 
 * Features:
 * - i18n support (EN/ES via useTranslation)
 * - Popular badge for recommended tier (Pro)
 * - Icon per tier for visual distinction
 * - Responsive grid layout (1-4 columns)
 * 
 * TODO: Integrate with Stripe for actual subscriptions
 */
export default function Pricing() {
    const { user, isAdmin } = useUser();
    const { t } = useTranslation();

    // Pricing tiers matching MONETIZATION.md documentation
    const PLANS = [
        {
            name: t("pricing.tiers.free.name"),
            price: "$0",
            period: t("pricing.perMonth"),
            description: t("pricing.tiers.free.description"),
            features: [
                t("pricing.tiers.free.features.0") || "20 generations per day",
                t("pricing.tiers.free.features.1") || "720p resolution",
                t("pricing.tiers.free.features.2") || "Watermarked exports",
                t("pricing.tiers.free.features.3") || "Community support",
                t("pricing.tiers.free.features.4") || "Basic templates"
            ],
            cta: t("pricing.currentPlan"),
            current: true,
            icon: Zap
        },
        {
            name: t("pricing.tiers.creator.name"),
            price: "$9.99",
            period: t("pricing.perMonth"),
            description: t("pricing.tiers.creator.description"),
            features: [
                t("pricing.tiers.creator.features.0") || "500 generations per month",
                t("pricing.tiers.creator.features.1") || "1080p resolution",
                t("pricing.tiers.creator.features.2") || "No watermarks",
                t("pricing.tiers.creator.features.3") || "Priority queue",
                t("pricing.tiers.creator.features.4") || "Advanced style packs"
            ],
            cta: t("pricing.upgrade"),
            popular: false,
            icon: Star
        },
        {
            name: t("pricing.tiers.pro.name"),
            price: "$99.99",
            period: t("pricing.perMonth"),
            description: t("pricing.tiers.pro.description"),
            features: [
                t("pricing.tiers.pro.features.0") || "Unlimited generations",
                t("pricing.tiers.pro.features.1") || "4K resolution",
                t("pricing.tiers.pro.features.2") || "Voice Cloning (ElevenLabs)",
                t("pricing.tiers.pro.features.3") || "Advanced Analytics Dashboard",
                t("pricing.tiers.pro.features.4") || "Full API Access",
                t("pricing.tiers.pro.features.5") || "Commercial License"
            ],
            cta: t("pricing.upgrade"),
            popular: true,
            icon: Crown
        },
        {
            name: t("pricing.tiers.enterprise.name"),
            price: t("pricing.tiers.enterprise.price"),
            period: "",
            description: t("pricing.tiers.enterprise.description"),
            features: [
                t("pricing.tiers.enterprise.features.0") || "Everything in Pro",
                t("pricing.tiers.enterprise.features.1") || "White-label solution",
                t("pricing.tiers.enterprise.features.2") || "Custom LoRA model training",
                t("pricing.tiers.enterprise.features.3") || "SSO & Audit logs",
                t("pricing.tiers.enterprise.features.4") || "Dedicated account manager"
            ],
            cta: t("pricing.contactSales"),
            popular: false,
            icon: Building
        }
    ];

    const handleSubscribe = (planName: string) => {
        toast.info(`Subscribing to ${planName}...`);
        // Integration with backend would go here
        console.log("Subscribe to:", planName);
    };

    return (
        <AppLayout user={user} isAdmin={isAdmin}>
            <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-background/50">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h1 className="text-4xl font-bold tracking-tight mb-4 bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                        {t("pricing.chooseYourPlan")}
                    </h1>
                    <p className="text-xl text-muted-foreground">
                        {t("pricing.subtitle")}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 max-w-7xl mx-auto">
                    {PLANS.map((plan) => {
                        const Icon = plan.icon;
                        return (
                            <Card
                                key={plan.name}
                                className={`relative flex flex-col border-border/50 transition-all duration-300 hover:shadow-2xl hover:border-primary/50 hover:-translate-y-1 ${plan.popular ? "bg-primary/5 border-primary/50 shadow-xl shadow-primary/10" : "bg-card/50"
                                    }`}
                            >
                                {plan.popular && (
                                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-purple-600 border-none px-4 py-1">
                                        {t("pricing.mostPopular")}
                                    </Badge>
                                )}

                                <CardHeader>
                                    <div className="w-12 h-12 rounded-lg bg-background/50 flex items-center justify-center mb-4 border border-border/50">
                                        <Icon className="w-6 h-6 text-primary" />
                                    </div>
                                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                                    <div className="mt-2 flex items-baseline gap-1">
                                        <span className="text-4xl font-bold">{plan.price}</span>
                                        <span className="text-muted-foreground text-sm">{plan.period}</span>
                                    </div>
                                    <CardDescription className="pt-2">{plan.description}</CardDescription>
                                </CardHeader>

                                <CardContent className="flex-1">
                                    <ul className="space-y-3">
                                        {plan.features.map((feature) => (
                                            <li key={feature} className="flex items-start gap-3 text-sm">
                                                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span className="text-muted-foreground">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>

                                <CardFooter>
                                    <Button
                                        className={`w-full ${plan.popular ? "bg-primary hover:bg-primary/90" : ""}`}
                                        variant={plan.popular ? "default" : "outline"}
                                        onClick={() => handleSubscribe(plan.name)}
                                        disabled={plan.current}
                                    >
                                        {plan.current ? t("pricing.currentPlan") : plan.cta}
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>

                <div className="mt-16 text-center max-w-2xl mx-auto p-6 rounded-2xl bg-muted/30 border border-border/50">
                    <h3 className="text-lg font-semibold mb-2">{t("pricing.enterprise.title")}</h3>
                    <p className="text-muted-foreground mb-4">
                        {t("pricing.enterprise.subtitle")}
                    </p>
                    <Button variant="secondary">{t("pricing.enterprise.cta")}</Button>
                </div>
            </div>
        </AppLayout>
    );
}
