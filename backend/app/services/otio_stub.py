# Lightweight stub for OpenTimelineIO to bypass build failures on newer Python versions (3.14+)
# and environments with limited C++ toolchains.

class RationalTime:
    def __init__(self, value=0, rate=24):
        self.value = value
        self.rate = rate
    
    def to_dict(self):
        return {
            "OTIO_SCHEMA": "RationalTime.1",
            "value": self.value,
            "rate": self.rate
        }

class TimeRange:
    def __init__(self, start_time=None, duration=None):
        self.start_time = start_time or RationalTime()
        self.duration = duration or RationalTime()
    
    def to_dict(self):
        return {
            "OTIO_SCHEMA": "TimeRange.1",
            "start_time": self.start_time.to_dict(),
            "duration": self.duration.to_dict()
        }

class ExternalReference:
    def __init__(self, target_url=""):
        self.target_url = target_url
    
    def to_dict(self):
        return {
            "OTIO_SCHEMA": "ExternalReference.1",
            "target_url": self.target_url,
            "metadata": {}
        }

class Clip:
    def __init__(self, name="", media_reference=None, source_range=None):
        self.name = name
        self.media_reference = media_reference or ExternalReference()
        self.source_range = source_range or TimeRange()
        self.metadata = {}
    
    def to_dict(self):
        return {
            "OTIO_SCHEMA": "Clip.1",
            "name": self.name,
            "media_reference": self.media_reference.to_dict(),
            "source_range": self.source_range.to_dict(),
            "metadata": self.metadata
        }

class Track:
    def __init__(self, name="", kind="Video"):
        self.name = name
        self.kind = kind
        self.items = []
        
    def append(self, item):
        self.items.append(item)
    
    def __iter__(self):
        return iter(self.items)
    
    def __len__(self):
        return len(self.items)
    
    def __getitem__(self, idx):
        return self.items[idx]
    
    def to_dict(self):
        return {
            "OTIO_SCHEMA": "Track.1",
            "name": self.name,
            "kind": self.kind,
            "children": [item.to_dict() for item in self.items],
            "metadata": {}
        }

class Stack:
    def __init__(self):
        self.tracks = []
    
    def append(self, track):
        self.tracks.append(track)
    
    def __iter__(self):
        return iter(self.tracks)
    
    def __len__(self):
        return len(self.tracks)

    def __getitem__(self, idx):
        return self.tracks[idx]
    
    def to_dict(self):
        return {
            "OTIO_SCHEMA": "Stack.1",
            "children": [t.to_dict() for t in self.tracks],
            "metadata": {}
        }

class Timeline:
    def __init__(self, name=""):
        self.name = name
        self.tracks = Stack()
    
    def to_dict(self):
        return {
            "OTIO_SCHEMA": "Timeline.1",
            "name": self.name,
            "tracks": self.tracks.to_dict(),
            "metadata": {}
        }

schema = type('obj', (object,), {
    'Timeline': Timeline,
    'Track': Track,
    'Clip': Clip,
    'Stack': Stack,
    'ExternalReference': ExternalReference
})

opentime = type('obj', (object,), {
    'RationalTime': RationalTime,
    'TimeRange': TimeRange
})
