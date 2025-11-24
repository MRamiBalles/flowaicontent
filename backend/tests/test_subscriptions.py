"""
Unit Tests for Subscription System
Tests tier limits, rate limiting, and Stripe integration
"""

import pytest
from datetime import datetime, timedelta
from app.models.subscription import (
    UserTier,
    get_tier_limits,
    can_generate,
    get_tier_from_price,
    TIER_PRICING
)

class TestTierLimits:
    """Test tier configuration and limits"""
    
    def test_free_tier_limits(self):
        limits = get_tier_limits(UserTier.FREE)
        assert limits.daily_generations == 10
        assert limits.watermark == True
        assert limits.api_access == False
    
    def test_pro_tier_limits(self):
        limits = get_tier_limits(UserTier.PRO)
        assert limits.daily_generations == 100
        assert limits.watermark == False
        assert limits.priority_queue == True
    
    def test_studio_tier_unlimited(self):
        limits = get_tier_limits(UserTier.STUDIO)
        assert limits.daily_generations == 999999
        assert limits.api_access == True
        assert limits.custom_loras == True
    
    def test_can_generate_within_limit(self):
        assert can_generate(UserTier.FREE, 5) == True
        assert can_generate(UserTier.FREE, 9) == True
    
    def test_can_generate_at_limit(self):
        assert can_generate(UserTier.FREE, 10) == False
        assert can_generate(UserTier.PRO, 100) == False
    
    def test_can_generate_unlimited(self):
        assert can_generate(UserTier.STUDIO, 1000000) == True

class TestPricing:
    """Test pricing configurations"""
    
    def test_tier_pricing(self):
        assert TIER_PRICING[UserTier.FREE] == 0
        assert TIER_PRICING[UserTier.PRO] == 999  # $9.99
        assert TIER_PRICING[UserTier.STUDIO] == 4999  # $49.99
        assert TIER_PRICING[UserTier.BUSINESS] == 19900  # $199
    
    def test_get_tier_from_price(self):
        assert get_tier_from_price(0) == UserTier.FREE
        assert get_tier_from_price(999) == UserTier.PRO
        assert get_tier_from_price(4999) == UserTier.STUDIO
        assert get_tier_from_price(99999) is None  # Invalid price

@pytest.mark.asyncio
class TestRateLimiting:
    """Test rate limiting functionality"""
    
    async def test_rate_limit_increments(self, redis_client):
        from app.middleware.rate_limit import increment_usage, check_rate_limit
        
        user_id = "test_user_123"
        tier = UserTier.FREE
        
        # First generation should succeed
        current, limit = await check_rate_limit(user_id, tier)
        assert current == 0
        assert limit == 10
        
        # Increment usage
        await increment_usage(user_id)
        
        # Check again
        current, limit = await check_rate_limit(user_id, tier)
        assert current == 1
    
    async def test_rate_limit_exceeded(self, redis_client):
        from app.middleware.rate_limit import increment_usage, check_rate_limit, RateLimitExceeded
        
        user_id = "test_user_456"
        tier = UserTier.FREE
        
        # Simulate 10 generations
        for i in range(10):
            await increment_usage(user_id)
        
        # 11th should fail
        with pytest.raises(RateLimitExceeded):
            await check_rate_limit(user_id, tier)
    
    async def test_usage_stats(self, redis_client):
        from app.middleware.rate_limit import get_usage_stats, increment_usage
        
        user_id = "test_user_789"
        tier = UserTier.PRO
        
        await increment_usage(user_id)
        await increment_usage(user_id)
        
        stats = await get_usage_stats(user_id, tier)
        assert stats["generations_today"] == 2
        assert stats["daily_limit"] == 100
        assert stats["remaining"] == 98

@pytest.mark.asyncio
class TestStripeIntegration:
    """Test Stripe service functions"""
    
    async def test_create_checkout_session(self, mocker):
        from app.services.stripe_service import StripeService
        
        # Mock Stripe API
        mock_session = mocker.patch('stripe.checkout.Session.create')
        mock_session.return_value = mocker.Mock(
            id="cs_test_123",
            url="https://checkout.stripe.com/test"
        )
        
        result = await StripeService.create_checkout_session(
            user_id="user_123",
            tier=UserTier.PRO,
            success_url="https://app.flowai.com/success",
            cancel_url="https://app.flowai.com/cancel"
        )
        
        assert result["session_id"] == "cs_test_123"
        assert "checkout.stripe.com" in result["url"]
    
    async def test_cancel_subscription(self, mocker):
        from app.services.stripe_service import StripeService
        
        mock_modify = mocker.patch('stripe.Subscription.modify')
        mock_modify.return_value = mocker.Mock(cancel_at=1234567890)
        
        result = await StripeService.cancel_subscription("sub_123")
        assert result["status"] == "canceled"
    
    async def test_webhook_signature_verification(self, mocker):
        from app.services.stripe_service import StripeService
        
        payload = b'{"type": "checkout.session.completed"}'
        signature = "t=123,v1=abc"
        
        mock_construct = mocker.patch('stripe.Webhook.construct_event')
        mock_construct.return_value = {"type": "test"}
        
        event = StripeService.verify_webhook(payload, signature)
        assert event["type"] == "test"

# Fixtures
@pytest.fixture
async def redis_client():
    """Provide Redis client for testing"""
    import redis.asyncio as redis
    client = redis.from_url("redis://localhost:6379", decode_responses=True)
    yield client
    # Cleanup
    await client.flushdb()
    await client.close()

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
