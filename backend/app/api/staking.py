"""
Staking API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from app.auth import get_current_user
from app.services.staking_service import staking_service

router = APIRouter(prefix="/staking", tags=["staking"])

@router.get("/info")
async def get_my_staking_info(current_user: dict = Depends(get_current_user)):
    """Get current user's staking info"""
    # Assuming user profile has wallet_address linked
    wallet_address = current_user.get("wallet_address", "0x0000000000000000000000000000000000000000")
    return await staking_service.get_user_staking_info(wallet_address)

@router.get("/stats")
async def get_staking_stats():
    """Get global staking statistics"""
    return await staking_service.get_global_stats()
