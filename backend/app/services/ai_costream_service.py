"""
AI Co-Streaming Service
Handles intelligent creator matching and raid coordination.
"""

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class AICoStreamService:
    def __init__(self):
        # Mock database of active streamers for MVP
        self.active_streamers = [
            {"id": "user_1", "name": "TechFlow", "genre": "tech", "viewers": 1200, "tags": ["coding", "ai", "future"]},
            {"id": "user_2", "name": "ArtStream", "genre": "art", "viewers": 800, "tags": ["painting", "digital", "chill"]},
            {"id": "user_3", "name": "CryptoKing", "genre": "crypto", "viewers": 3000, "tags": ["bitcoin", "trading", "finance"]},
            {"id": "user_4", "name": "GameMaster", "genre": "gaming", "viewers": 5000, "tags": ["fps", "competitive", "esports"]},
            {"id": "user_5", "name": "IndieDev", "genre": "tech", "viewers": 150, "tags": ["gamedev", "coding", "indie"]},
        ]

    async def find_matches(self, user_id: str, user_profile: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Find best co-streaming partners based on AI matching score.
        Score based on:
        1. Genre overlap (high weight)
        2. Audience size similarity (medium weight)
        3. Tag intersection (medium weight)
        """
        matches = []
        
        user_genre = user_profile.get("genre", "general")
        user_tags = set(user_profile.get("tags", []))
        user_viewers = user_profile.get("viewers", 0)

        for streamer in self.active_streamers:
            if streamer["id"] == user_id:
                continue

            score = 0
            reasons = []

            # 1. Genre Match (50 points)
            if streamer["genre"] == user_genre:
                score += 50
                reasons.append("Same genre")
            
            # 2. Tag Intersection (10 points per match)
            streamer_tags = set(streamer["tags"])
            common_tags = user_tags.intersection(streamer_tags)
            score += len(common_tags) * 10
            if common_tags:
                reasons.append(f"Shared interests: {', '.join(common_tags)}")

            # 3. Viewer Compatibility (20 points)
            # Prefer streamers within 50%-200% of user's viewer count
            viewer_ratio = streamer["viewers"] / (user_viewers + 1)
            if 0.5 <= viewer_ratio <= 2.0:
                score += 20
                reasons.append("Similar audience size")

            if score > 0:
                matches.append({
                    "streamer": streamer,
                    "match_score": score,
                    "match_reasons": reasons
                })

        # Sort by score descending
        matches.sort(key=lambda x: x["match_score"], reverse=True)
        return matches

    async def initiate_raid(self, raider_id: str, target_id: str) -> Dict[str, Any]:
        """
        Coordinate a raid from one streamer to another.
        """
        # In a real app, this would trigger WebSocket events to clients
        logger.info(f"Raid initiated: {raider_id} -> {target_id}")
        
        target = next((s for s in self.active_streamers if s["id"] == target_id), None)
        if not target:
            raise ValueError("Target streamer not found")

        return {
            "status": "initiated",
            "target_name": target["name"],
            "timestamp": datetime.utcnow().isoformat(),
            "raid_id": f"raid_{raider_id}_{target_id}"
        }

# Global instance
co_stream_service = AICoStreamService()
