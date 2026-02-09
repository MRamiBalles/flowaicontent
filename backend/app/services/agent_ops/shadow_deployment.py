import logging
import json
from datetime import datetime
from typing import Any, Dict, Optional

logger = logging.getLogger("agentops.shadow")

class ShadowDeploymentService:
    """
    Service for running agents in 'Shadow Mode'.
    Records decisions and predicted outcomes without executing them.
    Used for 2026-compliant AgentOps governance.
    """
    
    @staticmethod
    async def record_shadow_action(
        agent_id: str,
        tenant_id: str,
        input_data: Dict[str, Any],
        predicted_action: str,
        confidence_score: float,
        metadata: Optional[Dict[str, Any]] = None
    ):
        import hashlib
        from app.services.supabase_service import supabase_admin
        
        # Calculate input hash for integrity (SHA-256)
        input_str = json.dumps(input_data, sort_keys=True)
        input_hash = hashlib.sha256(input_str.encode("utf-8")).hexdigest()

        shadow_log = {
            "agent_id": agent_id,
            "tenant_id": tenant_id,
            "input_hash": input_hash,
            "predicted_action": predicted_action,
            "confidence": confidence_score,
            "metadata": metadata or {},
            "decision_vector": None, # Placeholder for future vector embeddings
            # created_at is handled by DB default
        }
        
        # Log to console for immediate debug
        logger.info(f"SHADOW_ACTION_LOG: {json.dumps(shadow_log)}")
        
        # Persist to Supabase (ISO 42001 Traceability)
        try:
            # Using supabase_admin to ensure we can write to the audit log
            # In a real scenario, we might want to use a scoped client if not using admin
            response = supabase_admin.table("shadow_actions").insert(shadow_log).execute()
            return response.data
        except Exception as e:
            logger.error(f"FAILED TO PERSIST SHADOW LOG: {e}")
            # We don't raise here to avoid breaking the agent flow, 
            # but this is a critical alerting event in production.
            return shadow_log

shadow_service = ShadowDeploymentService()
