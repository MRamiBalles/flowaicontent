import pytest
import asyncio
from app.services.finops_service import finops_service, BudgetStatus

@pytest.mark.asyncio
async def test_finops_usage_tagging():
    tenant_id = "tenant-tag-test"
    
    # 1. Seed credits
    finops_service.set_credits(tenant_id, 10.0)
    
    # 2. Spend with separate tags
    # Video Gen: $1.00
    status, _ = await finops_service.check_and_spend(tenant_id, 1.0, feature_tag="video_gen")
    assert status == BudgetStatus.ALLOWED
    
    # Chat: $0.05
    status, _ = await finops_service.check_and_spend(tenant_id, 0.05, feature_tag="chat")
    assert status == BudgetStatus.ALLOWED
    
    # Vision: $0.50
    status, _ = await finops_service.check_and_spend(tenant_id, 0.50, feature_tag="vision")
    assert status == BudgetStatus.ALLOWED
    
    # 3. Verify Tag Usage
    assert finops_service.get_tag_usage(tenant_id, "video_gen") == 1.0
    assert finops_service.get_tag_usage(tenant_id, "chat") == 0.05
    assert finops_service.get_tag_usage(tenant_id, "vision") == 0.50
    assert finops_service.get_tag_usage(tenant_id, "unused_tag") == 0.0
    
    # 4. Verify Total Balance
    # Initial 10.0 - 1.0 - 0.05 - 0.50 = 8.45
    expected_balance = 8.45
    assert abs(finops_service.get_balance(tenant_id) - expected_balance) < 0.001

@pytest.mark.asyncio
async def test_finops_default_tag():
    tenant_id = "tenant-default-test"
    finops_service.set_credits(tenant_id, 5.0)
    
    # Spend without explicit tag (should default to "general")
    await finops_service.check_and_spend(tenant_id, 0.1)
    
    assert finops_service.get_tag_usage(tenant_id, "general") == 0.1
