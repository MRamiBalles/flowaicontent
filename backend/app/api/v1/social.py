from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.services.social import social_service

router = APIRouter()

class CommentRequest(BaseModel):
    user_id: str
    video_id: str
    content: str

class ChatRequest(BaseModel):
    user_id: str
    video_id: str
    content: str
    tip_amount: Optional[float] = 0.0

@router.post("/comments")
async def post_comment(request: CommentRequest):
    return await social_service.post_comment(request.user_id, request.video_id, request.content)

@router.get("/comments/{video_id}")
async def get_comments(video_id: str):
    return social_service.get_comments(video_id)

@router.post("/chat")
async def send_chat(request: ChatRequest):
    return await social_service.send_chat_message(request.user_id, request.video_id, request.content, request.tip_amount)

@router.get("/chat/{video_id}")
async def get_chat(video_id: str):
    return social_service.get_chat_history(video_id)
