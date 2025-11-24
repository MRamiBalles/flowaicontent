"""
Stripe Integration for FlowAI Subscriptions
Handles webhook events, subscription management, and payment processing
"""

import stripe
import os
from fastapi import HTTPException, Header
from typing import Optional
from datetime import datetime
from .subscription import UserTier, SubscriptionStatus, get_tier_from_price

# Initialize Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

class StripeService:
    """Service for Stripe operations"""
    
    @staticmethod
    async def create_checkout_session(
        user_id: str,
        tier: UserTier,
        success_url: str,
        cancel_url: str
    ) -> dict:
        """Create Stripe checkout session for subscription"""
        
        # Get price based on tier
        price_mapping = {
            UserTier.PRO: os.getenv("STRIPE_PRICE_PRO"),
            UserTier.STUDIO: os.getenv("STRIPE_PRICE_STUDIO"),
            UserTier.BUSINESS: os.getenv("STRIPE_PRICE_BUSINESS")
        }
        
        if tier == UserTier.FREE:
            raise HTTPException(400, "Cannot create checkout for free tier")
        
        price_id = price_mapping.get(tier)
        if not price_id:
            raise HTTPException(400, f"Invalid tier: {tier}")
        
        try:
            session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                line_items=[{
                    "price": price_id,
                    "quantity": 1
                }],
                mode="subscription",
                success_url=success_url,
                cancel_url=cancel_url,
                client_reference_id=user_id,
                subscription_data={
                    "metadata": {
                        "user_id": user_id,
                        "tier": tier.value
                    }
                }
            )
            
            return {
                "session_id": session.id,
                "url": session.url
            }
        except stripe.error.StripeError as e:
            raise HTTPException(500, f"Stripe error: {str(e)}")
    
    @staticmethod
    async def cancel_subscription(subscription_id: str) -> dict:
        """Cancel a subscription at period end"""
        try:
            subscription = stripe.Subscription.modify(
                subscription_id,
                cancel_at_period_end=True
            )
            return {
                "status": "canceled",
                "cancel_at": subscription.cancel_at
            }
        except stripe.error.StripeError as e:
            raise HTTPException(500, f"Stripe error: {str(e)}")
    
    @staticmethod
    async def reactivate_subscription(subscription_id: str) -> dict:
        """Reactivate a canceled subscription"""
        try:
            subscription = stripe.Subscription.modify(
                subscription_id,
                cancel_at_period_end=False
            )
            return {"status": "active"}
        except stripe.error.StripeError as e:
            raise HTTPException(500, f"Stripe error: {str(e)}")
    
    @staticmethod
    async def get_customer_portal_url(
        customer_id: str,
        return_url: str
    ) -> str:
        """Create customer portal session for managing subscription"""
        try:
            session = stripe.billing_portal.Session.create(
                customer=customer_id,
                return_url=return_url
            )
            return session.url
        except stripe.error.StripeError as e:
            raise HTTPException(500, f"Stripe error: {str(e)}")
    
    @staticmethod
    def verify_webhook(payload: bytes, sig_header: str) -> dict:
        """Verify Stripe webhook signature"""
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, STRIPE_WEBHOOK_SECRET
            )
            return event
        except ValueError:
            raise HTTPException(400, "Invalid payload")
        except stripe.error.SignatureVerificationError:
            raise HTTPException(400, "Invalid signature")


async def handle_webhook_event(event: dict, db):
    """Handle Stripe webhook events"""
    event_type = event["type"]
    data = event["data"]["object"]
    
    if event_type == "checkout.session.completed":
        # New subscription created
        subscription_id = data["subscription"]
        customer_id = data["customer"]
        user_id = data["client_reference_id"]
        
        # Get subscription details from Stripe
        subscription = stripe.Subscription.retrieve(subscription_id)
        tier = subscription.metadata.get("tier", "pro")
        
        # Save to database
        await db.subscriptions.create({
            "user_id": user_id,
            "tier": tier,
            "status": "active",
            "stripe_subscription_id": subscription_id,
            "stripe_customer_id": customer_id,
            "current_period_start": datetime.fromtimestamp(subscription.current_period_start),
            "current_period_end": datetime.fromtimestamp(subscription.current_period_end)
        })
        
        # Update user tier
        await db.users.update(user_id, {"tier": tier})
    
    elif event_type == "customer.subscription.updated":
        # Subscription changed (upgrade/downgrade)
        subscription_id = data["id"]
        status = data["status"]
        cancel_at_period_end = data["cancel_at_period_end"]
        
        await db.subscriptions.update(
            {"stripe_subscription_id": subscription_id},
            {
                "status": status,
                "cancel_at_period_end": cancel_at_period_end,
                "current_period_end": datetime.fromtimestamp(data["current_period_end"])
            }
        )
    
    elif event_type == "customer.subscription.deleted":
        # Subscription canceled/expired
        subscription_id = data["id"]
        
        # Downgrade user to free tier
        sub = await db.subscriptions.find_one({"stripe_subscription_id": subscription_id})
        if sub:
            await db.users.update(sub["user_id"], {"tier": "free"})
            await db.subscriptions.update(
                {"stripe_subscription_id": subscription_id},
                {"status": "canceled"}
            )
    
    elif event_type == "invoice.payment_failed":
        # Payment failed
        subscription_id = data["subscription"]
"""
Stripe Integration for FlowAI Subscriptions
Handles webhook events, subscription management, and payment processing
"""

import stripe
import os
from fastapi import HTTPException, Header
from typing import Optional
from datetime import datetime
from .subscription import UserTier, SubscriptionStatus, get_tier_from_price

# Initialize Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

