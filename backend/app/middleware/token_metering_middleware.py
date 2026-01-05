from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
import logging
import time

logger = logging.getLogger("finops.metering")

class TokenMeteringMiddleware(BaseHTTPMiddleware):
    """
    Gold Standard 2026 FinOps Middleware.
    Enforces 'Hard Budget Gates' per tenant to protect margins.
    """
    
    async def dispatch(self, request: Request, call_next):
        # 1. Identify Tenant
        # In a real app, extract from app.current_tenant or JWT
        tenant_id = request.headers.get("X-Tenant-ID", "default")
        
        # 2. Check current quota (In-memory or Redis)
        # Mock limit check
        if await self._is_quota_exceeded(tenant_id):
            logger.warning(f"FINOPS: Tenant {tenant_id} exceeded daily budget. Blocking request.")
            raise HTTPException(
                status_code=429, 
                detail="Daily AI budget exceeded. Please upgrade your plan or wait until tomorrow."
            )
            
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        
        # 3. Async Log Usage
        # In actual deployment, we'd capture the 'usage' field from the OpenAI/Anthropic response
        # and record it in the database.
        
        return response

    async def _is_quota_exceeded(self, tenant_id: str) -> bool:
        """
        Check if the tenant has budget remaining.
        """
        # Mock: All 'default' tenants have budget, 'overlimit' tenant is blocked
        return tenant_id == "overlimit"

# Helper for manual check in services
async def check_budget_gate(tenant_id: str, estimated_tokens: int):
    # Logic to check if an action is affordable before starting
    pass
