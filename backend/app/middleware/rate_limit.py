"""
Rate Limiting Middleware
Enforces tier-based rate limits using Redis
"""

from fastapi import Request, HTTPException
from functools import wraps
import redis.asyncio as redis
from typing import Callable
from datetime import date
import os

from app.models.subscription import get_tier_limits, UserTier

# Initialize Redis
redis_client = redis.from_url(
    os.getenv("REDIS_URL", "redis://localhost:6379"),
    encoding="utf-8",
    decode_responses=True
)

class RateLimitExceeded(HTTPException):
    def __init__(self, limit: int, reset_at: str):
        super().__init__(
            status_code=429,
            detail={
                "error": "Rate limit exceeded",
                "limit": limit,
                "reset_at": reset_at
            }
        )

async def check_rate_limit(
    user_id: str,
    tier: UserTier
) -> tuple[int, int]:
    """
    Check if user has exceeded their daily generation limit
    Returns: (current_count, limit)
    """
    # Get tier-specific limit
    limits = get_tier_limits(tier)
    daily_limit = limits.daily_generations
    
    # Generate Redis key for today
    today = date.today().isoformat()
    key = f"ratelimit:generations:{user_id}:{today}"
    
    # Get current count
    current_count = await redis_client.get(key)
    current_count = int(current_count) if current_count else 0
    
    # Check if limit exceeded
    if current_count >= daily_limit:
        # Calculate reset time (midnight tomorrow)
        reset_at = f"{date.today().replace(day=date.today().day + 1).isoformat()}T00:00:00Z"
        raise RateLimitExceeded(daily_limit, reset_at)
    
    return current_count, daily_limit

async def increment_usage(user_id: str):
    """Increment user's daily generation count"""
    today = date.today().isoformat()
    key = f"ratelimit:generations:{user_id}:{today}"
    
    # Increment and set expiration to end of day
    await redis_client.incr(key)
    await redis_client.expire(key, 86400)  # 24 hours

async def get_usage_stats(user_id: str, tier: UserTier) -> dict:
    """Get current usage statistics for user"""
    today = date.today().isoformat()
    key = f"ratelimit:generations:{user_id}:{today}"
    
    current_count = await redis_client.get(key)
    current_count = int(current_count) if current_count else 0
    
    limits = get_tier_limits(tier)
    
    return {
        "generations_today": current_count,
        "daily_limit": limits.daily_generations,
        "remaining": max(0, limits.daily_limit - current_count),
        "reset_at": f"{date.today().replace(day=date.today().day + 1).isoformat()}T00:00:00Z"
    }

def require_tier(*allowed_tiers: UserTier):
    """Decorator to enforce tier requirements on endpoints"""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract user from request (assuming JWT middleware sets it)
            request: Request = kwargs.get("request")
            if not request:
                raise HTTPException(500, "Internal error: request not found")
            
            user = request.state.user
            user_tier = UserTier(user.get("tier", "free"))
            
            if user_tier not in allowed_tiers:
                raise HTTPException(
                    403,
                    f"This endpoint requires {' or '.join([t.value for t in allowed_tiers])} tier"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator
