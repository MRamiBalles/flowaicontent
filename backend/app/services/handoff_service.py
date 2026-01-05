from enum import Enum
from typing import Dict, Any, Optional
from datetime import datetime
import json

class AgentState(Enum):
    AI_ACTIVE = "ai_active"
    HUMAN_REQUESTED = "human_requested"
    HUMAN_ACTIVE = "human_active"
    RESOLVED = "resolved"

class HandoffService:
    """
    Implements the 2026 'Hybrid Handoff' protocol.
    Detects when an agent reaches its limit and transitions to human support.
    """

    async def initiate_handoff(self, session_id: str, agent_context: Dict[str, Any], reason: str) -> Dict[str, Any]:
        """
        Transitions a session from AI to Human support.
        Generates a 'Context Dump' for the human operator.
        """
        # 1. Generate 2026-standard Context Dump
        context_dump = {
            "version": "1.0",
            "timestamp": datetime.utcnow().isoformat(),
            "session_id": session_id,
            "handoff_reason": reason,
            "reasoning_trace": agent_context.get("reasoning_trace", []), # New 2026 Gold Standard addition
            "failed_tools": agent_context.get("failed_tools", []),
            "agent_memory": agent_context.get("memory", []),
            "last_intent": agent_context.get("last_intent"),
            "sentiment_score": agent_context.get("sentiment", 0.5), # 0 (negative) to 1 (positive)
            "suggested_actions": ["escalate_to_manager", "offer_refund"]
        }

        # 2. Update state in DB (Mock)
        # await db.sessions.update(session_id, {"status": AgentState.HUMAN_REQUESTED, "context_dump": context_dump})
        
        return {
            "status": AgentState.HUMAN_REQUESTED.value,
            "context_dump": context_dump,
            "queue_position": 1
        }

    def detect_low_confidence(self, tool_confidence: float, user_sentiment: float) -> bool:
        """
        Heuristic to trigger automatic handoff.
        2026 best practice: Handoff if confidence < 0.7 OR sentiment < 0.3.
        """
        return tool_confidence < 0.7 or user_sentiment < 0.3

handoff_service = HandoffService()
