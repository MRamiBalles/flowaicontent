"""
Style Packs API Endpoints
Purchase, download, and manage style packs
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List

from app.models.style_packs import StylePack, has_purchased, grant_style_pack_access, format_price
from app.auth import get_current_user
import stripe
import os

router = APIRouter(prefix="/style-packs", tags=["style-packs"])

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

class PurchaseRequest(BaseModel):
    style_pack_id: str
    success_url: str
    cancel_url: str

@router.get("/", response_model=List[StylePack])
async def list_style_packs(
    db = Depends(get_database),
    current_user: dict = Depends(get_current_user)
):
    """Get all available style packs"""
    packs = await db.style_packs.find({"is_active": True}).to_list(100)
    
    # Mark which ones user already owns
    user_id = current_user["id"]
    user = await db.users.find_one({"id": user_id})
    owned_packs = user.get("owned_style_packs", [])
    
    for pack in packs:
        pack["is_owned"] = str(pack["id"]) in owned_packs
    
    return packs

@router.get("/{pack_id}", response_model=StylePack)
async def get_style_pack(
    pack_id: str,
    db = Depends(get_database)
):
    """Get single style pack details"""
    pack = await db.style_packs.find_one({"id": pack_id})
    if not pack:
        raise HTTPException(404, "Style pack not found")
    return pack

@router.post("/purchase")
async def purchase_style_pack(
    request: PurchaseRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Create checkout session for style pack purchase"""
    user_id = current_user["id"]
    pack_id = request.style_pack_id
    
    # Check if already purchased
    if has_purchased(user_id, pack_id, db):
        raise HTTPException(400, "You already own this style pack")
    
    # Get pack details
    pack = await db.style_packs.find_one({"id": pack_id})
    if not pack:
        raise HTTPException(404, "Style pack not found")
    
    # Create Stripe checkout session
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": pack["name"],
                        "description": pack["description"],
                        "images": pack["preview_images"][:1]  # First preview image
                    },
                    "unit_amount": pack["price_cents"]
                },
                "quantity": 1
            }],
            mode="payment",  # One-time payment
            success_url=request.success_url,
            cancel_url=request.cancel_url,
            client_reference_id=user_id,
            metadata={
                "user_id": user_id,
                "style_pack_id": pack_id,
                "type": "style_pack_purchase"
            }
        )
        
        return {
            "session_id": session.id,
            "url": session.url
        }
    except stripe.error.StripeError as e:
        raise HTTPException(500, f"Stripe error: {str(e)}")

@router.get("/owned")
async def get_owned_packs(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get user's owned style packs"""
    user_id = current_user["id"]
    
    purchases = await db.style_pack_purchases.find({"user_id": user_id}).to_list(100)
    pack_ids = [p["style_pack_id"] for p in purchases]
    
    packs = await db.style_packs.find({"id": {"$in": pack_ids}}).to_list(100)
    
    return {
        "count": len(packs),
        "packs": packs
    }

@router.get("/download/{pack_id}")
async def download_style_pack(
    pack_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get download URL for owned style pack"""
    user_id = current_user["id"]
    
    # Verify ownership
    if not has_purchased(user_id, pack_id, db):
        raise HTTPException(403, "You don't own this style pack")
    
    # Get pack
    pack = await db.style_packs.find_one({"id": pack_id})
    if not pack:
        raise HTTPException(404, "Style pack not found")
    
    # Generate presigned S3 URL (expires in 1 hour)
    import boto3
    s3 = boto3.client('s3')
    
    try:
        download_url = s3.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': os.getenv('AWS_S3_BUCKET'),
                'Key': pack["lora_url"]
            },
            ExpiresIn=3600  # 1 hour
        )
        
        return {
            "download_url": download_url,
            "expires_in": 3600,
            "filename": f"{pack['name'].replace(' ', '_')}.safetensors"
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to generate download URL: {str(e)}")

# Webhook handler for style pack purchases
async def handle_style_pack_purchase(session: dict, db):
    """Process completed style pack purchase"""
    user_id = session["metadata"]["user_id"]
    pack_id = session["metadata"]["style_pack_id"]
    payment_id = session["payment_intent"]
    
    # Create purchase record
    await db.style_pack_purchases.create({
        "user_id": user_id,
        "style_pack_id": pack_id,
        "stripe_payment_id": payment_id,
        "purchased_at": datetime.now()
    })
    
    # Grant access
    await grant_style_pack_access(user_id, pack_id, db)

def get_database():
    """Dependency to get database connection"""
    pass
