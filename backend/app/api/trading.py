"""
Trading History API Endpoints
"""

from fastapi import APIRouter, Depends
from typing import List, Dict, Any
from app.services.trading_history.py import trading_history_service

router = APIRouter(prefix="/trading", tags=["trading"])

@router.get("/history/{asset_id}")
async def get_asset_history(asset_id: str):
    """Get price history for an asset"""
    return await trading_history_service.get_asset_history(asset_id)

@router.get("/activity")
async def get_recent_activity():
    """Get recent marketplace activity"""
    return await trading_history_service.get_recent_activity()

@router.get("/stats")
async def get_platform_stats():
    """Get marketplace statistics"""
    return await trading_history_service.get_platform_stats()
