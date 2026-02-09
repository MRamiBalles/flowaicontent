# Lightweight stub for OpenTimelineIO to bypass build failures on newer Python versions (3.14+)
# and environments with limited C++ toolchains.

class RationalTime:
    def __init__(self, value=0, rate=24):
        self.value = value
        self.rate = rate

class TimeRange:
    def __init__(self, start_time=None, duration=None):
        self.start_time = start_time or RationalTime()
        self.duration = duration or RationalTime()

class ExternalReference:
    def __init__(self, target_url=""):
        self.target_url = target_url

class Clip:
    def __init__(self, name="", media_reference=None, source_range=None):
        self.name = name
        self.media_reference = media_reference or ExternalReference()
        self.source_range = source_range or TimeRange()
        self.metadata = {}

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

class Timeline:
    def __init__(self, name=""):
        self.name = name
        self.tracks = Stack()

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
