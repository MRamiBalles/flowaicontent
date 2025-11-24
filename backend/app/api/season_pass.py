"""
Season Pass API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.models.season_pass import (
    create_season_pass,
    track_quest_progress,
    purchase_premium_pass,
    generate_season_tiers,
    SEASON_PASS_PRICE
)

router = APIRouter(prefix="/season-pass", tags=["season-pass"])

@router.get("/current")
async def get_current_season_pass(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get user's current season pass"""
    from datetime import datetime
    
    user_id = current_user["id"]
    
    # Get active season pass
    season_pass = await db.season_passes.find_one({
        'user_id': user_id,
        'expires_at': {'$gt': datetime.now()}
    })
    
    if not season_pass:
        # Create new one (current season from config)
        config = await db.season_config.find_one({"active": True})
        current_season = config["season_number"] if config else 1
        season_pass = await create_season_pass(user_id, current_season, db)
    
    return season_pass

@router.get("/tiers")
async def get_season_tiers():
    """Get all tier rewards for current season"""
    tiers = generate_season_tiers()
    return {
        "total_tiers": len(tiers),
        "tiers": [t.dict() for t in tiers],
        "premium_price": SEASON_PASS_PRICE
    }

@router.post("/upgrade-premium")
async def upgrade_to_premium(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Purchase premium season pass"""
    user_id = current_user["id"]
    
    try:
        await purchase_premium_pass(user_id, db)
        return {"success": True, "message": "Upgraded to Premium Season Pass!"}
    except ValueError as e:
        raise HTTPException(400, str(e))

@router.post("/refresh-quests")
async def refresh_daily_quests(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Refresh daily quests (called automatically at midnight)"""
    from datetime import datetime, timedelta
    
    user_id = current_user["id"]
    
    # Get current season pass
    season_pass = await db.season_passes.find_one({"user_id": user_id})
    if not season_pass:
        raise HTTPException(404, "No active season pass")
    
    # Check if quests were already refreshed today
    last_refresh = season_pass.get("last_quest_refresh")
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    
    if last_refresh and last_refresh >= today:
        return {"message": "Quests already refreshed today"}
    
    # Generate new daily quests
    new_quests = [
        {"id": "daily_1", "type": "generate_videos", "target": 3, "progress": 0, "reward_xp": 100},
        {"id": "daily_2", "type": "share_videos", "target": 2, "progress": 0, "reward_xp": 75},
        {"id": "daily_3", "type": "earn_tokens", "target": 50, "progress": 0, "reward_xp": 50}
    ]
    
    # Update season pass
    await db.season_passes.update(
        {"id": season_pass["id"]},
        {
            "$set": {
                "daily_quests": new_quests,
                "last_quest_refresh": datetime.now()
            }
        }
    )
    
    return {
        "message": "Daily quests refreshed",
        "quests": new_quests
    }

def get_current_user():
    pass

def get_database():
    pass
