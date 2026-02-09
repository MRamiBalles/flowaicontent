import functools
import json
from typing import Any, Callable, Dict, Optional
from app.services.finops_service import finops_service, BudgetStatus

def budget_gate(static_cost: float = 0.0, cost_func: Optional[Callable[..., float]] = None, feature_tag: str = "general"):
    """
    Decorator to enforce FinOps Budget Gates on MCP tools.
    
    Args:
        static_cost: A fixed cost for the action.
        cost_func: A function that takes tool arguments and returns a dynamic cost estimate.
        feature_tag: The category of the feature for cost attribution (e.g., 'video_gen', 'chat').
    """
    def decorator(func: Callable):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # 1. Extract tenant_context from arguments
            # FastMCP tools usually receive arguments passed directly to the function
            tenant_id = kwargs.get("tenant_context")
            
            if not tenant_id:
                return json.dumps({
                    "error": "FinOps Violation",
                    "message": "Security Policy: Missing tenant_context. Action blocked."
                })

            # 2. Calculate Cost
            cost = static_cost
            if cost_func:
                cost = cost_func(**kwargs)

            # 3. Check and Spend Atomically
            status, error_msg = await finops_service.check_and_spend(tenant_id, cost, feature_tag)
            
            if status != BudgetStatus.ALLOWED:
                # Log audit event (Simulated)
                print(f"[AUDIT] BLOCKED: Tenant {tenant_id} action {func.__name__} reason: {status.value}")
                return json.dumps({
                    "error": "FinOps Blocked",
                    "reason": status.value,
                    "message": error_msg or "Action blocked by Budget Gate."
                })

            # 4. Execute Tool
            return await func(*args, **kwargs)
            
        return wrapper
    return decorator
