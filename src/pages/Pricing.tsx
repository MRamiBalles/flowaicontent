import { useState, useEffect } from "react";
import { Check, Star, Zap, Building, Crown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PLANS = [
    {
        name: "Free",
        price: "$0",
        period: "/month",
        description: "Perfect for exploring FlowAI",
        features: [
            "50 AI generations/month",
            "Standard generation speed",
            "Public community access",
            "Basic style packs",
            "Watermarked content"
        ],
        cta: "Current Plan",
        current: true,
        icon: Zap
    },
    {
        name: "Creator",
        price: "$9",
        period: "/month",
        description: "For hobbyists and content creators",
        features: [
            "200 AI generations/month",
            "Faster generation speed",
            "No watermarks",
            "Basic scheduling",
            "Priority community support"
        ],
        cta: "Upgrade",
        popular: false,
        icon: Star
    },
    {
        name: "Pro",
        price: "$29",
        period: "/month",
        description: "For professional creators",
        features: [
            "1,000 AI generations/month",
            "Voice Cloning (ElevenLabs)",
            "Advanced Analytics",
            "API Access (Basic)",
            "Commercial License"
        ],
        cta: "Upgrade",
        popular: true,
        icon: Crown
    },
    {
        name: "Business",
        price: "$199",
        period: "/month",
        description: "For agencies and teams",
        features: [
            "Unlimited generations",
            "White-label options",
            "Team seats (up to 5)",
            "Dedicated account manager",
            "SLA & Priority Support"
        ],
        cta: "Contact Sales",
        popular: false,
        icon: Building
    }
];

export default function Pricing() {
    const { user, isAdmin } = useUser();

    const handleSubscribe = (planName: string) => {
        // Integration with backend would go here
        console.log("Subscribe to:", planName);
        // e.g. supabase.functions.invoke('create-checkout-session', { body: { plan: planName } })
    };

    return (
        <AppLayout user={user} isAdmin={isAdmin}>
            <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-background/50">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h1 className="text-4xl font-bold tracking-tight mb-4 bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                        Choose Your Creative Power
                    </h1>
                    <p className="text-xl text-muted-foreground">
                        Unlock the full potential of FlowAI with our flexible subscription plans.
                        Scale as you grow.
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
                                        Most Popular
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
                                        {plan.current ? "Current Plan" : plan.cta}
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>

                <div className="mt-16 text-center max-w-2xl mx-auto p-6 rounded-2xl bg-muted/30 border border-border/50">
                    <h3 className="text-lg font-semibold mb-2">Need a custom enterprise solution?</h3>
                    <p className="text-muted-foreground mb-4">
                        We offer tailored infrastructure and dedicated support for large organizations.
                    </p>
                    <Button variant="secondary">Contact Enterprise Sales</Button>
                </div>
            </div>
        </AppLayout>
    );
}
