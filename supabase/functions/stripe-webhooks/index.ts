import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const signature = req.headers.get("stripe-signature");
        const body = await req.text();

        // Get Stripe configuration
        const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
        const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

        let event: Stripe.Event;

        // Production mode: Verify signature
        if (webhookSecret && stripeSecretKey && signature) {
            const stripe = new Stripe(stripeSecretKey, {
                apiVersion: '2023-10-16',
                httpClient: Stripe.createFetchHttpClient(),
            });

            try {
                // Verify the webhook signature for security
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
            // Development mode: Parse without verification (ONLY for local testing)
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
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        console.log(`Received verified event: ${event.type}`);

        // Handle different event types
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.metadata?.user_id;
                const subscriptionId = session.subscription as string;
                const customerId = session.customer as string;

                if (userId && subscriptionId) {
                    // Update user subscription in database
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
                            onConflict: 'user_id'
                        });

                    if (subError) {
                        console.error('Failed to update subscription:', subError);
                    } else {
                        console.log(`User ${userId} subscribed successfully: ${subscriptionId}`);
                    }
                }
                break;
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as Stripe.Invoice;
                const subscriptionId = invoice.subscription as string;

                if (subscriptionId) {
                    await supabaseClient
                        .from('subscriptions')
                        .update({
                            status: 'active',
                            updated_at: new Date().toISOString()
                        })
                        .eq('stripe_subscription_id', subscriptionId);

                    console.log(`Payment succeeded for subscription: ${subscriptionId}`);
                }
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice;
                const subscriptionId = invoice.subscription as string;

                if (subscriptionId) {
                    // Mark subscription as past_due
                    await supabaseClient
                        .from('subscriptions')
                        .update({
                            status: 'past_due',
                            updated_at: new Date().toISOString()
                        })
                        .eq('stripe_subscription_id', subscriptionId);

                    console.log(`Payment failed for subscription: ${subscriptionId}`);
                }
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;

                await supabaseClient
                    .from('subscriptions')
                    .update({
                        status: subscription.status,
                        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .eq('stripe_subscription_id', subscription.id);

                console.log(`Subscription updated: ${subscription.id} -> ${subscription.status}`);
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;

                await supabaseClient
                    .from('subscriptions')
                    .update({
                        status: 'canceled',
                        updated_at: new Date().toISOString()
                    })
                    .eq('stripe_subscription_id', subscription.id);

                console.log(`Subscription canceled: ${subscription.id}`);
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
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
