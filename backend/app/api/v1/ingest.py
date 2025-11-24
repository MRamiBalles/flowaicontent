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
    
    result = lrm_service.process_context(request.content)
    
    # Run COMPASS Analysis
    compass_metrics = compass_service.analyze_output(
        context_tokens=result.get("input_length", 0),
        output_logits=result.get("sample_logits", [])
    )
    
    ingestion_id = str(uuid.uuid4())
    
    return ContextIngestResponse(
        ingestion_id=ingestion_id,
        status="processed",
        processed_tokens=result.get("input_length", 0),
        summary=f"Processed by LRM (Linear+MoE). Output shape: {result.get('output_shape')}",
        compass_metrics=compass_metrics
    )
