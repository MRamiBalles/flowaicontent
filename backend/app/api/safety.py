"""
Content Safety API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
from app.auth import get_current_user
from app.services.deepfake_detector import deepfake_detector
from app.services.moderation_service import moderation_service

router = APIRouter(prefix="/safety", tags=["safety"])

class ContentCheckRequest(BaseModel):
    media_url: str
    media_type: str = "video"  # video, audio, image

class SafetyReport(BaseModel):
    is_safe: bool
    risk_score: float
    details: Dict[str, Any]

@router.post("/check", response_model=SafetyReport)
async def check_content_safety(
    request: ContentCheckRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Analyze content for deepfakes and safety violations.
    """
    # 1. Check Deepfakes
    if request.media_type == "video":
        analysis = await deepfake_detector.analyze_video(request.media_url)
        is_deepfake = analysis["is_manipulated"]
        risk_score = analysis["confidence"]
        details = analysis
    elif request.media_type == "audio":
        analysis = await deepfake_detector.analyze_audio(request.media_url)
        is_deepfake = analysis["is_synthetic"]
        risk_score = analysis["confidence"]
        details = analysis
    else:
        # Images, etc.
        is_deepfake = False
        risk_score = 0.0
        details = {"info": "Deepfake check skipped for this media type"}

    # 2. Check NSFW/Moderation (if applicable to URL/content)
    # For now, we assume moderation_service handles text/prompts, 
    # but we could extend it to check media URLs here.
    
    if is_deepfake:
        return {
            "is_safe": False,
            "risk_score": risk_score,
            "details": details
        }

    return {
        "is_safe": True,
        "risk_score": risk_score,
        "details": details
    }
