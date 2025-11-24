from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from app.services.ledger import ledger_service

router = APIRouter()

class PoARequest(BaseModel):
    user_id: str
    video_id: str
    duration_seconds: float

class BalanceResponse(BaseModel):
    user_id: str
    balance: float
    transactions: List[Dict[str, Any]]

@router.post("/poa")
async def proof_of_attention(request: PoARequest):
    """
    Receives a heartbeat from the video player verifying attention.
    Mints tokens for the viewer.
    """
    if request.duration_seconds <= 0 or request.duration_seconds > 60:
        raise HTTPException(status_code=400, detail="Invalid duration")
        
    reward = ledger_service.process_poa(request.user_id, request.duration_seconds)
    
    return {
        "status": "verified",
        "reward_minted": reward,
        "new_balance": ledger_service.get_balance(request.user_id)
    }

@router.get("/balance/{user_id}", response_model=BalanceResponse)
async def get_balance(user_id: str):
    return BalanceResponse(
        user_id=user_id,
        balance=ledger_service.get_balance(user_id),
        transactions=ledger_service.get_transactions(user_id)
    )
