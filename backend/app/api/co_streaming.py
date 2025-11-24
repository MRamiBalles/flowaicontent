"""
Co-Streaming API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from app.auth import get_current_user
from app.services.ai_costream_service import co_stream_service

router = APIRouter(prefix="/co-streaming", tags=["co-streaming"])

class RaidRequest(BaseModel):
    target_id: str

class MatchResponse(BaseModel):
    streamer: Dict[str, Any]
    match_score: int
    match_reasons: List[str]

@router.get("/matches", response_model=List[MatchResponse])
async def get_matches(current_user: dict = Depends(get_current_user)):
    """Get AI-recommended co-streaming partners"""
    # Mock user profile for MVP - in prod, fetch from DB
    user_profile = {
        "genre": "tech",
        "tags": ["coding", "ai"],
        "viewers": 1000
    }
    
    matches = await co_stream_service.find_matches(current_user["id"], user_profile)
    return matches

@router.post("/raid")
async def start_raid(
    request: RaidRequest,
    current_user: dict = Depends(get_current_user)
):
    """Initiate a raid on another streamer"""
    try:
        result = await co_stream_service.initiate_raid(current_user["id"], request.target_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
