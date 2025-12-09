"""
Enterprise Tenant API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Dict, Any
from app.services.tenant_service import tenant_service
from app.dependencies.auth import get_admin_user

router = APIRouter(prefix="/enterprise", tags=["enterprise"])

class TenantCreateRequest(BaseModel):
    name: str
    domain: str
    config: Dict[str, Any]

@router.get("/config")
async def get_tenant_config(request: Request):
    """
    Get white-label config based on the request's Host header.
    Example: If Host is 'nike.flowai.com', returns Nike's branding.
    """
    host = request.headers.get("host", "")
    # For local dev testing, allow passing ?domain= query param
    if "localhost" in host:
        host = request.query_params.get("domain", "nike.flowai.com")
        
    config = await tenant_service.get_tenant_config(host)
    if not config:
        # Return default FlowAI branding if no tenant found
        return {
            "name": "FlowAI",
            "config": {
                "logo_url": "/logo.png",
                "primary_color": "#7C3AED", # Violet
                "features": ["standard"]
            }
        }
    return config

@router.post("/register")
async def register_tenant(
    tenant: TenantCreateRequest,
    current_user: dict = Depends(get_admin_user)
):
    """
    Create a new enterprise tenant.
    
    Requires: Admin role (verified via JWT + user_roles table)
    """
    try:
        return await tenant_service.create_tenant(tenant.name, tenant.domain, tenant.config)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

