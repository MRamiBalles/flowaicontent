"""
Super Clips - Boost System Models
Pay tokens to boost clips to trending
"""

from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional
import uuid

class ClipBoost(BaseModel):
    """Clip boost record"""
    id: uuid.UUID
    clip_id: uuid.UUID
    user_id: uuid.UUID  # Who boosted it
    cost_tokens: int
    duration_hours: int
    boost_multiplier: float  # Ranking multiplier (e.g. 10x)
    started_at: datetime
    expires_at: datetime
    views_during_boost: int = 0
    new_followers_during_boost: int = 0

# Boost pricing tiers
BOOST_TIERS = {
    "basic": {
        "cost": 50,
        "duration": 24,  # hours
        "multiplier": 5,
        "description": "5x ranking for 24 hours"
    },
    "turbo": {
        "cost": 150,
        "duration": 48,
        "multiplier": 10,
        "description": "10x ranking for 48 hours"
    },
    "mega": {
        "cost": 500,
        "duration": 72,
        "multiplier": 20,
        "description": "20x ranking for 72 hours - Featured spot"
    }
}

async def boost_clip(clip_id: str, user_id: str, tier: str, db) -> ClipBoost:
    """Boost a clip to trending"""
    # Validate tier
    if tier not in BOOST_TIERS:
        raise ValueError(f"Invalid boost tier: {tier}")
    
    tier_config = BOOST_TIERS[tier]
    
    # Check user balance
    user = await db.users.find_one({"id": user_id})
    if user.get("tokens_balance", 0) < tier_config["cost"]:
        raise ValueError("Insufficient token balance")
    
    # Check if clip is already boosted
    existing_boost = await db.clip_boosts.find_one({
        "clip_id": clip_id,
        "expires_at": {"$gt": datetime.now()}
    })
    
    if existing_boost:
        raise ValueError("Clip is already boosted")
    
    # Deduct tokens
    await db.users.update(
        {"id": user_id},
        {"$inc": {"tokens_balance": -tier_config["cost"]}}
    )
    
    # Create boost record
    now = datetime.now()
    boost = ClipBoost(
        id=uuid.uuid4(),
        clip_id=clip_id,
        user_id=user_id,
        cost_tokens=tier_config["cost"],
        duration_hours=tier_config["duration"],
        boost_multiplier=tier_config["multiplier"],
        started_at=now,
        expires_at=now + timedelta(hours=tier_config["duration"]),
        views_during_boost=0,
        new_followers_during_boost=0
    )
    
    await db.clip_boosts.create(boost.dict())
    
    # Update clip with boost status
    await db.clips.update(
        {"id": clip_id},
        {
            "$set": {
                "boost_active": True,
                "boost_expires_at": boost.expires_at,
                "boost_multiplier": tier_config["multiplier"]
            }
        }
    )
    
    # Log transaction
    await db.token_transactions.create({
        "user_id": user_id,
        "amount": -tier_config["cost"],
        "type": "clip_boost",
        "metadata": {
            "clip_id": clip_id,
            "tier": tier,
            "boost_id": str(boost.id)
        }
    })
    
    return boost

async def get_active_boosts(user_id: Optional[str] = None, db = None) -> list:
    """Get active boosts (optionally filtered by user)"""
    query = {"expires_at": {"$gt": datetime.now()}}
    
    if user_id:
        query["user_id"] = user_id
    
    boosts = await db.clip_boosts.find(query).to_list(100)
    return boosts

async def calculate_boost_roi(boost_id: str, db) -> dict:
    """Calculate ROI of a boost"""
    boost = await db.clip_boosts.find_one({"id": boost_id})
    
    if not boost:
        return None
    
    # Get clip stats during boost period
    clip = await db.clips.find_one({"id": boost["clip_id"]})
    
    # Simple ROI calculation
    # Assume 1 view = 0.01 tokens potential value
    estimated_value = boost["views_during_boost"] * 0.01
    
    roi = ((estimated_value - boost["cost_tokens"]) / boost["cost_tokens"]) * 100
    
    return {
        "boost_id": boost_id,
        "cost": boost["cost_tokens"],
        "views_gained": boost["views_during_boost"],
        "estimated_value": round(estimated_value, 2),
        "roi_percent": round(roi, 1),
        "worth_it": roi > 0
    }

async def get_trending_clips(limit: int = 50, db = None) -> list:
    """Get trending clips (considering boosts)"""
    now = datetime.now()
    
    # Get all clips
    clips = await db.clips.find({}).to_list(1000)
    
    # Calculate trending score
    for clip in clips:
        base_score = clip.get("views", 0) * 0.7 + clip.get("likes", 0) * 0.3
        
        # Check if boosted
        if clip.get("boost_active") and clip.get("boost_expires_at", datetime.min) > now:
            multiplier = clip.get("boost_multiplier", 1)
            clip["trending_score"] = base_score * multiplier
            clip["is_boosted"] = True
        else:
            clip["trending_score"] = base_score
            clip["is_boosted"] = False
            
            # Clear expired boost
            if clip.get("boost_active"):
                await db.clips.update(
                    {"id": clip["id"]},
                    {"$set": {
                        "boost_active": False,
                        "boost_multiplier": 1
                    }}
                )
    
    # Sort by trending score
    clips.sort(key=lambda x: x["trending_score"], reverse=True)
    
    return clips[:limit]
