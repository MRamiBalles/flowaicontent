from fastapi import APIRouter
from app.schemas.ingest import ContextIngestRequest, ContextIngestResponse
from app.services.lrm_service import lrm_service
from app.services.compass import compass_service
from app.services.video_engine import video_engine
import uuid

router = APIRouter()

@router.post("/ingest", response_model=ContextIngestResponse)
async def ingest_context(request: ContextIngestRequest):
    # 1. LRM Processing (Reasoning)
    processed_data = await lrm_service.process_context(request.content)
    
    # 2. COMPASS Analysis (Safety)
    compass_metrics = await compass_service.analyze_output(processed_data["summary"])
    
    # 3. Video Generation (The Magic)
    # Only generate video if content is verified safe
    video_result = None
    if compass_metrics["verification_status"] == "verified":
        video_result = await video_engine.process_scene(request.content[:200]) # Use first 200 chars as prompt
    
    return ContextIngestResponse(
        ingestion_id="ingest_" + str(hash(request.content)),
        status="processed",
        summary=processed_data["summary"],
        processed_tokens=processed_data["processed_tokens"],
        compass_metrics=compass_metrics,
        video_result=video_result
    )
