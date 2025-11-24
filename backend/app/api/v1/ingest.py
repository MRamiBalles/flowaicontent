from fastapi import APIRouter, HTTPException
from app.schemas.ingest import ContextIngestRequest, ContextIngestResponse
import uuid

router = APIRouter()

@router.post("/ingest", response_model=ContextIngestResponse)
async def ingest_context(request: ContextIngestRequest):
    """
    Ingesta de contexto multimodal (simulada por ahora).
    Aquí es donde el LRM procesaría el input para generar embeddings o estructuras.
    """
    # Process with LRM
    from app.services.lrm_service import lrm_service
    from app.services.compass import compass_service
    from app.services.video_engine import video_engine
    
    result = await lrm_service.process_context(request.content)
    
    # Run COMPASS Analysis
    compass_metrics = await compass_service.analyze_output(result["summary"])
    
    # 3. Video Generation (The Magic)
    # Only generate video if content is verified safe
    video_result = None
    if compass_metrics["verification_status"] == "verified":
        video_result = await video_engine.process_scene(request.content[:200]) # Use first 200 chars as prompt
    
    ingestion_id = str(uuid.uuid4())
    
    return ContextIngestResponse(
        ingestion_id=ingestion_id,
        status="processed",
        processed_tokens=result.get("input_length", 0),
        summary=f"Processed by LRM (Linear+MoE). Output shape: {result.get('output_shape')}",
        compass_metrics=compass_metrics,
        video_result=video_result
    )
