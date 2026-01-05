from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
import logging
from app.services.finops_service import finops_service

logger = logging.getLogger(__name__)

class TokenMeteringMiddleware(BaseHTTPMiddleware):
    """
    Hard Budget Gate Middleware (FinOps 2026).
    Intercepts and blocks requests exceeding tenant quotas.
    """
    async def dispatch(self, request: Request, call_next):
        # Extract tenant context from headers (managed by RLS layer)
        tenant_id = request.headers.get("X-Tenant-ID", "default")
        
        # 1. Real-time Budget Check
        budget_status = await finops_service.check_budget_gate(tenant_id)
        
        if budget_status == "blocked":
            logger.error(f"FINOPS: Tenant {tenant_id} hard-blocked (110% quota reached).")
            raise HTTPException(
                status_code=429, 
                detail="Critical budget limit reached. Service interrupted."
            )
        elif budget_status == "degraded":
            logger.warning(f"FINOPS: Tenant {tenant_id} in DEGRADED mode (100% quota reached).")
            # In production, add a custom header to inform the frontend
            # response.headers["X-FlowAI-Status"] = "degraded"
        
        # 2. Proceed with request
        response = await call_next(request)
        
        # 3. Future improvement: Extract usage metrics from response headers and record it
        return response
