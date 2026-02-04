import asyncio
import sys
import os
import json

# Ensure 'backend' is in path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.services.finops_service import finops_service, BudgetStatus
from app.utils.mcp_decorators import budget_gate

async def test_finops_logic():
    print("--- FinOps Budget Gate Verification ---")
    tenant_id = "tenant-finops-test"
    
    # 1. Test: Insufficient Funds
    print("\n[TEST 1] Insufficient Funds")
    finops_service.set_credits(tenant_id, 0.01) # Set very low credits
    
    @budget_gate(static_cost=1.0)
    async def expensive_tool(tenant_context: str):
        return "SUCCESS"

    result_raw = await expensive_tool(tenant_context=tenant_id)
    result = json.loads(result_raw)
    assert result["error"] == "FinOps Blocked"
    assert result["reason"] == BudgetStatus.REJECTED_INSUFFICIENT_FUNDS.value
    print("   [OK] Correctly blocked expensive action")

    # 2. Test: Successful Deduction
    print("\n[TEST 2] Successful Deduction")
    finops_service.set_credits(tenant_id, 10.0)
    
    @budget_gate(static_cost=1.0)
    async def nominal_tool(tenant_context: str):
        return "SUCCESS"

    result = await nominal_tool(tenant_context=tenant_id)
    assert result == "SUCCESS"
    assert finops_service.get_balance(tenant_id) == 9.0
    print("   [OK] Correctly deducted $1.00. Balance: $9.00")

    # 3. Test: Atomic Race Condition (The Runaway Agent)
    print("\n[TEST 3] Atomic Race Condition (Runaway Agent)")
    # Scenario: $5.0 balance. 10 agents try to spend $1.0 each at the SAME time.
    # Only 5 should succeed.
    finops_service.set_credits(tenant_id, 5.0)
    
    # Disable rate limit for this specific test component or set RPS high
    finops_service.MAX_RPS = 100 
    
    @budget_gate(static_cost=1.0)
    async def concurrent_tool(tenant_context: str):
        await asyncio.sleep(0.01) # Simulate some work
        return "SUCCESS"

    # Spawn 10 concurrent requests
    tasks = [concurrent_tool(tenant_context=tenant_id) for _ in range(10)]
    results = await asyncio.gather(*tasks)
    
    success_count = sum(1 for r in results if r == "SUCCESS")
    fail_count = sum(1 for r in results if isinstance(r, str) and "rejected_insufficient_funds" in r)
    
    print(f"   Results: {success_count} Successes, {fail_count} Failures")
    assert success_count == 5, f"Expected 5 successes, got {success_count}"
    assert fail_count == 5, f"Expected 5 failures, got {fail_count}"
    assert finops_service.get_balance(tenant_id) == 0.0
    print("   [OK] Atomic gates held firm. No over-spending occurred.")

    # 4. Test: Rate Limiting
    print("\n[TEST 4] Rate Limiting")
    finops_service.set_credits(tenant_id, 100.0)
    finops_service.MAX_RPS = 5
    
    @budget_gate(static_cost=0.01)
    async def fast_tool(tenant_context: str):
        return "SUCCESS"

    # Try 10 calls in a row
    tasks = [fast_tool(tenant_context=tenant_id) for _ in range(10)]
    results = await asyncio.gather(*tasks)
    
    rate_limited_count = sum(1 for r in results if isinstance(r, str) and "rejected_rate_limit" in r)
    print(f"   Rate Limited: {rate_limited_count} calls")
    assert rate_limited_count > 0, "Expected at least some rate limiting"
    print("   [OK] Rate limiter activated.")

    print("\nFINOPS BUDGET GATES VERIFIED!")


if __name__ == "__main__":
    asyncio.run(test_finops_logic())
