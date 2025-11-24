"""
Governance Service
Handles DAO proposals and voting.
"""

import logging
import uuid
from typing import List, Dict, Any
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class GovernanceService:
    def __init__(self):
        self.proposals = [
            {
                "id": "prop_1",
                "title": "Increase Staking APY",
                "description": "Proposal to increase base staking APY from 12% to 15%.",
                "proposer": "0xAdmin",
                "votes_for": 15000,
                "votes_against": 2000,
                "end_time": (datetime.utcnow() + timedelta(days=2)).isoformat(),
                "status": "active"
            }
        ]

    async def get_proposals(self) -> List[Dict[str, Any]]:
        """Get all governance proposals."""
        return self.proposals

    async def create_proposal(self, user_id: str, title: str, description: str) -> Dict[str, Any]:
        """Create a new proposal."""
        new_prop = {
            "id": f"prop_{uuid.uuid4().hex[:8]}",
            "title": title,
            "description": description,
            "proposer": user_id,
            "votes_for": 0,
            "votes_against": 0,
            "end_time": (datetime.utcnow() + timedelta(days=7)).isoformat(),
            "status": "active"
        }
        self.proposals.append(new_prop)
        return new_prop

    async def vote(self, user_id: str, proposal_id: str, support: bool, weight: int) -> Dict[str, Any]:
        """Cast a vote on a proposal."""
        proposal = next((p for p in self.proposals if p["id"] == proposal_id), None)
        if not proposal:
            raise ValueError("Proposal not found")
            
        if proposal["status"] != "active":
            raise ValueError("Proposal is closed")

        # In prod: Verify user hasn't voted yet
        
        if support:
            proposal["votes_for"] += weight
        else:
            proposal["votes_against"] += weight
            
        return {"status": "success", "new_totals": {"for": proposal["votes_for"], "against": proposal["votes_against"]}}

# Global instance
governance_service = GovernanceService()
