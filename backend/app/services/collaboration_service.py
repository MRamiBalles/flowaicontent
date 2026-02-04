from typing import Dict, List, Any, Optional
import json
import asyncio
from datetime import datetime
import opentimelineio as otio
from app.services.mock_yjs import YDoc, YMap, YArray, encode_state_as_update, apply_update
from app.services.otio_schema import otio_to_yjs, yjs_to_otio

class CollaborativeTimeline:
    """
    Manages a single collaborative video editing session using Yjs (Mocked).
    Acts as the Authoritative Server State.
    """
    def __init__(self, project_id: str):
        self.project_id = project_id
        self.doc = YDoc()
        # Initialize with empty structure if new
        if not self.doc.get_array("tracks"):
            # Create default OTIO structure
            timeline = otio.schema.Timeline(name=f"Project {project_id}")
            otio_to_yjs(timeline, self.doc)
            
        self.active_users: Dict[str, Any] = {} # user_id -> awareness state

    def get_update(self) -> bytes:
        """Get the full state update to send to new clients"""
        return encode_state_as_update(self.doc)

    def apply_update(self, update: bytes):
        """Apply an update from a client"""
        apply_update(self.doc, update)

    def to_otio(self) -> otio.schema.Timeline:
        """Export current state to OTIO"""
        return yjs_to_otio(self.doc)

    async def save_to_db(self):
        """Persist state to DB (Simulated)"""
        binary_blob = encode_state_as_update(self.doc)
        print(f"[PERSIST] Saved project {self.project_id} ({len(binary_blob)} bytes)")
        # In production: await supabase.table("projects").update({"otio_binary": binary_blob}).eq("id", self.project_id)

    async def load_from_db(self):
        """Load state from DB (Simulated)"""
        # In production: row = await supabase.select...
        print(f"[PERSIST] Loaded project {self.project_id}")

class CollaborationService:
    """
    Service to manage multiple collaborative sessions.
    Integrates Human (WebSocket) and Agent (Direct) edits.
    """
    def __init__(self):
        self.sessions: Dict[str, CollaborativeTimeline] = {}

    async def get_or_create_session(self, project_id: str) -> CollaborativeTimeline:
        if project_id not in self.sessions:
            session = CollaborativeTimeline(project_id)
            await session.load_from_db()
            self.sessions[project_id] = session
        return self.sessions[project_id]

    async def handle_agent_action(self, project_id: str, action: Dict[str, Any]):
        """
        Allows an AI agent to perform edits on the live timeline.
        Translates 'high level' actions to Yjs mutations.
        """
        session = await self.get_or_create_session(project_id)
        
        # 1. Access Data via Schema
        # For simplicity in Phase 2, we regenerate OTIO, modify, and push back.
        # Ideally we modify Y structures directly, but OTIO API is easier for logic.
        
        timeline = session.to_otio()
        
        if action["type"] == "add_clip":
            track_idx = action.get("track", 0)
            
            # Ensure track exists
            while len(timeline.tracks) <= track_idx:
                timeline.tracks.append(otio.schema.Track(name=f"Track {len(timeline.tracks)}"))
                
            track = timeline.tracks[track_idx]
            
            clip = otio.schema.Clip(
                name=action["name"],
                media_reference=otio.schema.ExternalReference(target_url=action["url"]),
                source_range=otio.opentime.TimeRange(
                    start_time=otio.opentime.RationalTime(float(action["start"]) * 24, 24),
                    duration=otio.opentime.RationalTime(float(action["duration"]) * 24, 24)
                )
            )
            # Add metadata for stability
            clip.metadata["flowai_id"] = str(action.get("id"))
            
            track.append(clip)
            print(f"[COLLAB] Agent added clip '{action['name']}' to Track {track_idx}")

        # Sync back to YDoc
        otio_to_yjs(timeline, session.doc)
        
        # Auto-save
        await session.save_to_db()
        return {"status": "success", "project_id": project_id}

collaboration_service = CollaborationService()
