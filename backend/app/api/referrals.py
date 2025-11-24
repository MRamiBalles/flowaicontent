"""
Referral API Endpoints
Invite friends, track conversions, view stats
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from typing import List

from app.models.referral import (
    generate_referral_code,
    get_referral_link,
    track_referral_signup,
    get_referral_stats,
    REFERRAL_REWARDS
)

router = APIRouter(prefix="/referrals", tags=["referrals"])

class InviteRequest(BaseModel):
    emails: List[EmailStr]

@router.get("/my-code")
async def get_my_referral_code(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get user's referral code (create if doesn't exist)"""
    user_id = current_user["id"]
    
    # Check if user already has a code
    user = await db.users.find_one({"id": user_id})
    
    if user.get("referral_code"):
        code = user["referral_code"]
    else:
        # Generate new code
        code = generate_referral_code(user_id)
        
        # Save to user
        await db.users.update(
            {"id": user_id},
            {"$set": {"referral_code": code}}
        )
    
    link = get_referral_link(code)
    
    return {
        "code": code,
        "link": link,
        "rewards": REFERRAL_REWARDS
    }

@router.post("/invite")
async def invite_friends(
    request: InviteRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Send referral invites via email"""
    user_id = current_user["id"]
    
    # Get or create referral code
    code_response = await get_my_referral_code(current_user, db)
    code = code_response["code"]
    link = code_response["link"]
    
    # Create referral records
    invited = []
    for email in request.emails:
        # Check if already invited
        existing = await db.referrals.find_one({
            "referrer_id": user_id,
            "email": email
        })
        
        if existing:
            continue
        
        # Create referral record
        referral = await db.referrals.create({
            "referrer_id": user_id,
            "code": code,
            "email": email,
            "converted": False,
            "paying": False,
            "tokens_rewarded": 0
        })
        
        invited.append(email)
        
        # TODO: Send email with link
        # await send_referral_email(email, link, current_user["username"])
    
    return {
        "invited_count": len(invited),
        "total_sent": len(request.emails),
        "already_invited": len(request.emails) - len(invited)
    }

@router.get("/stats")
async def get_my_referral_stats(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get user's referral statistics"""
    user_id = current_user["id"]
    stats = await get_referral_stats(user_id, db)
    return stats

@router.get("/leaderboard")
async def get_referral_leaderboard(
    limit: int = 100,
    db = Depends(get_database)
):
    """Get top referrers leaderboard"""
    # Aggregate referrals by user
    pipeline = [
        {
            "$match": {"converted": True}
        },
        {
            "$group": {
                "_id": "$referrer_id",
                "total_referrals": {"$sum": 1},
                "paying_referrals": {
                    "$sum": {"$cond": ["$paying", 1, 0]}
                }
            }
        },
        {
            "$sort": {"total_referrals": -1}
        },
        {
            "$limit": limit
        }
    ]
    
    results = await db.referrals.aggregate(pipeline).to_list(limit)
    
    # Get usernames
    leaderboard = []
    for result in results:
        user = await db.users.find_one({"id": result["_id"]})
        leaderboard.append({
            "username": user.get("username", "Anonymous"),
            "total_referrals": result["total_referrals"],
            "paying_referrals": result["paying_referrals"],
            "rank": len(leaderboard) + 1
        })
    
    return leaderboard

def get_current_user():
    """Get current authenticated user"""
    pass

def get_database():
    """Get database connection"""
    pass
