import opentimelineio as otio
from typing import Dict, List, Any
import json
import asyncio
from datetime import datetime

class CollaborativeTimeline:
    """
    Manages a single collaborative video editing session.
    Uses OTIO for state and handles CRDT-like updates.
    """
    def __init__(self, project_id: str):
        self.project_id = project_id
        self.timeline = otio.schema.Timeline(name=f"Project {project_id}")
        self.tracks = otio.schema.Stack()
        self.timeline.tracks = self.tracks
        self.active_users: Dict[str, Dict[str, Any]] = {} # user_id -> presence info
        
    def add_clip(self, track_index: int, name: str, media_reference: str, start_time: float, duration: float):
        """
        Adds a clip to the timeline. Standard OTIO operation.
        """
        video_track = None
        if len(self.tracks) <= track_index:
            video_track = otio.schema.Track(name=f"Track {track_index}", kind=otio.schema.TrackKind.Video)
            self.tracks.append(video_track)
        else:
            video_track = self.tracks[track_index]
            
        clip = otio.schema.Clip(
            name=name,
            media_reference=otio.schema.ExternalReference(target_url=media_reference),
            source_range=otio.opentime.TimeRange(
                start_time=otio.opentime.RationalTime(start_time, 24),
                duration=otio.opentime.RationalTime(duration, 24)
            )
        )
        video_track.append(clip)
        return clip

    def to_json(self) -> str:
        return otio.adapters.write_to_string(self.timeline, adapter_name="otio_json")

class CollaborationService:
    """
    Service to manage multiple collaborative sessions.
    2026 Gold Standard: Supports AI agents as first-class citizens in the session.
    """
    def __init__(self):
        self.sessions: Dict[str, CollaborativeTimeline] = {}

    async def get_or_create_session(self, project_id: str) -> CollaborativeTimeline:
        if project_id not in self.sessions:
            # In production, load from DB
            self.sessions[project_id] = CollaborativeTimeline(project_id)
        return self.sessions[project_id]

    async def handle_agent_action(self, project_id: str, action: Dict[str, Any]):
        """
        Allows an AI agent to perform edits on the live timeline.
        """
        session = await self.get_or_create_session(project_id)
        
        if action["type"] == "add_clip":
            session.add_clip(
                track_index=action.get("track", 0),
                name=action["name"],
                media_reference=action["url"],
                start_time=action["start"],
                duration=action["duration"]
            )
            print(f"[COLLAB] Agent added clip '{action['name']}' to project {project_id}")

collaboration_service = CollaborationService()
