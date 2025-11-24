"""
Brand Bounties API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta

router = APIRouter(prefix="/bounties", tags=["bounties"])

class CreateBountyRequest(BaseModel):
    title: str
    description: str
    requirements: str
    amount_usd: float
    deadline_days: int  # Days from now

class SubmitEntryRequest(BaseModel):
    bounty_id: str
    video_id: str
    description: Optional[str] = None

@router.post("/create")
async def create_bounty(
    request: CreateBountyRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Create new brand bounty"""
    
    # Convert USD to tokens (100 tokens = $1)
    amount_tokens = int(request.amount_usd * 100)
    
    # Check balance
    user = await db.users.find_one({"id": current_user["id"]})
    if user.get("tokens_balance", 0) < amount_tokens:
        raise HTTPException(400, "Insufficient tokens")
    
    # Escrow tokens
    await db.users.update(
        {"id": current_user["id"]},
        {"$inc": {"tokens_balance": -amount_tokens}}
    )
    
    # Create bounty
    import uuid
    bounty_id = str(uuid.uuid4())
    deadline = datetime.now() + timedelta(days=request.deadline_days)
    
    bounty = {
        "id": bounty_id,
        "brand_id": current_user["id"],
        "title": request.title,
        "description": request.description,
        "requirements": request.requirements,
        "amount_tokens": amount_tokens,
        "deadline": deadline,
        "status": "active",  # active, voting, completed, cancelled
        "entries": [],
        "created_at": datetime.now()
    }
    
    await db.bounties.create(bounty)
    
    # Deploy to smart contract
    # TODO: Call BountyEscrow.createBounty()
    
    return {"bounty_id": bounty_id, "escrowed_tokens": amount_tokens}

@router.get("/active")
async def get_active_bounties(
    limit: int = 50,
    db = Depends(get_database)
):
    """Get all active bounties"""
    
    bounties = await db.bounties.find({
        "status": "active",
        "deadline": {"$gt": datetime.now()}
    }).to_list(limit)
    
    return {"bounties": bounties}

@router.post("/submit-entry")
async def submit_entry(
    request: SubmitEntryRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Submit entry to bounty"""
    
    # Get bounty
    bounty = await db.bounties.find_one({"id": request.bounty_id})
    
    if not bounty:
        raise HTTPException(404, "Bounty not found")
    
    if bounty["status"] != "active":
        raise HTTPException(400, "Bounty not active")
    
    if datetime.now() > bounty["deadline"]:
        raise HTTPException(400, "Bounty deadline passed")
    
    # Check if video exists
    video = await db.videos.find_one({
        "id": request.video_id,
        "user_id": current_user["id"]
    })
    
    if not video:
        raise HTTPException(404, "Video not found")
    
    # Submit entry
    import uuid
    entry_id = str(uuid.uuid4())
    
    entry = {
        "id": entry_id,
        "bounty_id": request.bounty_id,
        "creator_id": current_user["id"],
        "video_id": request.video_id,
        "description": request.description,
        "vote_count": 0,
        "submitted_at": datetime.now()
    }
    
    await db.bounty_entries.create(entry)
    
    # Add to bounty
    await db.bounties.update(
        {"id": request.bounty_id},
        {"$push": {"entries": entry_id}}
    )
    
    # Call smart contract
    # TODO: BountyEscrow.submitEntry()
    
    return {"entry_id": entry_id}

@router.post("/vote/{entry_id}")
async def vote_for_entry(
    entry_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Vote for bounty entry"""
    
    # Get entry
    entry = await db.bounty_entries.find_one({"id": entry_id})
    
    if not entry:
        raise HTTPException(404, "Entry not found")
    
    # Get bounty
    bounty = await db.bounties.find_one({"id": entry["bounty_id"]})
    
    if bounty["status"] != "voting":
        raise HTTPException(400, "Bounty not in voting period")
    
    # Check if already voted
    existing_vote = await db.bounty_votes.find_one({
        "bounty_id": bounty["id"],
        "user_id": current_user["id"]
    })
    
    if existing_vote:
        raise HTTPException(400, "Already voted")
    
    # Cast vote
    await db.bounty_votes.create({
        "bounty_id": bounty["id"],
        "entry_id": entry_id,
        "user_id": current_user["id"],
        "voted_at": datetime.now()
    })
    
    # Increment vote count
    await db.bounty_entries.update(
        {"id": entry_id},
        {"$inc": {"vote_count": 1}}
    )
    
    # Call smart contract
    # TODO: BountyEscrow.vote()
    
    return {"success": True}

@router.get("/leaderboard")
async def get_bounty_leaderboard(
    period: str = "all_time",
    limit: int = 100,
    db = Depends(get_database)
):
    """Get top bounty winners"""
    
    from datetime import timedelta
    
    if period == "month":
        since = datetime.now() - timedelta(days=30)
    else:
        since = datetime.min
    
    # Aggregate winnings
    pipeline = [
        {
            "$match": {
                "winner_id": {"$exists": True},
                "completed_at": {"$gte": since}
            }
        },
        {
            "$group": {
                "_id": "$winner_id",
                "total_won": {"$sum": "$amount_tokens"},
                "bounties_won": {"$sum": 1}
            }
        },
        {
            "$sort": {"total_won": -1}
        },
        {
            "$limit": limit
        }
    ]
    
    results = await db.bounties.aggregate(pipeline).to_list(limit)
    
    # Get usernames
    leaderboard = []
    for result in results:
        user = await db.users.find_one({"id": result["_id"]})
        leaderboard.append({
            "rank": len(leaderboard) + 1,
            "username": user.get("username", "Anonymous"),
            "total_won": result["total_won"],
            "bounties_won": result["bounties_won"]
        })
    
    return leaderboard

def get_current_user():
    pass

def get_database():
    pass
