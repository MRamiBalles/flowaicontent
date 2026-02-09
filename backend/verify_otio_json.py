import json
from app.services.otio_stub import Timeline, Track, Clip, ExternalReference, RationalTime, TimeRange

def verify_otio_json():
    print("--- OTIO JSON COMPLIANCE CHECK (EU DATA ACT) ---")
    
    # 1. Create a complex timeline
    tl = Timeline(name="Compliance Test")
    v_track = Track(name="Video 1", kind="Video")
    clip = Clip(name="Clip 1")
    clip.media_reference = ExternalReference(target_url="http://flowai.io/asset.mp4")
    clip.source_range = TimeRange(
        start_time=RationalTime(0, 24),
        duration=RationalTime(120, 24)
    )
    v_track.append(clip)
    tl.tracks.append(v_track)
    
    # 2. Serialize to dict
    otio_dict = tl.to_dict()
    
    # 3. Validate Schema Headers (Strict for 2026 Portability)
    required_schemas = [
        "Timeline.1",
        "Stack.1",
        "Track.1",
        "Clip.1",
        "ExternalReference.1",
        "TimeRange.1",
        "RationalTime.1"
    ]
    
    # Helper to find schemas in dict recursively
    found_schemas = []
    def find_schemas(d):
        if isinstance(d, dict):
            if "OTIO_SCHEMA" in d:
                found_schemas.append(d["OTIO_SCHEMA"])
            for v in d.values():
                find_schemas(v)
        elif isinstance(d, list):
            for i in d:
                find_schemas(i)
    
    find_schemas(otio_dict)
    
    print(f"Serialized JSON Snapshot:\n{json.dumps(otio_dict, indent=2)}")
    
    missing = [s for s in required_schemas if s not in found_schemas]
    if not missing:
        print("\nSUCCESS: All required OTIO_SCHEMA headers found.")
    else:
        print(f"\nFAILURE: Missing schemas: {missing}")
        exit(1)

if __name__ == "__main__":
    verify_otio_json()
