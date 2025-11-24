"""
FlowAI Backend - Subscription System
Implements premium tier management with Stripe integration
"""

from enum import Enum
from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel
from sqlalchemy import Column, String, Boolean, TIMESTAMP, Integer
from sqlalchemy.dialects.postgresql import UUID
import uuid

class UserTier(str, Enum):
    FREE = "free"
    PRO = "pro"
    STUDIO = "studio"
    BUSINESS = "business"

class TierLimits(BaseModel):
    """Rate limits per tier"""
    daily_generations: int
    concurrent_jobs: int
    max_video_duration: int  # seconds
    max_resolution: str
    api_access: bool
    custom_loras: bool
    priority_queue: bool
    watermark: bool

# Tier configurations
TIER_CONFIGS = {
    UserTier.FREE: TierLimits(
        daily_generations=10,
        concurrent_jobs=1,
        max_video_duration=5,
        max_resolution="720p",
        api_access=False,
        custom_loras=False,
        priority_queue=False,
        watermark=True
    ),
    UserTier.PRO: TierLimits(
        daily_generations=100,
        concurrent_jobs=3,
        max_video_duration=10,
        max_resolution="1080p",
        api_access=False,
        custom_loras=False,
        priority_queue=True,
        watermark=False
    ),
    UserTier.STUDIO: TierLimits(
        daily_generations=999999,  # Unlimited
        concurrent_jobs=10,
        max_video_duration=30,
        max_resolution="1080p",
        api_access=True,
        custom_loras=True,
        priority_queue=True,
        watermark=False
    ),
    UserTier.BUSINESS: TierLimits(
        daily_generations=999999,  # Unlimited
        concurrent_jobs=20,
        max_video_duration=60,
        max_resolution="4k",
        api_access=True,
        custom_loras=True,
        priority_queue=True,
        watermark=False
    )
}

# Pricing (in cents)
TIER_PRICING = {
    UserTier.FREE: 0,
    UserTier.PRO: 999,      # $9.99/month
    UserTier.STUDIO: 4999,  # $49.99/month
    UserTier.BUSINESS: 19900  # $199/month
}

class SubscriptionStatus(str, Enum):
    ACTIVE = "active"
    CANCELED = "canceled"
    PAST_DUE = "past_due"
    TRIALING = "trialing"

class Subscription(BaseModel):
    """Subscription model"""
    id: uuid.UUID
    user_id: uuid.UUID
    tier: UserTier
    status: SubscriptionStatus
    stripe_subscription_id: Optional[str] = None
    stripe_customer_id: Optional[str] = None
    current_period_start: datetime
    current_period_end: datetime
    cancel_at_period_end: bool = False
    created_at: datetime
    updated_at: datetime

def get_tier_limits(tier: UserTier) -> TierLimits:
    """Get limits for a specific tier"""
    return TIER_CONFIGS[tier]

def can_generate(user_tier: UserTier, daily_count: int) -> bool:
    """Check if user can generate based on their tier and daily count"""
    limits = get_tier_limits(user_tier)
    return daily_count < limits.daily_generations

def get_tier_from_price(price_cents: int) -> Optional[UserTier]:
    """Get tier based on Stripe price"""
    for tier, price in TIER_PRICING.items():
        if price == price_cents:
            return tier
    return None
