from typing import Dict, List, Any, Optional
import json
import asyncio
from datetime import datetime
try:
    import opentimelineio as otio
except ImportError:
    from app.services import otio_stub as otio

from pycrdt import Doc, Map, Array

from app.services.otio_schema import otio_to_yjs, yjs_to_otio

class CollaborativeTimeline:
    """
    Manages a single collaborative video editing session using pycrdt.
    Acts as the Authoritative Server State.
    """
    def __init__(self, project_id: str):
        self.project_id = project_id
        self.doc = Doc()
        
        if "tracks" not in self.doc:
            with self.doc.transaction():
                self.doc["tracks"] = Array()
        
        y_tracks = self.doc["tracks"]
        if len(y_tracks) == 0:
            # Create default OTIO structure
            timeline = otio.schema.Timeline(name=f"Project {project_id}")
            timeline.tracks.append(otio.schema.Track(name="Default Track"))
            otio_to_yjs(timeline, self.doc)
            
        self.active_users: Dict[str, Any] = {} # user_id -> awareness state

    def get_update(self) -> bytes:
        """Get the full state update to send to new clients"""
        return self.doc.get_update()

    def apply_update(self, update: bytes):
        """Apply an update from a client"""
        self.doc.apply_update(update)

    def to_otio(self) -> otio.schema.Timeline:
        """Export current state to OTIO"""
        return yjs_to_otio(self.doc)

    async def save_to_db(self):
        """Persist state to DB (Simulated with actual binary update)"""
        binary_blob = self.doc.get_update()
        print(f"[PERSIST] Saved project {self.project_id} ({len(binary_blob)} bytes)")
        # In production: await supabase.table("projects").update({"otio_binary": list(binary_blob)}).eq("id", self.project_id)

    async def load_from_db(self, binary_data: Optional[bytes] = None):
        """Load state from DB (Simulated)"""
        if binary_data:
            self.doc.apply_update(binary_data)
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
        Translates 'high level' actions to CRDT mutations.
        """
        session = await self.get_or_create_session(project_id)
        
        # 1. Access Data via Schema
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

        # Sync back to Doc
        otio_to_yjs(timeline, session.doc)
        
        # Auto-save
        await session.save_to_db()
        return {"status": "success", "project_id": project_id}

collaboration_service = CollaborationService()
