"""
Social Media Export API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List

from app.services.social_export import SocialMediaExporter

router = APIRouter(prefix="/export", tags=["export"])

class ExportRequest(BaseModel):
    video_id: str
    platforms: List[str]  # ['tiktok', 'instagram', 'youtube_shorts']
    add_captions: bool = True
    add_watermark: bool = True

@router.post("/social")
async def export_for_social_media(
    request: ExportRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Export video for social media platforms"""
    
    user_id = current_user["id"]
    
    # Get video
    video = await db.videos.find_one({"id": request.video_id, "user_id": user_id})
    
    if not video:
        raise HTTPException(404, "Video not found")
    
    # Check tier (free users get watermark)
    user = await db.users.find_one({"id": user_id})
    tier = user.get("tier", "free")
    
    if tier == "free":
        request.add_watermark = True  # Force watermark for free users
    
    # Start export in background
    background_tasks.add_task(
        process_social_export,
        video_id=request.video_id,
        platforms=request.platforms,
        add_captions=request.add_captions,
        add_watermark=request.add_watermark,
        user_id=user_id,
        db=db
    )
    
    return {
        "success": True,
        "message": "Export started in background",
        "job_id": f"export_{request.video_id}",
        "estimated_time": "30-60 seconds"
    }

@router.get("/status/{job_id}")
async def get_export_status(
    job_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get export job status"""
    
    job = await db.export_jobs.find_one({"id": job_id, "user_id": current_user["id"]})
    
    if not job:
        raise HTTPException(404, "Export job not found")
    
    return {
        "status": job.get("status"),  # 'processing', 'completed', 'failed'
        "progress": job.get("progress", 0),
        "results": job.get("results", {}),
        "error": job.get("error")
    }

async def process_social_export(
    video_id: str,
    platforms: List[str],
    add_captions: bool,
    add_watermark: bool,
    user_id: str,
    db
):
    """Background task to process export"""
    
    job_id = f"export_{video_id}"
    
    try:
        # Create job record
        await db.export_jobs.create({
            "id": job_id,
            "user_id": user_id,
            "video_id": video_id,
            "status": "processing",
            "progress": 0
        })
        
        # Get video file path
        video = await db.videos.find_one({"id": video_id})
        video_path = video["file_path"]
        
        # Process exports
        exporter = SocialMediaExporter()
        results = {}
        
        for idx, platform in enumerate(platforms):
            # Update progress
            progress = int((idx / len(platforms)) * 100)
            await db.export_jobs.update(
                {"id": job_id},
                {"$set": {"progress": progress}}
            )
            
            # Export
            output_path = f"exports/{user_id}/{video_id}_{platform}.mp4"
            
            if platform == "tiktok":
                path = exporter.export_for_tiktok(
                    video_path,
                    output_path,
                    add_captions=add_captions,
                    add_watermark=add_watermark
                )
            elif platform == "instagram":
                path = exporter.export_for_instagram(
                    video_path,
                    output_path,
                    add_captions=add_captions,
                    add_watermark=add_watermark
                )
            
            # Upload to S3 and get URL
            s3_url = await upload_to_s3(path)
            results[platform] = s3_url
        
        # Mark complete
        await db.export_jobs.update(
            {"id": job_id},
            {
                "$set": {
                    "status": "completed",
                    "progress": 100,
                    "results": results
                }
            }
        )
        
    except Exception as e:
        # Mark failed
        await db.export_jobs.update(
            {"id": job_id},
            {
                "$set": {
                    "status": "failed",
                    "error": str(e)
                }
            }
        )

async def upload_to_s3(file_path: str) -> str:
    """Upload file to S3 and return URL"""
    # TODO: Implement S3 upload
    return f"https://cdn.flowai.com/{file_path}"

def get_current_user():
    pass

def get_database():
    pass
