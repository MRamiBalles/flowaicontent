"""
Emote Generation API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from app.auth import get_current_user
from app.services.emote_generation_service import emote_service

router = APIRouter(prefix="/emotes", tags=["emotes"])

class GenerateEmoteRequest(BaseModel):
    prompt: str
    style: str = "pixel-art"

class EmoteResponse(BaseModel):
    id: str
    url: str
    prompt: str
    style: str
    created_at: str

@router.post("/generate", response_model=EmoteResponse)
async def generate_emote(
    request: GenerateEmoteRequest,
    current_user: dict = Depends(get_current_user)
):
    """Generate a new custom emote"""
    try:
        result = await emote_service.generate_emote(
            current_user["id"], 
            request.prompt, 
            request.style
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/library", response_model=List[EmoteResponse])
async def get_emote_library(current_user: dict = Depends(get_current_user)):
    """Get user's emote library"""
    return await emote_service.get_user_emotes(current_user["id"])
