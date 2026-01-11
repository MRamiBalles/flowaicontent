"""
Linear Video Platform API Router
FastAPI endpoints for Mamba SSM, NABLA Video, and Valsci services
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum
import uuid

from ..services.mamba_ssm_service import mamba_service, AttentionMode
from ..services.nabla_video_service import nabla_service, VideoResolution
from ..services.valsci_verification_service import valsci_service


router = APIRouter(prefix="/linear", tags=["Linear Video Platform"])


# ==========================================
# Request/Response Models
# ==========================================

class AttentionModeEnum(str, Enum):
    FULL = "full"
    LINEAR = "linear"
    RING = "ring"
    SPARSE_BLOCK = "sparse_block"
    MAMBA_SSM = "mamba_ssm"
    TTT = "ttt"


class VideoResolutionEnum(str, Enum):
    SD_480P = "480p"
    HD_720P = "720p"
    FHD_1080P = "1080p"
    QHD_1440P = "1440p"
    UHD_4K = "4k"


class InitSequenceRequest(BaseModel):
    video_id: str
    total_frames: int = Field(ge=1, le=100000)
    attention_mode: AttentionModeEnum = AttentionModeEnum.MAMBA_SSM


class ProcessChunkRequest(BaseModel):
    frame_features: List[float] = Field(min_length=1, max_length=4096)
    use_ttt: bool = False


class GenerateVideoRequest(BaseModel):
    prompt: str = Field(min_length=10, max_length=1000)
    negative_prompt: str = ""
    resolution: VideoResolutionEnum = VideoResolutionEnum.FHD_1080P
    duration_seconds: float = Field(ge=1.0, le=30.0, default=5.0)
    fps: int = Field(ge=12, le=60, default=24)
    guidance_scale: float = Field(ge=1.0, le=20.0, default=7.5)
    num_inference_steps: int = Field(ge=10, le=100, default=50)
    seed: Optional[int] = None


class VerifyContentRequest(BaseModel):
    video_id: str
    transcript: str = Field(min_length=50)
    creator_id: str


class InitSequenceResponse(BaseModel):
    sequence_id: str
    status: str
    total_frames: int
    attention_mode: str
    memory_usage_mb: float
    context_window: int


class ComplexityComparisonResponse(BaseModel):
    sequence_length: int
    comparisons: Dict[str, Any]
    recommendation: Dict[str, str]


# ==========================================
# Mamba SSM Endpoints
# ==========================================

@router.post("/mamba/sequence/init", response_model=InitSequenceResponse)
async def init_video_sequence(request: InitSequenceRequest):
    """
    Initialize a video sequence for SSM processing.
    Returns sequence ID for subsequent chunk processing.
    """
    try:
        mode_map = {
            AttentionModeEnum.FULL: AttentionMode.FULL_ATTENTION,
            AttentionModeEnum.LINEAR: AttentionMode.LINEAR_ATTENTION,
            AttentionModeEnum.RING: AttentionMode.RING_ATTENTION,
            AttentionModeEnum.SPARSE_BLOCK: AttentionMode.SPARSE_BLOCK,
            AttentionModeEnum.MAMBA_SSM: AttentionMode.MAMBA_SSM,
            AttentionModeEnum.TTT: AttentionMode.TTT_LAYERS,
        }
        
        state = await mamba_service.initialize_video_sequence(
            video_id=request.video_id,
            total_frames=request.total_frames,
            attention_mode=mode_map[request.attention_mode]
        )
        
        return InitSequenceResponse(
            sequence_id=state.sequence_id,
            status="initialized",
            total_frames=state.total_frames,
            attention_mode=state.attention_mode.value,
            memory_usage_mb=state.memory_usage_mb,
            context_window=state.context_window
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/mamba/sequence/{sequence_id}/process")
async def process_video_chunk(sequence_id: str, request: ProcessChunkRequest):
    """
    Process a chunk of video frames through the SSM backbone.
    Returns processed features with complexity metrics.
    """
    try:
        result = await mamba_service.process_video_chunk(
            sequence_id=sequence_id,
            frame_features=request.frame_features,
            use_ttt=request.use_ttt
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/mamba/complexity/{sequence_length}", response_model=ComplexityComparisonResponse)
async def get_complexity_comparison(sequence_length: int):
    """
    Compare computational complexity across architectures for given sequence length.
    """
    if sequence_length < 1 or sequence_length > 1000000:
        raise HTTPException(status_code=400, detail="Sequence length must be between 1 and 1,000,000")
    
    result = await mamba_service.get_complexity_comparison(sequence_length)
    return result


@router.get("/mamba/sequence/{sequence_id}/causal-cone")
async def get_causal_cone(sequence_id: str):
    """
    Get causal cone visualization data for a sequence.
    Shows how information flows through the SSM hidden state.
    """
    try:
        return await mamba_service.get_causal_cone_visualization(sequence_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/mamba/sequence/{sequence_id}")
async def cleanup_sequence(sequence_id: str):
    """Clean up a completed sequence to free resources."""
    success = await mamba_service.cleanup_sequence(sequence_id)
    if not success:
        raise HTTPException(status_code=404, detail="Sequence not found")
    return {"status": "cleaned", "sequence_id": sequence_id}


# ==========================================
# NABLA Video Generation Endpoints
# ==========================================

@router.post("/nabla/generate")
async def create_video_generation_job(request: GenerateVideoRequest, background_tasks: BackgroundTasks):
    """
    Create a new video generation job using NABLA block-sparse attention.
    Returns job ID for status tracking.
    """
    resolution_map = {
        VideoResolutionEnum.SD_480P: VideoResolution.SD_480P,
        VideoResolutionEnum.HD_720P: VideoResolution.HD_720P,
        VideoResolutionEnum.FHD_1080P: VideoResolution.FHD_1080P,
        VideoResolutionEnum.QHD_1440P: VideoResolution.QHD_1440P,
        VideoResolutionEnum.UHD_4K: VideoResolution.UHD_4K,
    }
    
    job = await nabla_service.create_generation_job(
        prompt=request.prompt,
        negative_prompt=request.negative_prompt,
        resolution=resolution_map[request.resolution],
        duration_seconds=request.duration_seconds,
        fps=request.fps,
        guidance_scale=request.guidance_scale,
        num_inference_steps=request.num_inference_steps,
        seed=request.seed
    )
    
    return {
        "job_id": job.job_id,
        "status": job.status.value,
        "resolution": f"{job.resolution.value[0]}x{job.resolution.value[1]}",
        "total_steps": job.total_steps,
        "estimated_time_seconds": job.total_steps * 0.5  # Rough estimate
    }


@router.get("/nabla/job/{job_id}/status")
async def get_job_status(job_id: str):
    """Get current status of a video generation job."""
    if job_id not in nabla_service.active_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = nabla_service.active_jobs[job_id]
    return {
        "job_id": job.job_id,
        "status": job.status.value,
        "progress_percent": job.progress_percent,
        "current_step": job.current_step,
        "total_steps": job.total_steps,
        "result_url": job.result_url
    }


@router.get("/nabla/job/{job_id}/efficiency")
async def get_job_efficiency_report(job_id: str):
    """
    Get detailed efficiency report showing NABLA speedup vs full attention.
    """
    try:
        return await nabla_service.get_efficiency_report(job_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/nabla/job/{job_id}/entropy")
async def get_job_entropy_data(job_id: str):
    """
    Get entropy screen data for visualization.
    Shows compression and information density across frames.
    """
    try:
        return await nabla_service.get_entropy_screen_data(job_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/nabla/styles")
async def get_available_styles():
    """Get list of available video generation styles."""
    return await nabla_service.get_available_styles()


# ==========================================
# Valsci Verification Endpoints
# ==========================================

@router.post("/valsci/verify")
async def verify_video_content(request: VerifyContentRequest):
    """
    Verify claims in video content and calculate Evidence Score.
    Returns verification report with token reward multiplier.
    """
    report = await valsci_service.verify_video_content(
        video_id=request.video_id,
        transcript=request.transcript,
        creator_id=request.creator_id
    )
    
    return {
        "video_id": report.video_id,
        "total_claims": report.total_claims,
        "verified_claims": report.verified_claims,
        "partially_verified_claims": report.partially_verified_claims,
        "unverified_claims": report.unverified_claims,
        "disputed_claims": report.disputed_claims,
        "overall_evidence_score": report.overall_evidence_score,
        "overall_credibility": report.overall_credibility,
        "token_reward_multiplier": report.token_reward_multiplier,
        "created_at": report.created_at.isoformat()
    }


@router.get("/valsci/video/{video_id}/monetization")
async def get_monetization_metrics(video_id: str):
    """
    Get monetization metrics based on verification results.
    Shows potential earnings and reward multiplier.
    """
    metrics = await valsci_service.get_monetization_metrics(video_id)
    if "error" in metrics:
        raise HTTPException(status_code=404, detail=metrics["error"])
    return metrics


@router.get("/valsci/video/{video_id}/claim/{claim_id}")
async def get_claim_details(video_id: str, claim_id: str):
    """
    Get detailed verification result for a specific claim.
    Includes supporting and contradicting sources.
    """
    result = await valsci_service.get_claim_details(video_id, claim_id)
    if not result:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    return {
        "claim_id": result.claim_id,
        "status": result.status.value,
        "evidence_strength": result.evidence_strength.value,
        "evidence_score": result.evidence_score,
        "bibliometric_score": result.bibliometric_score,
        "explanation": result.explanation,
        "supporting_sources_count": len(result.supporting_sources),
        "contradicting_sources_count": len(result.contradicting_sources),
        "verified_at": result.verified_at.isoformat()
    }


@router.get("/valsci/auditor-node")
async def get_auditor_node_info():
    """
    Get information about running an Auditor Node.
    Includes staking requirements, rewards, and current network stats.
    """
    return await valsci_service.get_auditor_node_info()


# ==========================================
# Health Check
# ==========================================

@router.get("/health")
async def health_check():
    """Check health of Linear Video Platform services."""
    return {
        "status": "healthy",
        "services": {
            "mamba_ssm": "active",
            "nabla_video": "active",
            "valsci": "active"
        },
        "active_sequences": len(mamba_service.active_sequences),
        "active_jobs": len(nabla_service.active_jobs),
        "active_verifications": len(valsci_service.active_verifications)
    }
