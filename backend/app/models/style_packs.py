"""
Style Packs System - LoRA Marketplace
Allows users to purchase and download style packs (LoRA adapters)
"""

from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid

class StylePack(BaseModel):
    """Style pack model"""
    id: uuid.UUID
    name: str
    description: str
    price_cents: int  # Price in cents
    lora_url: str  # S3 path to .safetensors file
    preview_images: List[str]  # Array of preview image URLs
    creator_id: Optional[str] = None  # For user-created styles
    downloads: int = 0
    is_active: bool = True
    tags: List[str] = []
    created_at: datetime

class StylePackPurchase(BaseModel):
    """Purchase record"""
    id: uuid.UUID
    user_id: uuid.UUID
    style_pack_id: uuid.UUID
    stripe_payment_id: str
    purchased_at: datetime

# Predefined style packs (platform-created)
OFFICIAL_STYLE_PACKS = [
    {
        "name": "Studio Ghibli Dreams",
        "description": "Create videos in the iconic Miyazaki animation style",
        "price_cents": 499,  # $4.99
        "tags": ["anime", "nostalgic", "whimsical"],
        "preview_count": 8
    },
    {
        "name": "Cyberpunk 2077",
        "description": "Neon-soaked futuristic cityscapes and chrome aesthetics",
        "price_cents": 699,  # $6.99
        "tags": ["cyberpunk", "neon", "futuristic"],
        "preview_count": 10
    },
    {
        "name": "Watercolor Serenity",
        "description": "Soft, painterly watercolor effects for dreamy videos",
        "price_cents": 399,  # $3.99
        "tags": ["watercolor", "artistic", "serene"],
        "preview_count": 6
    },
    {
        "name": "Cinematic Blockbuster",
        "description": "Hollywood-grade color grading and cinematography",
        "price_cents": 999,  # $9.99
        "tags": ["cinematic", "professional", "dramatic"],
        "preview_count": 12
    },
    {
        "name": "Retro 80s VHS",
        "description": "Nostalgic VHS tape aesthetic with scan lines",
        "price_cents": 599,  # $5.99
        "tags": ["retro", "80s", "vintage"],
        "preview_count": 8
    }
]

def format_price(price_cents: int) -> str:
    """Format price in cents to dollar string"""
    return f"${price_cents / 100:.2f}"

def has_purchased(user_id: str, style_pack_id: str, db) -> bool:
    """Check if user has already purchased a style pack"""
    purchase = db.style_pack_purchases.find_one({
        "user_id": user_id,
        "style_pack_id": style_pack_id
    })
    return purchase is not None

async def grant_style_pack_access(user_id: str, style_pack_id: str, db):
    """Grant user access to a style pack after purchase"""
    # Add to user's owned styles
    await db.users.update(
        {"id": user_id},
        {"$addToSet": {"owned_style_packs": style_pack_id}}
    )
    
    # Increment download count
    await db.style_packs.update(
        {"id": style_pack_id},
        {"$inc": {"downloads": 1}}
    )
