"""
Referral API V2 Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Body
from typing import Dict, Any
from app.auth import get_current_user
from app.services.referral_service import referral_service

router = APIRouter(prefix="/referrals-v2", tags=["referrals-v2"])

@router.get("/dashboard")
async def get_referral_dashboard(current_user: dict = Depends(get_current_user)):
    """Get user's referral stats and code"""
    user_id = current_user["id"]
    # Ensure code exists
    if not referral_service.user_codes.get(user_id):
        referral_service.generate_code(user_id)
        
    stats = referral_service.get_stats(user_id)
    links = referral_service.get_social_share_links(stats["code"])
    
    return {
        "stats": stats,
        "share_links": links,
        "milestones": [
            {"count": 5, "reward": 500, "achieved": stats["total_referrals"] >= 5},
            {"count": 10, "reward": 1500, "achieved": stats["total_referrals"] >= 10},
            {"count": 25, "reward": 5000, "achieved": stats["total_referrals"] >= 25}
        ]
    }

@router.post("/claim")
async def claim_referral(
    code: str = Body(..., embed=True),
    current_user: dict = Depends(get_current_user)
):
    """Claim a referral code (for new users)"""
    result = await referral_service.process_referral(code, current_user["id"])
    if result["status"] != "success":
        raise HTTPException(status_code=400, detail=result["status"])
    return result

@router.get("/leaderboard")
async def get_leaderboard():
    """Get top referrers"""
    # Mock leaderboard
    return [
        {"rank": 1, "username": "CryptoKing", "referrals": 150, "earned": 25000},
        {"rank": 2, "username": "AI_Master", "referrals": 89, "earned": 12000},
        {"rank": 3, "username": "FlowCreator", "referrals": 45, "earned": 5000}
    ]
