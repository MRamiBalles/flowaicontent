"""
Content Moderation Service
Handles safety checks for prompts and generated content.
"""

import logging
from typing import List, Dict, Any, Tuple

logger = logging.getLogger(__name__)

class ModerationService:
    def __init__(self):
        # Basic keyword blocklist for MVP
        # In production, use a robust library or API (e.g., OpenAI Moderation API)
        self.blocked_keywords = [
            "nsfw", "nude", "naked", "porn", "xxx", "sex", 
            "violence", "blood", "gore", "kill", "murder",
            "hate", "racist", "nazi"
        ]

    def check_prompt(self, prompt: str) -> Tuple[bool, str]:
        """
        Check if a prompt contains unsafe content.
        Returns (is_safe, reason)
        """
        prompt_lower = prompt.lower()
        
        for keyword in self.blocked_keywords:
            if keyword in prompt_lower:
                logger.warning(f"Blocked unsafe prompt containing: {keyword}")
                return False, f"Prompt contains blocked keyword: {keyword}"
                
        return True, "Safe"

    async def check_image(self, image_path: str) -> bool:
        """
        Check if an image is safe (NSFW detection).
        Placeholder for future AI model integration.
        """
        # TODO: Integrate NSFW detection model (e.g., Falcons.ai/nsfw_image_detection)
        return True

    async def check_video(self, video_path: str) -> bool:
        """
        Check if a video is safe.
        Placeholder for future integration.
        """
        # TODO: Implement video moderation (sample frames -> check_image)
        return True

# Global instance
moderation_service = ModerationService()
