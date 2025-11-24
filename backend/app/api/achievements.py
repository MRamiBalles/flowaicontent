"""
Achievements API Endpoints
"""

from fastapi import APIRouter, Depends

from app.models.achievements import (
    get_user_achievements,
    get_leaderboard,
    ACHIEVEMENTS
)

router = APIRouter(prefix="/achievements", tags=["achievements"])

@router.get("/my-achievements")
async def get_my_achievements(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get user's achievement progress"""
    user_id = current_user["id"]
    achievements = await get_user_achievements(user_id, db)
    
    # Calculate stats
    total = len(achievements)
    unlocked = sum(1 for a in achievements if a["unlocked"])
    tokens_earned = sum(a["reward_tokens"] for a in achievements if a["unlocked"])
    
    return {
        "achievements": achievements,
        "stats": {
            "total": total,
            "unlocked": unlocked,
            "locked": total - unlocked,
            "completion_percent": round((unlocked / total) * 100, 1),
            "tokens_earned_from_achievements": tokens_earned
        }
    }

@router.get("/leaderboard")
async def get_achievements_leaderboard(
    category: str = "all",
    period: str = "all_time",
    limit: int = 100,
    db = Depends(get_database)
):
    """Get achievement leaderboard"""
    leaderboard = await get_leaderboard(category, period, limit, db)
    return {"leaderboard": leaderboard}

@router.get("/all")
async def get_all_achievements():
    """Get all available achievements"""
    return {
        "achievements": [a.dict() for a in ACHIEVEMENTS],
        "total": len(ACHIEVEMENTS),
        "categories": list(set(a.category for a in ACHIEVEMENTS))
    }

def get_current_user():
    pass

def get_database():
    pass
