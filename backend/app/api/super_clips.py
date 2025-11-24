"""
Super Clips API Endpoints
Boost clips to trending, view active boosts
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.models.super_clips import (
    boost_clip,
    get_active_boosts,
    calculate_boost_roi,
    get_trending_clips,
    BOOST_TIERS
)

router = APIRouter(prefix="/super-clips", tags=["super-clips"])

class BoostRequest(BaseModel):
    clip_id: str
    tier: str  # 'basic', 'turbo', 'mega'

@router.get("/tiers")
async def get_boost_tiers():
    """Get available boost tiers and pricing"""
    return {
        "tiers": BOOST_TIERS,
        "description": "Pay tokens to boost your clip to trending"
    }

@router.post("/boost")
async def create_boost(
    request: BoostRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Boost a clip to trending"""
    user_id = current_user["id"]
    
    try:
        boost = await boost_clip(
            clip_id=request.clip_id,
            user_id=user_id,
            tier=request.tier,
            db=db
        )
        
        return {
            "success": True,
            "boost": boost,
            "message": f"Clip boosted with {request.tier} tier!"
        }
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, f"Failed to boost clip: {str(e)}")

@router.get("/active")
async def get_my_active_boosts(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get user's active boosts"""
    user_id = current_user["id"]
    boosts = await get_active_boosts(user_id, db)
    
    return {
        "count": len(boosts),
        "boosts": boosts
    }

@router.get("/trending")
async def get_trending(
    limit: int = 50,
    db = Depends(get_database)
):
    """Get trending clips (with boost consideration)"""
    clips = await get_trending_clips(limit, db)
    
    return {
        "count": len(clips),
        "clips": clips
    }

@router.get("/roi/{boost_id}")
async def get_boost_roi(
    boost_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Calculate ROI of a boost"""
    # Verify user owns this boost
    boost = await db.clip_boosts.find_one({"id": boost_id})
    
    if not boost:
        raise HTTPException(404, "Boost not found")
    
    if boost["user_id"] != current_user["id"]:
        raise HTTPException(403, "Not your boost")
    
    roi_data = await calculate_boost_roi(boost_id, db)
    
    return roi_data

@router.get("/leaderboard")
async def get_boost_leaderboard(
    period: str = "all_time",  # 'day', 'week', 'month', 'all_time'
    limit: int = 100,
    db = Depends(get_database)
):
    """Get leaderboard of most boosted clips"""
    from datetime import datetime, timedelta
    
    # Calculate time filter
    if period == "day":
        since = datetime.now() - timedelta(days=1)
    elif period == "week":
        since = datetime.now() - timedelta(weeks=1)
    elif period == "month":
        since = datetime.now() - timedelta(days=30)
    else:
        since = datetime.min
    
    # Aggregate boosts
    pipeline = [
        {
            "$match": {"started_at": {"$gte": since}}
        },
        {
            "$group": {
                "_id": "$clip_id",
                "total_spent": {"$sum": "$cost_tokens"},
                "total_boosts": {"$sum": 1},
                "total_views": {"$sum": "$views_during_boost"}
            }
        },
        {
            "$sort": {"total_spent": -1}
        },
        {
            "$limit": limit
        }
    ]
    
    results = await db.clip_boosts.aggregate(pipeline).to_list(limit)
    
    # Get clip details
    leaderboard = []
    for result in results:
        clip = await db.clips.find_one({"id": result["_id"]})
        if clip:
            leaderboard.append({
                "clip_id": result["_id"],
                "title": clip.get("title", "Untitled"),
                "creator": clip.get("creator_username", "Anonymous"),
                "total_spent": result["total_spent"],
                "total_boosts": result["total_boosts"],
                "total_views": result["total_views"],
                "rank": len(leaderboard) + 1
            })
    
    return leaderboard

def get_current_user():
    """Get current authenticated user"""
    pass

def get_database():
    """Get database connection"""
    pass
