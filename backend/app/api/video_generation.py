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
    
    # Credit check: verify user has enough credits for generation
    user_credits = current_user.get("credits", 0)
    generation_cost = 5  # credits per generation
    if user_credits < generation_cost:
        raise HTTPException(
            status_code=402,
            detail=f"Insufficient credits. Required: {generation_cost}, available: {user_credits}"
        )
    
    # Content moderation
    from app.services.moderation_service import moderation_service
    is_safe, reason, _scores = moderation_service.check_prompt(request.prompt)
    if not is_safe:
        raise HTTPException(status_code=400, detail=f"Content moderation failed: {reason}")
    
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

@router.get("/record/{record_id}")
async def get_generation_record(
    record_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Retrieve a generation record by ID"""
    from app.services.video_generation_service import video_generation_service
    record = video_generation_service.get_record(record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Generation record not found")
    return record

@router.get("/styles")
async def get_styles():
    """Get available style packs"""
    from app.services.lora_manager import lora_manager
    return lora_manager.get_available_styles()

def get_database():
    from app.services.supabase_service import get_supabase_client
    return get_supabase_client()
