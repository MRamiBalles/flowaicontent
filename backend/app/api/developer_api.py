"""
Developer API - FlowAI REST API
Programmatic access to video generation
"""

from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
import uuid
import hashlib
import secrets

router = APIRouter(prefix="/api/v1", tags=["developer-api"])

class GenerateRequest(BaseModel):
    prompt: str
    style: Optional[str] = "cinematic"
    duration: int = 5  # seconds
    resolution: str = "1080p"
    webhook_url: Optional[str] = None  # Notify when complete

class GenerateResponse(BaseModel):
    id: str
    status: str  # 'queued', 'processing', 'completed', 'failed'
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    cost: float
    generation_time: Optional[float] = None
    estimated_completion: Optional[int] = None  # seconds

class APIKey(BaseModel):
    """API key model"""
    id: uuid.UUID
    user_id: uuid.UUID
    key: str  # sk_live_xxxxx or sk_test_xxxxx
    name: str  # User-defined name
    tier: str  # 'starter', 'growth', 'enterprise'
    rate_limit: int  # requests per hour
    is_active: bool = True
    created_at: str

# API Pricing
API_PRICING = {
    "starter": {
        "price_per_gen": 0.10,
        "rate_limit": 100,  # per hour
        "max_duration": 5,
        "max_resolution": "1080p"
    },
    "growth": {
        "price_per_gen": 0.08,  # Volume discount
        "rate_limit": 1000,
        "max_duration": 10,
        "max_resolution": "4k"
    },
    "enterprise": {
        "price_per_gen": 0.05,  # Best rate
        "rate_limit": 10000,
        "max_duration": 30,
        "max_resolution": "4k",
        "dedicated_gpu": True
    }
}

def generate_api_key(user_id: str, environment: str = "live") -> str:
    """Generate API key"""
    prefix = "sk_live_" if environment == "live" else "sk_test_"
    random_part = secrets.token_urlsafe(32)
    return f"{prefix}{random_part}"

async def validate_api_key(api_key: str, db) -> dict:
    """Validate API key and return user info"""
    # Hash the key for DB lookup
    key_hash = hashlib.sha256(api_key.encode()).hexdigest()
    
    key_record = await db.api_keys.find_one({"key_hash": key_hash, "is_active": True})
    
    if not key_record:
        raise HTTPException(401, "Invalid API key")
    
    # Check rate limit
    user = await db.users.find_one({"id": key_record["user_id"]})
    
    return {
        "user_id": key_record["user_id"],
        "tier": key_record["tier"],
        "rate_limit": API_PRICING[key_record["tier"]]["rate_limit"]
    }

@router.post("/generate", response_model=GenerateResponse)
async def api_generate_video(
    request: GenerateRequest,
    authorization: str = Header(...),
    db = Depends(get_database)
):
    """Generate video via API"""
    
    # Extract API key from header (Bearer sk_live_xxxxx)
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Invalid authorization header")
    
    api_key = authorization.replace("Bearer ", "")
    
    # Validate key
    auth_info = await validate_api_key(api_key, db)
    
    # Check tier limits
    tier_config = API_PRICING[auth_info["tier"]]
    
    if request.duration > tier_config["max_duration"]:
        raise HTTPException(400, f"Max duration for {auth_info['tier']} tier is {tier_config['max_duration']}s")
    
    # Calculate cost
    cost = tier_config["price_per_gen"]
    
    # Create generation job
    generation_id = str(uuid.uuid4())
    
    await db.api_generations.create({
        "id": generation_id,
        "user_id": auth_info["user_id"],
        "prompt": request.prompt,
        "style": request.style,
        "duration": request.duration,
        "resolution": request.resolution,
        "cost": cost,
        "status": "queued",
        "webhook_url": request.webhook_url
    })
    
    # Queue generation (async processing)
    await queue_generation(generation_id, request)
    
    # Deduct from balance or charge
    await charge_api_usage(auth_info["user_id"], cost, db)
    
    return GenerateResponse(
        id=generation_id,
        status="queued",
        cost=cost,
        estimated_completion=30  # seconds
    )

@router.get("/generate/{generation_id}", response_model=GenerateResponse)
async def get_generation_status(
    generation_id: str,
    authorization: str = Header(...),
    db = Depends(get_database)
):
    """Get generation status"""
    
    api_key = authorization.replace("Bearer ", "")
    auth_info = await validate_api_key(api_key, db)
    
    generation = await db.api_generations.find_one({
        "id": generation_id,
        "user_id": auth_info["user_id"]
    })
    
    if not generation:
        raise HTTPException(404, "Generation not found")
    
    return GenerateResponse(**generation)

@router.post("/keys")
async def create_api_key(
    name: str,
    tier: str = "starter",
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Create new API key"""
    
    if tier not in API_PRICING:
        raise HTTPException(400, "Invalid tier")
    
    # Generate key
    api_key = generate_api_key(current_user["id"])
    key_hash = hashlib.sha256(api_key.encode()).hexdigest()
    
    # Store in DB (only store hash for security)
    key_record = APIKey(
        id=uuid.uuid4(),
        user_id=current_user["id"],
        key=key_hash,  # Store hash, not plaintext
        name=name,
        tier=tier,
        rate_limit=API_PRICING[tier]["rate_limit"],
        is_active=True,
        created_at=str(uuid.uuid4())
    )
    
    await db.api_keys.create(key_record.dict())
    
    return {
        "api_key": api_key,  # Return plaintext ONCE
        "tier": tier,
        "rate_limit": API_PRICING[tier]["rate_limit"],
        "warning": "Save this key now. You won't see it again."
    }

@router.get("/usage")
async def get_api_usage(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get API usage stats"""
    
    # Get all generations this month
    from datetime import datetime, timedelta
    month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0)
    
    generations = await db.api_generations.find({
        "user_id": current_user["id"],
        "created_at": {"$gte": month_start}
    }).to_list(10000)
    
    total_cost = sum(g.get("cost", 0) for g in generations)
    total_generations = len(generations)
    
    return {
        "month": month_start.strftime("%Y-%m"),
        "total_generations": total_generations,
        "total_cost": round(total_cost, 2),
        "average_cost_per_gen": round(total_cost / total_generations, 2) if total_generations > 0 else 0
    }

async def queue_generation(generation_id: str, request: GenerateRequest):
    """Queue generation for processing"""
    from app.services.queue_service import generate_video_task
    task = generate_video_task.delay(
        user_id=generation_id,
        prompt=request.prompt,
        style_pack_id=request.style
    )
    return task.id

async def charge_api_usage(user_id: str, cost: float, db):
    """Charge user for API usage"""
    # Deduct from prepaid balance or add to invoice
    await db.users.update(
        {"id": user_id},
        {"$inc": {"api_balance": -cost}}
    )

def get_current_user():
    """Get current user from JWT"""
    pass

def get_database():
    """Get database connection"""
    pass
