from typing import List, Dict, Any
import time
import uuid
from app.services.compass import compass_service
from app.services.ledger import ledger_service

class SocialService:
    """
    Manages social interactions: Comments, Live Chat, and Direct Messages.
    Integrates with COMPASS for moderation and Ledger for tipping.
    """
    def __init__(self):
        # In-memory storage
        # {video_id: [comments]}
        self.comments: Dict[str, List[Dict]] = {}
        # {video_id: [chat_messages]}
        self.chat_history: Dict[str, List[Dict]] = {}

    async def post_comment(self, user_id: str, video_id: str, content: str) -> Dict[str, Any]:
        """
        Posts a comment after COMPASS moderation.
        """
        # 1. Moderate content
        analysis = await compass_service.analyze_output(content)
        
        is_toxic = analysis["safety_score"] < 80
        
        comment = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "video_id": video_id,
            "content": content,
            "timestamp": time.time(),
            "is_toxic": is_toxic,
            "moderation_flags": analysis["flags"] if is_toxic else [],
            "tips": 0.0
        }
        
        if video_id not in self.comments:
            self.comments[video_id] = []
            
        # In a real app, we might reject toxic comments entirely
        # Here we flag them for the UI to hide/warn
        self.comments[video_id].append(comment)
        
        return comment

    async def send_chat_message(self, user_id: str, video_id: str, content: str, tip_amount: float = 0.0) -> Dict[str, Any]:
        """
        Sends a live chat message. Supports tipping (Super Chat).
        """
        # 1. Process Tip if any
        if tip_amount > 0:
            # Transfer from user to platform/creator (simplified)
            ledger_service.transfer(user_id, "platform_pool", tip_amount, f"Super Chat on {video_id}")
            
        # 2. Moderate
        analysis = await compass_service.analyze_output(content)
        
        message = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "content": content,
            "timestamp": time.time(),
            "is_super_chat": tip_amount > 0,
            "tip_amount": tip_amount,
            "safety_score": analysis["safety_score"]
        }
        
        if video_id not in self.chat_history:
            self.chat_history[video_id] = []
            
        self.chat_history[video_id].append(message)
        
        # Keep history manageable
        if len(self.chat_history[video_id]) > 100:
            self.chat_history[video_id].pop(0)
            
        return message

    def get_comments(self, video_id: str) -> List[Dict]:
        return self.comments.get(video_id, [])

    def get_chat_history(self, video_id: str) -> List[Dict]:
        return self.chat_history.get(video_id, [])

social_service = SocialService()
