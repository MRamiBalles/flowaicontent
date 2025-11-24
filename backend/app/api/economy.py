"""
Creator Economy & Governance API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from app.auth import get_current_user
from app.services.creator_economy_service import creator_economy_service
from app.services.governance_service import governance_service

router = APIRouter(prefix="/economy", tags=["economy"])

# --- Creator Coins ---

class BuySellRequest(BaseModel):
    creator_id: str
    amount: int

@router.get("/coins/{creator_id}")
async def get_coin_info(creator_id: str):
    return await creator_economy_service.get_coin_info(creator_id)

@router.post("/coins/buy")
async def buy_coin(request: BuySellRequest, current_user: dict = Depends(get_current_user)):
    return await creator_economy_service.buy_coin(current_user["id"], request.creator_id, request.amount)

@router.post("/coins/sell")
async def sell_coin(request: BuySellRequest, current_user: dict = Depends(get_current_user)):
    try:
        return await creator_economy_service.sell_coin(current_user["id"], request.creator_id, request.amount)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- Governance ---

class VoteRequest(BaseModel):
    proposal_id: str
    support: bool

@router.get("/governance/proposals")
async def get_proposals():
    return await governance_service.get_proposals()

@router.post("/governance/vote")
async def vote(request: VoteRequest, current_user: dict = Depends(get_current_user)):
    # Mock weight based on user role or mock staking
    weight = 100 
    return await governance_service.vote(current_user["id"], request.proposal_id, request.support, weight)
