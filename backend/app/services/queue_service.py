"""
Async Job Queue Service using Celery
Handles background tasks like video generation, email sending, and batch processing
"""

from celery import Celery
from typing import Dict, Any, Optional
import os
from datetime import datetime

# Initialize Celery
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
celery_app = Celery(
    "flowai_tasks",
    broker=redis_url,
    backend=redis_url
)

# Configure Celery
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,  # 1 hour max
    task_soft_time_limit=3000,  # 50 minutes soft limit
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)


@celery_app.task(name="send_email", bind=True, max_retries=3)
def send_email_task(self, to_email: str, subject: str, template: str, context: Dict[str, Any]):
    """
    Send email using configured email service
    
    Args:
        to_email: Recipient email address
        subject: Email subject
        template: Email template name
        context: Template context variables
    """
    try:
        from app.services.email_service import send_email
        result = send_email(to_email, subject, template, context)
        return {"status": "sent", "to": to_email, "result": result}
    except Exception as exc:
        # Retry with exponential backoff
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


@celery_app.task(name="generate_video", bind=True, max_retries=2)
def generate_video_task(self, user_id: str, prompt: str, style_pack_id: Optional[str] = None):
    """
    Generate video from text prompt
    
    Args:
        user_id: User ID requesting generation
        prompt: Text prompt for video
        style_pack_id: Optional style pack to apply
    """
    try:
        from app.services.video_generation_service import generate_video
        
        # Update task status
        self.update_state(state="PROCESSING", meta={"progress": 0})
        
        # Generate video
        result = generate_video(user_id, prompt, style_pack_id, task_id=self.request.id)
        
        return {
            "status": "completed",
            "video_url": result["video_url"],
            "thumbnail_url": result["thumbnail_url"],
            "duration": result["duration"]
        }
    except Exception as exc:
        # Retry with longer countdown for video generation
        raise self.retry(exc=exc, countdown=300 * (2 ** self.request.retries))


@celery_app.task(name="batch_generate_videos", bind=True)
def batch_generate_videos_task(self, campaign_id: str, prompts: list):
    """
    Generate multiple videos for marketing campaign
    
    Args:
        campaign_id: Marketing campaign ID
        prompts: List of prompts to generate
    """
    try:
        from app.services.marketing_teams import process_batch_campaign
        
        total = len(prompts)
        results = []
        
        for idx, prompt in enumerate(prompts):
            # Update progress
            progress = int((idx / total) * 100)
            self.update_state(state="PROCESSING", meta={"progress": progress, "current": idx + 1, "total": total})
            
            # Generate video
            result = generate_video_task.delay(campaign_id, prompt)
            results.append(result.id)
        
        return {
            "status": "completed",
            "campaign_id": campaign_id,
            "total_videos": total,
            "task_ids": results
        }
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(name="process_social_export", bind=True)
def process_social_export_task(self, video_id: str, platform: str, options: Dict[str, Any]):
    """
    Export video for social media platform
    
    Args:
        video_id: Video to export
        platform: Target platform (tiktok, instagram, youtube)
        options: Export options (captions, music, etc.)
    """
    try:
        from app.services.social_export import export_for_platform
        
        self.update_state(state="PROCESSING", meta={"progress": 0})
        
        result = export_for_platform(video_id, platform, options, task_id=self.request.id)
        
        return {
            "status": "completed",
            "platform": platform,
            "export_url": result["url"],
            "format": result["format"]
        }
    except Exception as exc:
        raise self.retry(exc=exc, countdown=120)


@celery_app.task(name="send_referral_email")
def send_referral_email_task(referrer_name: str, referrer_email: str, referee_email: str, referral_link: str):
    """
    Send referral invitation email
    
    Args:
        referrer_name: Name of person sending referral
        referrer_email: Email of referrer
        referee_email: Email of person being referred
        referral_link: Unique referral link
    """
    try:
        from app.services.email_service import send_email
        
        context = {
            "referrer_name": referrer_name,
            "referral_link": referral_link,
            "bonus_tokens": 100
        }
        
        send_email(
            to_email=referee_email,
            subject=f"{referrer_name} invited you to FlowAI!",
            template="referral_invitation",
            context=context
        )
        
        return {"status": "sent", "to": referee_email}
    except Exception as exc:
        raise


@celery_app.task(name="upload_to_s3", bind=True, max_retries=3)
def upload_to_s3_task(self, file_path: str, bucket: str, key: str):
    """
    Upload file to AWS S3
    
    Args:
        file_path: Local file path
        bucket: S3 bucket name
        key: S3 object key
    """
    try:
        import boto3
        
        s3_client = boto3.client(
            "s3",
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
        )
        
        # Upload file
        s3_client.upload_file(file_path, bucket, key)
        
        # Generate public URL
        url = f"https://{bucket}.s3.amazonaws.com/{key}"
        
        return {"status": "uploaded", "url": url, "key": key}
    except Exception as exc:
        raise self.retry(exc=exc, countdown=30 * (2 ** self.request.retries))


def get_task_status(task_id: str) -> Dict[str, Any]:
    """
    Get status of a Celery task
    
    Args:
        task_id: Task ID to check
        
    Returns:
        Task status information
    """
    from celery.result import AsyncResult
    
    task = AsyncResult(task_id, app=celery_app)
    
    response = {
        "task_id": task_id,
        "status": task.state,
        "ready": task.ready(),
        "successful": task.successful() if task.ready() else None,
    }
    
    if task.state == "PROCESSING":
        response["meta"] = task.info
    elif task.state == "SUCCESS":
        response["result"] = task.result
    elif task.state == "FAILURE":
        response["error"] = str(task.info)
    
    return response


def cancel_task(task_id: str) -> bool:
    """
    Cancel a running task
    
    Args:
        task_id: Task ID to cancel
        
    Returns:
        True if cancelled successfully
    """
    from celery.result import AsyncResult
    
    task = AsyncResult(task_id, app=celery_app)
    task.revoke(terminate=True)
    
    return True
