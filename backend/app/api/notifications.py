"""
Notification API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Body
from typing import Dict, Any
from app.auth import get_current_user
from app.services.push_service import push_service

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.post("/subscribe")
async def subscribe(
    subscription: Dict[str, Any] = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """Register a push subscription"""
    await push_service.add_subscription(current_user["id"], subscription)
    return {"status": "success"}

@router.post("/test")
async def test_notification(
    current_user: dict = Depends(get_current_user)
):
    """Send a test notification to yourself"""
    await push_service.send_notification(
        current_user["id"],
        "Test Notification",
        "This is a test message from FlowAI!"
    )
    return {"status": "sent"}
