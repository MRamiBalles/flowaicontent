from typing import Dict, Any
from decimal import Decimal

class HybridBillingService:
    """
    Handles the 2026 'Hybrid Pricing' model: Subscription + Token-based usage.
    This model is becoming the standard as LLM costs vary per tenant.
    """

    async def calculate_monthly_invoice(self, tenant_id: str) -> Dict[str, Any]:
        """
        Calculates the total bill for a tenant.
        """
        # 1. Base Subscription Fee
        subscription_fee = Decimal("99.99") # Pro tier
        
        # 2. Variable Usage Fee (Tokens)
        # In a real app, query usage_logs
        tokens_used = 250000 
        rate_per_1k_tokens = Decimal("0.015")
        usage_fee = (Decimal(tokens_used) / 1000) * rate_per_1k_tokens
        
        total = subscription_fee + usage_fee
        
        return {
            "tenant_id": tenant_id,
            "period": "2026-01",
            "base_fee": float(subscription_fee),
            "usage_fee": float(usage_fee),
            "total_due": float(total),
            "currency": "USD",
            "usage_details": {
                "tokens": tokens_used,
                "tier": "Pro"
            }
        }

    async def check_usage_limits(self, tenant_id: str):
        """
        Checks if a tenant has exceeded their soft/hard limits.
        """
        # Mock logic
        usage_percent = 85
        if usage_percent > 80:
            return {"status": "warning", "message": "Usage exceeded 80% of soft limit"}
        return {"status": "ok"}

billing_service = HybridBillingService()
