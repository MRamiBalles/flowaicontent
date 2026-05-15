"""
Video Generation Service

Bridges the Celery task queue to the Modal GPU worker for video generation.
Manages generation records, credit tracking, and result persistence.
"""

import asyncio
import uuid
import logging
from typing import Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class GenerationRecord:
    """Tracks a single video generation request through its lifecycle."""

    def __init__(self, user_id: str, prompt: str, style_pack_id: Optional[str] = None):
        self.record_id = f"gen_{uuid.uuid4().hex[:8]}"
        self.user_id = user_id
        self.prompt = prompt
        self.style_pack_id = style_pack_id
        self.status = "queued"
        self.created_at = datetime.utcnow().isoformat()
        self.completed_at = None
        self.result = None
        self.error = None

    def to_dict(self) -> dict:
        return {
            "record_id": self.record_id,
            "user_id": self.user_id,
            "prompt": self.prompt,
            "style_pack_id": self.style_pack_id,
            "status": self.status,
            "created_at": self.created_at,
            "completed_at": self.completed_at,
            "result": self.result,
            "error": self.error,
        }


class VideoGenerationService:
    """
    Handles the video generation pipeline.

    Flow:
        1. Celery task calls generate_video() with user context.
        2. Service creates a GenerationRecord for auditing.
        3. Dispatches to Modal GPU worker (modal_app.generate_video).
        4. Records result (S3 URL) and returns to Celery.
    """

    def __init__(self):
        self.records: Dict[str, GenerationRecord] = {}
        # Cost per generation in platform credits
        self.credit_cost = 5.0

    def generate_video(
        self,
        user_id: str,
        prompt: str,
        style_pack_id: Optional[str] = None,
        task_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Synchronous entry point called by Celery worker.

        Args:
            user_id: The requesting user's ID.
            prompt: Text prompt for video generation.
            style_pack_id: Optional style preset identifier.
            task_id: Celery task ID for cross-referencing.

        Returns:
            dict with video_url, thumbnail_url, and duration.
        """
        record = GenerationRecord(user_id, prompt, style_pack_id)
        self.records[record.record_id] = record

        logger.info(
            f"[VideoGen] Starting generation {record.record_id} "
            f"for user {user_id} | prompt: {prompt[:60]}..."
        )

        try:
            record.status = "processing"

            # Dispatch to Modal GPU worker
            result = self._dispatch_to_modal(prompt, style_pack_id)

            record.status = "completed"
            record.completed_at = datetime.utcnow().isoformat()
            record.result = result

            logger.info(f"[VideoGen] Completed {record.record_id}: {result['url']}")

            return {
                "video_url": result["url"],
                "thumbnail_url": result.get("url", "").replace(".mp4", "_thumb.jpg"),
                "duration": result.get("duration", 4.0),
                "resolution": result.get("resolution", "1024x576"),
                "style": result.get("style", "default"),
                "record_id": record.record_id,
            }

        except Exception as e:
            record.status = "failed"
            record.error = str(e)
            logger.error(f"[VideoGen] Failed {record.record_id}: {e}")
            raise

    def _dispatch_to_modal(
        self, prompt: str, style_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Call the Modal serverless GPU function.

        In production, this calls modal_app.generate_video.remote().
        For local development without Modal credentials, returns a
        simulation result using the local video engine.
        """
        try:
            from modal_app import generate_video

            return generate_video.remote(prompt=prompt, style_id=style_id)
        except Exception as e:
            logger.warning(
                f"[VideoGen] Modal dispatch failed ({e}), using local fallback"
            )
            return self._local_fallback(prompt, style_id)

    def _local_fallback(
        self, prompt: str, style_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Local development fallback when Modal is not available.
        Uses the VideoEngine simulator to return a placeholder result.
        """
        from app.services.video_engine import video_engine
        import asyncio

        loop = asyncio.new_event_loop()
        try:
            result = loop.run_until_complete(
                video_engine.process_scene(prompt)
            )
        finally:
            loop.close()

        return {
            "status": "completed",
            "url": result.get("video_url", ""),
            "duration": 4.0,
            "resolution": "1024x576",
            "style": style_id or "default",
        }

    # --- Async API (for direct FastAPI use, not via Celery) ---

    async def propose_generation(
        self, tenant_id: str, prompt: str, provider: str = "modal-svd"
    ) -> str:
        """
        Shadow Mode: records generation intent for human approval.
        Returns a proposal_id.
        """
        proposal_id = f"prop_{uuid.uuid4().hex[:8]}"
        self.records[proposal_id] = GenerationRecord(tenant_id, prompt)
        self.records[proposal_id].status = "pending_approval"
        logger.info(f"[Shadow Mode] Generation proposed: {prompt[:50]}...")
        return proposal_id

    async def execute_generation(self, proposal_id: str) -> Dict[str, Any]:
        """Execute a previously proposed generation after approval."""
        if proposal_id not in self.records:
            raise ValueError(f"Proposal {proposal_id} not found")

        record = self.records[proposal_id]
        record.status = "executing"

        result = self.generate_video(
            user_id=record.user_id,
            prompt=record.prompt,
            style_pack_id=record.style_pack_id,
        )

        return result

    def get_record(self, record_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a generation record by ID."""
        record = self.records.get(record_id)
        return record.to_dict() if record else None


video_generation_service = VideoGenerationService()

# Module-level alias for backward compatibility with queue_service.py
generate_video = video_generation_service.generate_video
