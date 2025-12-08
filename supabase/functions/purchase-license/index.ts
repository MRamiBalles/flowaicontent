// Purchase License Edge Function
// Handles license purchases with Stripe payment

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PurchaseLicenseRequest {
    license_id: string;
    company_name?: string;
    payment_method_id?: string; // For direct charge
    return_url?: string; // For checkout session
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Authorization required'
            }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        // Verify user
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Invalid token'
            }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const body: PurchaseLicenseRequest = await req.json();

        if (!body.license_id) {
            return new Response(JSON.stringify({
                success: false,
                error: 'license_id is required'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Get the license
        const { data: license, error: licenseError } = await supabase
            .from('content_licenses')
            .select('*, creator:creator_id(email)')
            .eq('id', body.license_id)
            .eq('is_active', true)
            .single();

        if (licenseError || !license) {
            return new Response(JSON.stringify({
                success: false,
                error: 'License not found or not available'
            }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Prevent self-purchase
        if (license.creator_id === user.id) {
            return new Response(JSON.stringify({
                success: false,
                error: 'You cannot purchase your own license'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Check for existing purchase (except for non-exclusive licenses)
        if (license.license_type === 'exclusive') {
            const { data: existingPurchase } = await supabase
                .from('license_purchases')
                .select('id')
                .eq('license_id', body.license_id)
                .eq('status', 'active')
                .single();

            if (existingPurchase) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'This exclusive license has already been purchased'
                }), {
                    status: 409,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }
        }

        // Check if buyer already has this license
        const { data: buyerExisting } = await supabase
            .from('license_purchases')
            .select('id')
            .eq('license_id', body.license_id)
            .eq('buyer_id', user.id)
            .eq('status', 'active')
            .single();

        if (buyerExisting) {
            return new Response(JSON.stringify({
                success: false,
                error: 'You already have an active license for this content'
            }), {
                status: 409,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Calculate revenue split (70% creator, 30% platform)
        const creatorShare = Math.floor(license.price_cents * 0.70);
        const platformFee = license.price_cents - creatorShare;

        // Calculate expiration if duration_days is set
        const expiresAt = license.duration_days
            ? new Date(Date.now() + license.duration_days * 24 * 60 * 60 * 1000).toISOString()
            : null;

        // If price is 0, skip payment processing
        if (license.price_cents === 0) {
            // Create license purchase directly
            const { data: purchase, error: purchaseError } = await supabase
                .from('license_purchases')
                .insert({
                    license_id: body.license_id,
                    buyer_id: user.id,
                    buyer_company_name: body.company_name,
                    amount_paid_cents: 0,
                    creator_earnings_cents: 0,
                    platform_fee_cents: 0,
                    usage_limit: license.max_impressions,
                    impressions_limit: license.max_impressions,
                    expires_at: expiresAt,
                    status: 'active',
                })
                .select()
                .single();

            if (purchaseError) {
                throw new Error(purchaseError.message);
            }

            console.log(`Free license granted: ${purchase.license_key}`);

            return new Response(JSON.stringify({
                success: true,
                purchase_id: purchase.id,
                license_key: purchase.license_key,
                message: 'License activated successfully',
            }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Process payment with Stripe
        if (!STRIPE_SECRET_KEY) {
            // Development mode: create purchase without payment
            console.warn('STRIPE_SECRET_KEY not configured - creating purchase without payment');

            const { data: purchase, error: purchaseError } = await supabase
                .from('license_purchases')
                .insert({
                    license_id: body.license_id,
                    buyer_id: user.id,
                    buyer_company_name: body.company_name,
                    amount_paid_cents: license.price_cents,
                    creator_earnings_cents: creatorShare,
                    platform_fee_cents: platformFee,
                    usage_limit: license.max_impressions,
                    impressions_limit: license.max_impressions,
                    expires_at: expiresAt,
                    status: 'active',
                })
                .select()
                .single();

            if (purchaseError) {
                throw new Error(purchaseError.message);
            }

            return new Response(JSON.stringify({
                success: true,
                purchase_id: purchase.id,
                license_key: purchase.license_key,
                message: 'License activated (dev mode - no payment)',
                dev_mode: true,
            }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // Initialize Stripe
        const stripe = new Stripe(STRIPE_SECRET_KEY, {
            apiVersion: '2023-10-16',
        });

        // Get or create Stripe customer
        const { data: profile } = await supabase
            .from('profiles')
            .select('stripe_customer_id')
            .eq('id', user.id)
            .single();

        let customerId = profile?.stripe_customer_id;

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: {
                    user_id: user.id,
                },
            });
            customerId = customer.id;

            // Save customer ID
            await supabase
                .from('profiles')
                .update({ stripe_customer_id: customerId })
                .eq('id', user.id);
        }

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: license.currency.toLowerCase(),
                        product_data: {
                            name: `License: ${license.content_title}`,
                            description: `${license.license_type} license for ${license.content_type}`,
                            metadata: {
                                license_id: license.id,
                                content_type: license.content_type,
                            },
                        },
                        unit_amount: license.price_cents,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: body.return_url
                ? `${body.return_url}?session_id={CHECKOUT_SESSION_ID}&license=${license.id}`
                : `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.vercel.app')}/marketplace?success=true`,
            cancel_url: body.return_url
                ? `${body.return_url}?canceled=true`
                : `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.vercel.app')}/marketplace?canceled=true`,
            metadata: {
                license_id: license.id,
                buyer_id: user.id,
                creator_id: license.creator_id,
                creator_share: creatorShare.toString(),
                platform_fee: platformFee.toString(),
                company_name: body.company_name || '',
                expires_at: expiresAt || '',
            },
        });

        console.log(`Checkout session created: ${session.id} for license ${license.id}`);

        return new Response(JSON.stringify({
            success: true,
            checkout_url: session.url,
            session_id: session.id,
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Purchase license error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';

        return new Response(JSON.stringify({
            success: false,
            error: message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
