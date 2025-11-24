"""
Video Generation API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List
from app.auth import get_current_user
from app.services.queue_service import generate_video_task

router = APIRouter(prefix="/video-generation", tags=["video-generation"])

class GenerateVideoRequest(BaseModel):
    prompt: str
    style_id: Optional[str] = None
    duration: int = 4
    aspect_ratio: str = "16:9"

class GenerationResponse(BaseModel):
    task_id: str
    status: str
    message: str

@router.post("/generate", response_model=GenerationResponse)
async def generate_video(
    request: GenerateVideoRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Start a video generation task"""
    user_id = current_user["id"]
    
    # TODO: Check user credits/tokens
    
    # Queue the task
    task = generate_video_task.delay(
        user_id=user_id,
        prompt=request.prompt,
        style_pack_id=request.style_id
    )
    
    return {
        "task_id": task.id,
        "status": "queued",
        "message": "Video generation started"
    }

@router.get("/status/{task_id}")
async def get_generation_status(
    task_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Check status of generation task"""
    from celery.result import AsyncResult
    
    task_result = AsyncResult(task_id)
    
    response = {
        "task_id": task_id,
        "status": task_result.status,
        "result": task_result.result if task_result.ready() else None
    }
    
    return response

@router.get("/styles")
async def get_styles():
    """Get available style packs"""
    # TODO: Fetch from database or config
    return [
        {"id": "cinematic", "name": "Cinematic", "preview": "url_to_preview"},
        {"id": "anime", "name": "Anime", "preview": "url_to_preview"},
        {"id": "3d-render", "name": "3D Render", "preview": "url_to_preview"},
    ]

def get_database():
    from app.services.supabase_service import get_supabase_client
    return get_supabase_client()
