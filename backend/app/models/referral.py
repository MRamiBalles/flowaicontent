"""
Referral System Models
Track user referrals and rewards
"""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional
import uuid
import random
import string

class Referral(BaseModel):
    """Referral model"""
    id: uuid.UUID
    referrer_id: uuid.UUID  # User who sent invite
    referred_id: Optional[uuid.UUID] = None  # User who signed up
    code: str  # Unique referral code
    email: Optional[str] = None  # Email invited (if not signed up yet)
    converted: bool = False  # Signed up?
    paying: bool = False  # Became paying customer?
    tokens_rewarded: int = 0
    created_at: datetime
    converted_at: Optional[datetime] = None

# Reward structure
REFERRAL_REWARDS = {
    "referrer_signup": 100,  # Referrer gets 100 tokens when referred signs up
    "referrer_payment": 200,  # Referrer gets 200 more when referred upgrades
    "referred_signup": 50,   # Referred user gets 50 tokens on signup
}

def generate_referral_code(user_id: str) -> str:
    """Generate unique referral code"""
    # Format: FLOW-XXXXX (5 random chars)
    random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
    return f"FLOW-{random_part}"

def get_referral_link(code: str, base_url: str = "https://flowai.com") -> str:
    """Generate shareable referral link"""
    return f"{base_url}?ref={code}"

async def track_referral_signup(code: str, new_user_id: str, db):
    """Track when someone signs up via referral"""
    # Find referral by code
    referral = await db.referrals.find_one({"code": code, "converted": False})
    
    if not referral:
        return None
    
    # Update referral
    await db.referrals.update(
        {"id": referral["id"]},
        {
            "$set": {
                "referred_id": new_user_id,
                "converted": True,
                "converted_at": datetime.now()
            }
        }
    )
    
    # Reward referrer
    await db.users.update(
        {"id": referral["referrer_id"]},
        {"$inc": {"tokens_balance": REFERRAL_REWARDS["referrer_signup"]}}
    )
    
    # Reward new user
    await db.users.update(
        {"id": new_user_id},
        {"$inc": {"tokens_balance": REFERRAL_REWARDS["referred_signup"]}}
    )
    
    # Log transactions
    await db.token_transactions.create({
        "user_id": referral["referrer_id"],
        "amount": REFERRAL_REWARDS["referrer_signup"],
        "type": "referral_reward",
        "metadata": {"referred_user": new_user_id}
    })
    
    await db.token_transactions.create({
        "user_id": new_user_id,
        "amount": REFERRAL_REWARDS["referred_signup"],
        "type": "signup_bonus"
    })
    
    return referral

async def track_referral_payment(referred_user_id: str, db):
    """Track when referred user makes first payment"""
    # Find referral
    referral = await db.referrals.find_one({
        "referred_id": referred_user_id,
        "paying": False
    })
    
    if not referral:
        return None
    
    # Update referral
    await db.referrals.update(
        {"id": referral["id"]},
        {"$set": {"paying": True}}
    )
    
    # Reward referrer with bonus
    await db.users.update(
        {"id": referral["referrer_id"]},
        {"$inc": {"tokens_balance": REFERRAL_REWARDS["referrer_payment"]}}
    )
    
    # Log transaction
    await db.token_transactions.create({
        "user_id": referral["referrer_id"],
        "amount": REFERRAL_REWARDS["referrer_payment"],
        "type": "referral_conversion_bonus",
        "metadata": {"referred_user": referred_user_id}
    })
    
    return referral

async def get_referral_stats(user_id: str, db) -> dict:
    """Get user's referral statistics"""
    referrals = await db.referrals.find({"referrer_id": user_id}).to_list(1000)
    
    total_invites = len(referrals)
    total_signups = sum(1 for r in referrals if r.get("converted"))
    total_paying = sum(1 for r in referrals if r.get("paying"))
    total_earned = sum(r.get("tokens_rewarded", 0) for r in referrals)
    
    conversion_rate = (total_signups / total_invites * 100) if total_invites > 0 else 0
    
    return {
        "total_invites": total_invites,
        "total_signups": total_signups,
        "total_paying": total_paying,
        "total_earned": total_earned,
        "conversion_rate": round(conversion_rate, 1)
    }
