"""
Attribution Tracker Service
Tracks content provenance and viral spread.
"""

import logging
from typing import List, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)

class AttributionTracker:
    def __init__(self):
        # Mock database for attribution chains
        self.attribution_graph = {}

    async def register_creation(self, content_id: str, creator_id: str, parent_id: str = None):
        """
        Register a new piece of content in the attribution graph.
        """
        entry = {
            "creator_id": creator_id,
            "parent_id": parent_id,
            "created_at": datetime.utcnow().isoformat(),
            "remixes": 0,
            "views": 0
        }
        self.attribution_graph[content_id] = entry
        
        if parent_id and parent_id in self.attribution_graph:
            self.attribution_graph[parent_id]["remixes"] += 1
            logger.info(f"Registered remix: {content_id} (Parent: {parent_id})")

    async def get_provenance(self, content_id: str) -> List[Dict[str, Any]]:
        """
        Get the full history/lineage of a piece of content.
        """
        chain = []
        current_id = content_id
        
        while current_id and current_id in self.attribution_graph:
            data = self.attribution_graph[current_id]
            chain.append({
                "content_id": current_id,
                **data
            })
            current_id = data["parent_id"]
            
        return chain

    async def calculate_viral_score(self, content_id: str) -> float:
        """
        Calculate viral coefficient based on remixes and depth.
        """
        if content_id not in self.attribution_graph:
            return 0.0
            
        data = self.attribution_graph[content_id]
        
        # Simple viral score algorithm
        # Score = Remixes * 10 + Views * 0.01
        score = (data["remixes"] * 10) + (data["views"] * 0.01)
        return round(score, 2)

# Global instance
attribution_tracker = AttributionTracker()
