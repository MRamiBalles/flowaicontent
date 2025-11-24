"""
Subscription API Endpoints
FastAPI routes for subscription management
"""

from fastapi import APIRouter, Depends, Request, Header, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.services.stripe_service import StripeService, handle_webhook_event
from app.middleware.rate_limit import get_usage_stats
from app.models.subscription import UserTier
from app.auth import get_current_user

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])

class CheckoutRequest(BaseModel):
    tier: UserTier
    success_url: str
    cancel_url: str

class CheckoutResponse(BaseModel):
    session_id: str
    url: str

@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout_session(
    request: CheckoutRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create Stripe checkout session for subscription"""
    user_id = current_user["id"]
    
    result = await StripeService.create_checkout_session(
        user_id=user_id,
        tier=request.tier,
        success_url=request.success_url,
        cancel_url=request.cancel_url
    )
    
    return result

@router.post("/cancel")
async def cancel_subscription(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Cancel current subscription (at period end)"""
    user_id = current_user["id"]
    
    # Get current subscription
    sub = await db.subscriptions.find_one({"user_id": user_id, "status": "active"})
    if not sub:
        raise HTTPException(404, "No active subscription found")
    
    result = await StripeService.cancel_subscription(sub["stripe_subscription_id"])
    
    # Update DB
    await db.subscriptions.update(
        {"id": sub["id"]},
        {"cancel_at_period_end": True}
    )
    
    return {
        "message": "Subscription will be canceled at period end",
        **result
    }

@router.post("/reactivate")
async def reactivate_subscription(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Reactivate a canceled subscription"""
    user_id = current_user["id"]
    
    # Get subscription
    sub = await db.subscriptions.find_one(
        {"user_id": user_id, "cancel_at_period_end": True}
    )
    if not sub:
        raise HTTPException(404, "No canceled subscription found")
    
    result = await StripeService.reactivate_subscription(sub["stripe_subscription_id"])
    
    # Update DB
    await db.subscriptions.update(
        {"id": sub["id"]},
        {"cancel_at_period_end": False}
    )
    
    return {"message": "Subscription reactivated", **result}

@router.get("/portal")
async def get_customer_portal(
    current_user: dict = Depends(get_current_user),
    return_url: str = "https://flowai.com/settings",
    db = Depends(get_database)
):
    """Get Stripe customer portal URL for managing subscription"""
    user_id = current_user["id"]
    
    # Get customer ID
    sub = await db.subscriptions.find_one({"user_id": user_id})
    if not sub or not sub.get("stripe_customer_id"):
        raise HTTPException(404, "No subscription found")
    
    url = await StripeService.get_customer_portal_url(
        customer_id=sub["stripe_customer_id"],
        return_url=return_url
    )
    
    return {"url": url}

@router.get("/usage")
async def get_usage(current_user: dict = Depends(get_current_user)):
    """Get current usage statistics"""
    user_id = current_user["id"]
    tier = UserTier(current_user.get("tier", "free"))
    
    stats = await get_usage_stats(user_id, tier)
    
    return {
        "tier": tier.value,
        "usage": stats
    }

@router.get("/current")
async def get_current_subscription(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get current subscription details"""
    user_id = current_user["id"]
    
    sub = await db.subscriptions.find_one({"user_id": user_id, "status": "active"})
    if not sub:
        return {
            "tier": "free",
            "message": "No active subscription"
        }
    
    return {
        "id": sub["id"],
        "tier": sub["tier"],
        "status": sub["status"],
        "current_period_end": sub["current_period_end"],
        "cancel_at_period_end": sub.get("cancel_at_period_end", False)
    }

@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="stripe-signature"),
    db = Depends(get_database)
):
    """Handle Stripe webhook events"""
    payload = await request.body()
    
    # Verify webhook signature
    event = StripeService.verify_webhook(payload, stripe_signature)
    
    # Handle event
    result = await handle_webhook_event(event, db)
    
    return result


def get_database():
    """Dependency to get database connection"""
    from app.services.supabase_service import get_supabase_client
    return get_supabase_client()
