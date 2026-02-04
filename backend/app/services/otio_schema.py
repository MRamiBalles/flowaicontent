import opentimelineio as otio
from typing import Dict, Any, List
import uuid
# In production, import y_py as Y. Here we use our mock.
from app.services.mock_yjs import YDoc, YMap, YArray

def otio_to_yjs(timeline: otio.schema.Timeline, doc: YDoc):
    """
    Converts an OTIO Timeline into a Y.Doc structure.
    Root: "tracks" (YArray)
    """
    y_tracks = doc.get_array("tracks")
    
    # Clear existing if any (simplification for overwrite sync)
    # y_tracks.delete(0, len(y_tracks)) 
    
    for track in timeline.tracks:
        y_track = YMap()
        y_track["name"] = track.name
        y_track["kind"] = track.kind
        
        y_clips = YArray()
        for item in track:
            if isinstance(item, otio.schema.Clip):
                y_clip = YMap()
                # Generate stable UUID if not present in metadata
                clip_id = item.metadata.get("flowai_id") or str(uuid.uuid4())
                y_clip["_id"] = clip_id
                y_clip["name"] = item.name
                y_clip["media_url"] = item.media_reference.target_url if item.media_reference else ""
                
                # Time range (RationalTime)
                tr = item.source_range
                if tr:
                    y_clip["start"] = tr.start_time.value / tr.start_time.rate
                    y_clip["duration"] = tr.duration.value / tr.duration.rate
                else:
                    y_clip["start"] = 0.0
                    y_clip["duration"] = 5.0 # Default
                
                y_clips.append(y_clip)
                
        y_track["clips"] = y_clips
        y_tracks.append(y_track)

def yjs_to_otio(doc: YDoc) -> otio.schema.Timeline:
    """
    Reconstructs an OTIO Timeline from Y.Doc state.
    """
    timeline = otio.schema.Timeline(name="Collaborative Timeline")
    stack = otio.schema.Stack()
    timeline.tracks = stack
    
    y_tracks = doc.get_array("tracks")
    
    # In MockYArray, iterating gives the items
    for i in range(len(y_tracks)):
        y_track_map = y_tracks[i] # YMap
        # Convert YMap to dict for easier access if using Mock
        t_data = y_track_map.to_json() if hasattr(y_track_map, 'to_json') else y_track_map
        
        track = otio.schema.Track(name=t_data.get("name", "Track"), kind=t_data.get("kind", "Video"))
        
        y_clips = t_data.get("clips", [])
        for c_data in y_clips:
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
