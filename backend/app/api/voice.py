"""
Voice Cloning API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List
from app.auth import get_current_user
from app.services.voice_cloning_service import voice_cloning_service

router = APIRouter(prefix="/voice", tags=["voice"])

@router.post("/clone")
async def clone_voice(
    samples: List[str] = Body(..., embed=True),
    current_user: dict = Depends(get_current_user)
):
    """Clone user's voice from audio samples (URLs)"""
    return await voice_cloning_service.clone_voice(current_user["id"], samples)

@router.post("/speak")
async def synthesize_speech(
    text: str = Body(..., embed=True),
    current_user: dict = Depends(get_current_user)
):
    """Generate audio using cloned voice"""
    try:
        url = await voice_cloning_service.synthesize_speech(current_user["id"], text)
        return {"audio_url": url}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
