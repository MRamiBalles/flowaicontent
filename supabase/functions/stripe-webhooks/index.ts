/**
 * Edge Function: stripe-webhooks  
 * 
 * Handles Stripe webhook events for payment processing.
 * 
 * Supported Events:
 * - checkout.session.completed: User completes subscription checkout
 * - invoice.payment_succeeded: Recurring payment successful
 * - invoice.payment_failed: Payment failed (mark as past_due)
 * - customer.subscription.updated: Subscription changed (upgrade/downgrade)
 * - customer.subscription.deleted: User canceled subscription
 * 
 * Security:
 * - PRODUCTION: Verifies webhook signature using STRIPE_WEBHOOK_SECRET
 * - DEV MODE: Skips verification (ONLY for local testing)
 * - Uses Service Role key for database writes
 * 
 * Flow:
 * 1. Verify Stripe signature
 * 2. Parse event type
 * 3. Update subscriptions table accordingly
 * 4. Return 200 OK to confirm receipt
 * 
 * Critical: Always return 200 even on DB errors to prevent
 * Stripe from retrying indefinitely.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createErrorResponse } from "./_shared/error-sanitizer.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// Validation schemas for webhook data
const checkoutSessionSchema = z.object({
    metadata: z.record(z.string()).optional(),
    subscription: z.string().optional(),
    customer: z.string().optional(),
});

const invoiceSchema = z.object({
    subscription: z.string().optional(),
});

const subscriptionSchema = z.object({
    id: z.string(),
    status: z.string(),
    current_period_start: z.number(),
    current_period_end: z.number(),
});

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const signature = req.headers.get("stripe-signature");
        const body = await req.text(); // Raw body needed for signature verification

        // Environment variables
        const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
        const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

        let event: Stripe.Event;

        // PRODUCTION: Verify webhook came from Stripe
        // This prevents malicious actors from spoofing webhook events
        if (webhookSecret && stripeSecretKey && signature) {
            const stripe = new Stripe(stripeSecretKey, {
                apiVersion: '2023-10-16',
                httpClient: Stripe.createFetchHttpClient(),
            });

            try {
                // Verify signature using webhook secret
                // Throws error if signature invalid or timestamp too old
                event = await stripe.webhooks.constructEventAsync(
                    body,
                    signature,
                    webhookSecret
                );
                console.log('Webhook signature verified successfully');
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                console.error('Webhook signature verification failed:', errorMessage);
                return new Response(
                    JSON.stringify({ error: `Webhook signature verification failed: ${errorMessage}` }),
                    {
                        status: 401,
                        headers: { ...corsHeaders, "Content-Type": "application/json" }
                    }
                );
            }
        } else {
            // DEVELOPMENT MODE: Parse without verification
            // WARNING: Never use in production - allows anyone to send fake events
            console.warn('⚠️ DEVELOPMENT MODE: Webhook signature verification skipped');
            console.warn('Set STRIPE_WEBHOOK_SECRET for production security');

            if (!signature) {
                return new Response(
                    JSON.stringify({ error: "Missing stripe-signature header" }),
                    {
                        status: 400,
                        headers: { ...corsHeaders, "Content-Type": "application/json" }
                    }
                );
            }

            event = JSON.parse(body) as Stripe.Event;
        }

        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "" // Service role for webhook writes
        );

        console.log(`Received verified event: ${event.type}`);

        // Handle different webhook events
        switch (event.type) {
            // User completed checkout and subscribed
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                
                // Validate session data
                const sessionValidation = checkoutSessionSchema.safeParse(session);
                if (!sessionValidation.success) {
                    console.error('Invalid checkout session data:', sessionValidation.error);
                    break;
                }

                const userId = session.metadata?.user_id; // Set during checkout creation
                const subscriptionId = session.subscription as string;
                const customerId = session.customer as string;

                // Validate required fields
                if (!userId || !subscriptionId) {
                    console.error('Missing required fields: userId or subscriptionId');
                    break;
                }

                // Create or update subscription record
                // upsert ensures idempotency if webhook fires multiple times
                const { error: subError } = await supabaseClient
                    .from('subscriptions')
                    .upsert({
                        user_id: userId,
                        stripe_subscription_id: subscriptionId,
                        stripe_customer_id: customerId,
                        status: 'active',
                        current_period_start: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }, {
                        onConflict: 'user_id' // Update if subscription exists
                    });

                if (subError) {
                    console.error('Failed to update subscription:', subError);
                } else {
                    console.log(`User ${userId} subscribed successfully: ${subscriptionId}`);
                }
                break;
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as Stripe.Invoice;
                
                // Validate invoice data
                const invoiceValidation = invoiceSchema.safeParse(invoice);
                if (!invoiceValidation.success) {
                    console.error('Invalid invoice data:', invoiceValidation.error);
                    break;
                }

                const subscriptionId = invoice.subscription as string;

                if (subscriptionId) {
                    const { error } = await supabaseClient
                        .from('subscriptions')
                        .update({
                            status: 'active',
                            updated_at: new Date().toISOString()
                        })
                        .eq('stripe_subscription_id', subscriptionId);

                    if (error) {
                        console.error('Failed to update subscription status:', error);
                    } else {
                        console.log(`Payment succeeded for subscription: ${subscriptionId}`);
                    }
                }
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice;
                
                // Validate invoice data
                const invoiceValidation = invoiceSchema.safeParse(invoice);
                if (!invoiceValidation.success) {
                    console.error('Invalid invoice data:', invoiceValidation.error);
                    break;
                }

                const subscriptionId = invoice.subscription as string;

                if (subscriptionId) {
                    // Mark subscription as past_due
                    const { error } = await supabaseClient
                        .from('subscriptions')
                        .update({
                            status: 'past_due',
                            updated_at: new Date().toISOString()
                        })
                        .eq('stripe_subscription_id', subscriptionId);

                    if (error) {
                        console.error('Failed to update subscription status:', error);
                    } else {
                        console.log(`Payment failed for subscription: ${subscriptionId}`);
                    }
                }
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;

                // Validate subscription data
                const subscriptionValidation = subscriptionSchema.safeParse(subscription);
                if (!subscriptionValidation.success) {
                    console.error('Invalid subscription data:', subscriptionValidation.error);
                    break;
                }

                const { error } = await supabaseClient
                    .from('subscriptions')
                    .update({
                        status: subscription.status,
                        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .eq('stripe_subscription_id', subscription.id);

                if (error) {
                    console.error('Failed to update subscription:', error);
                } else {
                    console.log(`Subscription updated: ${subscription.id} -> ${subscription.status}`);
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;

                // Validate subscription data
                const subscriptionValidation = subscriptionSchema.safeParse(subscription);
                if (!subscriptionValidation.success) {
                    console.error('Invalid subscription data:', subscriptionValidation.error);
                    break;
                }

                const { error } = await supabaseClient
                    .from('subscriptions')
                    .update({
                        status: 'canceled',
                        updated_at: new Date().toISOString()
                    })
                    .eq('stripe_subscription_id', subscription.id);

                if (error) {
                    console.error('Failed to update subscription:', error);
                } else {
                    console.log(`Subscription canceled: ${subscription.id}`);
                }
                break;
            }

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error('Webhook error:', error);
        return createErrorResponse(error, corsHeaders, {
            functionName: 'stripe-webhooks',
            action: 'process_event'
        }, 400);
    }
});
