from typing import Any, Dict, List, Optional
import json
import uuid

# Mock implementations of y-py classes
class YMap:
    def __init__(self, initial: Dict = None):
        self._data = initial or {}
    
    def get(self, key: str) -> Any:
        val = self._data.get(key)
        if isinstance(val, dict) and not isinstance(val, YMap):
            return YMap(val) # Auto-wrap for convenience in tests
        return val

    def __setitem__(self, key: str, value: Any):
        self._data[key] = value

    def to_json(self) -> Dict:
        # Recursively convert to JSON-compatible dicts
        out = {}
        for k, v in self._data.items():
            if isinstance(v, YMap):
                out[k] = v.to_json()
            elif isinstance(v, YArray):
                out[k] = v.to_json()
            else:
                out[k] = v
        return out

class YArray:
    def __init__(self, initial: List = None):
        self._data = initial or []
    
    def insert(self, index: int, value: Any):
        # In real Yjs, 'value' might be a complex type. 
        # Here we just append/insert.
        self._data.insert(index, value)

    def delete(self, index: int, length: int = 1):
        del self._data[index:index+length]
    
    def __len__(self):
        return len(self._data)
    
    def __getitem__(self, index: int):
        return self._data[index]

    def to_json(self) -> List:
        out = []
        for v in self._data:
            if isinstance(v, YMap):
                out.append(v.to_json())
            elif isinstance(v, YArray):
                out.append(v.to_json())
            else:
                out.append(v)
        return out

    def append(self, value):
        self._data.append(value)

class YDoc:
    def __init__(self):
        self._maps: Dict[str, YMap] = {}
        self._arrays: Dict[str, YArray] = {}
        self.client_id = 12345 # Mock ID

    def get_map(self, name: str) -> YMap:
        if name not in self._maps:
            self._maps[name] = YMap()
        return self._maps[name]

    def get_array(self, name: str) -> YArray:
        if name not in self._arrays:
            self._arrays[name] = YArray()
        return self._arrays[name]

    def transact(self):
        # Context manager for transactions
        return self

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        pass

def encode_state_as_update(doc: YDoc, vector: Any = None) -> bytes:
    # Serialize the whole doc state to JSON bytes for "persistence" simulation
    state = {
        "maps": {k: v.to_json() for k, v in doc._maps.items()},
        "arrays": {k: v.to_json() for k, v in doc._arrays.items()}
    }
    return json.dumps(state).encode("utf-8")

def apply_update(doc: YDoc, update: bytes):
    # Restore state from JSON bytes
    state = json.loads(update.decode("utf-8"))
    for k, v in state.get("maps", {}).items():
        doc._maps[k] = YMap(v)
    for k, v in state.get("arrays", {}).items():
        doc._arrays[k] = YArray(v)

# Alias for compatibility
class Y:
    Doc = YDoc
