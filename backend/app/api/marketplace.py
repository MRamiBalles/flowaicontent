"""
NFT Marketplace API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from app.auth import get_current_user
from app.services.nft_service import nft_service

router = APIRouter(prefix="/marketplace", tags=["marketplace"])

class MintRequest(BaseModel):
    content_id: str
    title: str
    description: str
    image_url: str

class BuyRequest(BaseModel):
    listing_id: str

@router.get("/listings")
async def get_listings():
    """Get all active listings"""
    return await nft_service.get_listings()

@router.post("/mint")
async def mint_nft(
    request: MintRequest,
    current_user: dict = Depends(get_current_user)
):
    """Mint a new NFT from generated content"""
    try:
        return await nft_service.mint_asset(
            current_user["id"],
            request.content_id,
            request.dict()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/buy/{listing_id}")
async def buy_nft(
    listing_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Buy an NFT listing"""
    try:
        return await nft_service.buy_item(current_user["id"], listing_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
