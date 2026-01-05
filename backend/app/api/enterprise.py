"""
Enterprise Tenant API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Dict, Any
from app.services.tenant_service import tenant_service
from app.services.portability_service import portability_service
from app.dependencies.auth import get_admin_user, get_current_user

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

@router.post("/export")
async def request_data_export(
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """
    EU Data Act Portability Endpoint.
    Triggers a bulk export of all tenant data in standardized format.
    """
    tenant_id = current_user.get("tenant_id")
    if not tenant_id:
        raise HTTPException(status_code=400, detail="User not associated with a tenant")
    
    # In a real app, generate a signed URL or send via email
    background_tasks.add_task(portability_service.generate_bulk_export, tenant_id)
    
    return {"message": "Export initiated. You will receive a notification when it's ready."}

@router.get("/generative-ui/preview")
async def get_generative_ui_preview(intent: str, current_user: dict = Depends(get_current_user)):
    """
    Returns a JSON schema for the Generative UI based on user intent.
    Example: 'Show my usage' -> returns chart component schema.
    """
    if "usage" in intent.lower():
        return {
            "type": "chart",
            "props": {
                "title": "AI Usage Overview",
                "data": [
                    {"name": "Jan", "value": 400},
                    {"name": "Feb", "value": 300}
                ]
            }
        }
    
    return {
        "type": "alert",
        "props": {
            "message": f"I understood your intent: {intent}. Here is a dynamic response."
        }
    }