class StripeService:
    """Service for Stripe operations"""
    
    @staticmethod
    async def create_checkout_session(
        user_id: str,
        tier: UserTier,
        success_url: str,
        cancel_url: str
    ) -> dict:
        """Create Stripe checkout session for subscription"""
        
        # Get price based on tier
        price_mapping = {
            UserTier.PRO: os.getenv("STRIPE_PRICE_PRO"),
            UserTier.STUDIO: os.getenv("STRIPE_PRICE_STUDIO"),
            UserTier.BUSINESS: os.getenv("STRIPE_PRICE_BUSINESS")
        }
        
        if tier == UserTier.FREE:
            raise HTTPException(400, "Cannot create checkout for free tier")
        
        price_id = price_mapping.get(tier)
        if not price_id:
            raise HTTPException(400, f"Invalid tier: {tier}")
        
        try:
            session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                line_items=[{
                    "price": price_id,
                    "quantity": 1
                }],
                mode="subscription",
                success_url=success_url,
                cancel_url=cancel_url,
                client_reference_id=user_id,
                subscription_data={
                    "metadata": {
                        "user_id": user_id,
                        "tier": tier.value
                    }
                }
            )
            
            return {
                "session_id": session.id,
                "url": session.url
            }
        except stripe.error.StripeError as e:
            raise HTTPException(500, f"Stripe error: {str(e)}")
    
    @staticmethod
    async def cancel_subscription(subscription_id: str) -> dict:
        """Cancel a subscription at period end"""
        try:
            subscription = stripe.Subscription.modify(
                subscription_id,
                cancel_at_period_end=True
            )
            return {
                "status": "canceled",
                "cancel_at": subscription.cancel_at
            }
        except stripe.error.StripeError as e:
            raise HTTPException(500, f"Stripe error: {str(e)}")
    
    @staticmethod
    async def reactivate_subscription(subscription_id: str) -> dict:
        """Reactivate a canceled subscription"""
        try:
            subscription = stripe.Subscription.modify(
                subscription_id,
                cancel_at_period_end=False
            )
            return {"status": "active"}
        except stripe.error.StripeError as e:
            raise HTTPException(500, f"Stripe error: {str(e)}")
    
    @staticmethod
    async def get_customer_portal_url(
        customer_id: str,
        return_url: str
    ) -> str:
        """Create customer portal session for managing subscription"""
        try:
            session = stripe.billing_portal.Session.create(
                customer=customer_id,
                return_url=return_url
            )
            return session.url
        except stripe.error.StripeError as e:
            raise HTTPException(500, f"Stripe error: {str(e)}")
    
    @staticmethod
    def verify_webhook(payload: bytes, sig_header: str) -> dict:
        """Verify Stripe webhook signature"""
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, STRIPE_WEBHOOK_SECRET
            )
            return event
        except ValueError:
            raise HTTPException(400, "Invalid payload")
        except stripe.error.SignatureVerificationError:
            raise HTTPException(400, "Invalid signature")


async def handle_webhook_event(event: dict, db):
    """Handle Stripe webhook events"""
    event_type = event["type"]
    data = event["data"]["object"]
    
    if event_type == "checkout.session.completed":
        # New subscription created
        subscription_id = data["subscription"]
        customer_id = data["customer"]
        user_id = data["client_reference_id"]
        
        # Get subscription details from Stripe
        subscription = stripe.Subscription.retrieve(subscription_id)
        tier = subscription.metadata.get("tier", "pro")
        
        # Save to database
        await db.subscriptions.create({
            "user_id": user_id,
            "tier": tier,
            "status": "active",
            "stripe_subscription_id": subscription_id,
            "stripe_customer_id": customer_id,
            "current_period_start": datetime.fromtimestamp(subscription.current_period_start),
            "current_period_end": datetime.fromtimestamp(subscription.current_period_end)
        })
        
        # Update user tier
        await db.users.update(user_id, {"tier": tier})
    
    elif event_type == "customer.subscription.updated":
        # Subscription changed (upgrade/downgrade)
        subscription_id = data["id"]
        status = data["status"]
        cancel_at_period_end = data["cancel_at_period_end"]
        
        await db.subscriptions.update(
            {"stripe_subscription_id": subscription_id},
            {
                "status": status,
                "cancel_at_period_end": cancel_at_period_end,
                "current_period_end": datetime.fromtimestamp(data["current_period_end"])
            }
        )
    
    elif event_type == "customer.subscription.deleted":
        # Subscription canceled/expired
        subscription_id = data["id"]
        
        # Downgrade user to free tier
        sub = await db.subscriptions.find_one({"stripe_subscription_id": subscription_id})
        if sub:
            await db.users.update(sub["user_id"], {"tier": "free"})
            await db.subscriptions.update(
                {"stripe_subscription_id": subscription_id},
                {"status": "canceled"}
            )
    
    elif event_type == "invoice.payment_failed":
        # Payment failed
        subscription_id = data["subscription"]
        
        await db.subscriptions.update(
            {"stripe_subscription_id": subscription_id},
            {"status": "past_due"}
        )
        
        # Send email notification to user
        from app.services.email_service import send_email
        sub = await db.subscriptions.find_one({"stripe_subscription_id": subscription_id})
        if sub:
            user = await db.users.find_one({"id": sub["user_id"]})
            if user:
                send_email(
                    to_email=user["email"],
                    subject="Payment Failed - Action Required",
                    template="failed_payment",
                    context={
                        "user_name": user.get("username", "User"),
                        "plan_name": sub["tier"].upper(),
                        "update_payment_url": "https://flowai.com/settings/billing"
                    }
                )
    
    return {"status": "handled"}
