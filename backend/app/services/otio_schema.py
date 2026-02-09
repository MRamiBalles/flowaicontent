try:
    import opentimelineio as otio
except ImportError:
    from app.services import otio_stub as otio

from typing import Dict, Any, List
import uuid
import pycrdt
from pycrdt import Doc, Map, Array

def otio_to_yjs(timeline: otio.schema.Timeline, doc: Doc):
    """
    Converts an OTIO Timeline into a Y.Doc structure using pycrdt.
    Root: "tracks" (Array)
    """
    y_tracks = doc.get_array("tracks")
    
    with doc.transaction():
        # Clear existing if any for overwrite sync
        if len(y_tracks) > 0:
            y_tracks.clear()
        
        for track in timeline.tracks:
            # Create track map
            y_track = Map({
                "name": track.name,
                "kind": track.kind,
                "clips": Array()
            })
            
            y_clips = y_track["clips"]
            for item in track:
                if isinstance(item, otio.schema.Clip):
                    # Generate stable UUID if not present
                    clip_id = item.metadata.get("flowai_id") or str(uuid.uuid4())
                    
                    # Time range calculation
                    tr = item.source_range
                    start = tr.start_time.value / tr.start_time.rate if tr else 0.0
                    duration = tr.duration.value / tr.duration.rate if tr else 5.0
                    
                    y_clip = Map({
                        "_id": clip_id,
                        "name": item.name,
                        "media_url": item.media_reference.target_url if item.media_reference else "",
                        "start": start,
                        "duration": duration
                    })
                    y_clips.append(y_clip)
                    
            y_tracks.append(y_track)

def yjs_to_otio(doc: Doc) -> otio.schema.Timeline:
    """
    Reconstructs an OTIO Timeline from Doc state using pycrdt.
    """
    timeline = otio.schema.Timeline(name="Collaborative Timeline")
    stack = otio.schema.Stack()
    timeline.tracks = stack
    
    y_tracks = doc.get_array("tracks")
    
    # pycrdt Array is iterable
    for y_track_map in y_tracks:
        # y_track_map is a Map instance
        track = otio.schema.Track(
            name=y_track_map.get("name", "Track"), 
            kind=y_track_map.get("kind", "Video")
        )
        
        y_clips = y_track_map.get("clips")
        if y_clips:
            for c_data in y_clips:
                # c_data is a Map
                clip = otio.schema.Clip(name=c_data.get("name", "Clip"))
                clip.media_reference = otio.schema.ExternalReference(target_url=c_data.get("media_url", ""))
                
                # Reconstruction of metadata
                clip.metadata["flowai_id"] = c_data.get("_id")
                
                start = float(c_data.get("start", 0.0))
                duration = float(c_data.get("duration", 1.0))
                
                clip.source_range = otio.opentime.TimeRange(
                    start_time=otio.opentime.RationalTime(start * 24, 24),
                    duration=otio.opentime.RationalTime(duration * 24, 24)
                )
                track.append(clip)
            
        stack.append(track)
        
    return timeline
