import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, Zap, Star, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { supabase } from '@/integrations/supabase/client';

interface PricingTier {
    id: string;
    name: string;
    price: number;
    interval: string;
    features: string[];
    popular?: boolean;
    icon: any;
    color: string;
}

const tiers: PricingTier[] = [
    {
        id: 'free',
        name: 'FREE',
        price: 0,
        interval: 'forever',
        icon: Sparkles,
        color: 'zinc',
        features: [
            '10 generations per day',
            '720p resolution',
            '5 second videos',
            'Watermark included',
            'Community support'
        ]
    },
    {
        id: 'pro',
        name: 'PRO',
        price: 9.99,
        interval: 'month',
        icon: Zap,
        color: 'purple',
        popular: true,
        features: [
            '100 generations per day',
            '1080p resolution',
            '10 second videos',
            'No watermark',
            'Priority queue',
            'Advanced styles'
        ]
    },
    {
        id: 'studio',
        name: 'STUDIO',
        price: 49.99,
        interval: 'month',
        icon: Star,
        color: 'yellow',
        features: [
            'Unlimited generations',
            '1080p resolution',
            '30 second videos',
            'API access',
            'Custom LoRAs',
            'Priority support',
            'Commercial license'
        ]
    },
    {
        id: 'business',
        name: 'BUSINESS',
        price: 199,
        interval: 'month',
        icon: Sparkles,
        color: 'blue',
        features: [
            'Everything in Studio',
            '4K resolution',
            '60 second videos',
            'Team management',
            'White label option',
            'Dedicated support',
            'Custom SLA'
        ]
    }
];

export const PricingPage = () => {
    const [loading, setLoading] = useState<string | null>(null);

    const handleSubscribe = async (tierId: string) => {
        if (tierId === 'free') {
            toast.info("You're already on the free tier!");
            return;
        }

        setLoading(tierId);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (!token) {
                toast.error('Please login to subscribe');
                setLoading(null);
                return;
            }

            // Call backend to create checkout session
            const response = await fetch('http://localhost:8000/v1/subscriptions/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    tier: tierId,
                    success_url: `${window.location.origin}/dashboard?checkout=success`,
                    cancel_url: `${window.location.origin}/pricing?checkout=canceled`
                })
            });

            if (!response.ok) throw new Error('Failed to create checkout session');

            const data = await response.json();

            // Redirect to Stripe Checkout
            window.location.href = data.url;
        } catch (error) {
            toast.error('Failed to start checkout. Please try again.');
            setLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black py-20 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
                        Choose Your <span className="bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">Creative Power</span>
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                        Scale your AI video generation with flexible plans designed for creators and businesses
                    </p>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {tiers.map((tier) => {
                        const Icon = tier.icon;
                        const isPopular = tier.popular;

                        return (
                            <Card
                                key={tier.id}
                                className={`relative p-6 bg-gradient-to-b from-zinc-900/90 to-black/90 border-2 transition-all duration-300 hover:scale-[1.02] ${isPopular
                                    ? 'border-purple-500/50 shadow-lg shadow-purple-500/20'
                                    : 'border-white/10 hover:border-white/20'
                                    }`}
                            >
                                {/* Popular Badge */}
                                {isPopular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                                        MOST POPULAR
                                    </div>
                                )}

                                {/* Header */}
                                <div className="text-center mb-6">
                                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-${tier.color}-500/20 mb-4`}>
                                        <Icon className={`w-6 h-6 text-${tier.color}-400`} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
                                    <div className="flex items-baseline justify-center gap-1">
                                        <span className="text-4xl font-bold text-white">${tier.price}</span>
                                        <span className="text-zinc-500">/{tier.interval}</span>
                                    </div>
                                </div>

                                {/* Features */}
                                <ul className="space-y-3 mb-8">
                                    {tier.features.map((feature, index) => (
                                        <li key={index} className="flex items-start gap-2 text-sm">
                                            <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                                            <span className="text-zinc-300">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA Button */}
                                <Button
                                    onClick={() => handleSubscribe(tier.id)}
                                    disabled={loading === tier.id}
                                    className={`w-full ${isPopular
                                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                                        : 'bg-white/10 hover:bg-white/20'
                                        } text-white font-bold`}
                                >
                                    {loading === tier.id ? 'Processing...' : tier.id === 'free' ? 'Current Plan' : 'Get Started'}
                                </Button>
                            </Card>
                        );
                    })}
                </div>

                {/* FAQ Section */}
                <div className="mt-20 max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-white text-center mb-8">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                        {[
                            {
                                q: 'Can I cancel anytime?',
                                a: 'Yes! Cancel anytime from your account settings. You\'ll keep access until the end of your billing period.'
                            },
                            {
                                q: 'What payment methods do you accept?',
                                a: 'We accept all major credit cards (Visa, Mastercard, Amex) via Stripe secure checkout.'
                            },
                            {
                                q: 'Can I upgrade or downgrade my plan?',
                                a: 'Absolutely! Upgrade instantly or downgrade at the end of your billing cycle.'
                            },
                            {
                                q: 'Do you offer refunds?',
                                a: 'We offer a 7-day money-back guarantee if you\'re not satisfied with our service.'
                            }
                        ].map((faq, index) => (
                            <details key={index} className="group bg-white/5 rounded-lg p-4 cursor-pointer">
                                <summary className="font-bold text-white flex justify-between items-center">
                                    {faq.q}
                                    <span className="text-zinc-500 group-open:rotate-180 transition-transform">▼</span>
                                </summary>
                                <p className="mt-2 text-zinc-400 text-sm">{faq.a}</p>
                            </details>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
