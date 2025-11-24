from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class ContextIngestRequest(BaseModel):
    source_type: str  # 'text', 'script', 'repo', 'video_clip'
    content: str
    metadata: Optional[Dict[str, Any]] = None
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class ContextIngestRequest(BaseModel):
    source_type: str  # 'text', 'script', 'repo', 'video_clip'
    content: str
    metadata: Optional[Dict[str, Any]] = None

class ContextIngestResponse(BaseModel):
    ingestion_id: str
    status: str
    processed_tokens: int
    summary: Optional[str] = None
    compass_metrics: Optional[Dict[str, Any]] = None
    video_result: Optional[Dict[str, Any]] = None
