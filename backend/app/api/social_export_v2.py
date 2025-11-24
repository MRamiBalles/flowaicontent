"""
Social Export API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel
from typing import Dict, Any, List
from app.auth import get_current_user
from app.services.social_export_service import social_export_service

router = APIRouter(prefix="/social-export", tags=["social-export"])

class ExportRequest(BaseModel):
    video_id: str
    platform: str  # tiktok, instagram, youtube_shorts

@router.post("/share")
async def share_video(
    request: ExportRequest,
    current_user: dict = Depends(get_current_user)
):
    """Export a video to a social platform"""
    try:
        return await social_export_service.export_video(
            current_user["id"],
            request.video_id,
            request.platform
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history")
async def get_export_history(current_user: dict = Depends(get_current_user)):
    """Get user's export history"""
    # Mock history filter
    user_exports = [
        e for e in social_export_service.exports.values() 
        if e["user_id"] == current_user["id"]
    ]
    return user_exports
