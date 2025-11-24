"""
Token API Endpoints
Purchase, earn, spend, and cash out tokens
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.services.blockchain_service import (
    BlockchainService,
    calculate_token_amount,
    calculate_cashout_amount,
    TOKENS_PER_DOLLAR
)
import stripe
import os

router = APIRouter(prefix="/tokens", tags=["tokens"])

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

class TokenPurchaseRequest(BaseModel):
    amount_usd: float  # How much USD to spend
    success_url: str
    cancel_url: str

class TokenCashoutRequest(BaseModel):
    token_amount: int  # How many tokens to cash out

@router.get("/balance")
async def get_token_balance(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get user's current token balance"""
    user_address = current_user.get("wallet_address")
    
    if not user_address:
        # User hasn't connected wallet, return DB balance
        user = await db.users.find_one({"id": current_user["id"]})
        return {
            "balance": user.get("tokens_balance", 0),
            "source": "database"
        }
    
    # Get balance from blockchain
    balance = BlockchainService.get_token_balance(user_address)
    return {
        "balance": balance,
        "source": "blockchain"
    }

@router.post("/purchase")
async def purchase_tokens(
    request: TokenPurchaseRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create Stripe checkout session to purchase tokens"""
    user_id = current_user["id"]
    
    # Calculate token amount with bonuses
    token_amount = calculate_token_amount(request.amount_usd)
    
    # Create Stripe checkout session
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": f"{token_amount} FLO Tokens",
                        "description": f"Includes bonus tokens! Base rate: $1 = {TOKENS_PER_DOLLAR} FLO"
                    },
                    "unit_amount": int(request.amount_usd * 100)  # cents
                },
                "quantity": 1
            }],
            mode="payment",
            success_url=request.success_url,
            cancel_url=request.cancel_url,
            client_reference_id=user_id,
            metadata={
                "user_id": user_id,
                "token_amount": token_amount,
                "type": "token_purchase"
            }
        )
        
        return {
            "session_id": session.id,
            "url": session.url,
            "token_amount": token_amount,
            "bonus_tokens": token_amount - int(request.amount_usd * TOKENS_PER_DOLLAR)
        }
    except stripe.error.StripeError as e:
        raise HTTPException(500, f"Stripe error: {str(e)}")

@router.post("/cashout")
async def cash_out_tokens(
    request: TokenCashoutRequest,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Cash out tokens to fiat"""
    user_id = current_user["id"]
    
    # Minimum cashout: 1000 tokens ($10)
    if request.token_amount < 1000:
        raise HTTPException(400, "Minimum cashout is 1000 tokens ($10)")
    
    # Check balance
    user = await db.users.find_one({"id": user_id})
    balance = user.get("tokens_balance", 0)
    
    if balance < request.token_amount:
        raise HTTPException(400, "Insufficient token balance")
    
    # Calculate USD amount (minus 20% fee)
    usd_amount = calculate_cashout_amount(request.token_amount)
    
    # Check if user has Stripe account for payout
    stripe_account_id = user.get("stripe_account_id")
    if not stripe_account_id:
        raise HTTPException(400, "Please connect your bank account first")
    
    # Create Stripe payout
    try:
        payout = stripe.Transfer.create(
            amount=int(usd_amount * 100),  # cents
            currency="usd",
            destination=stripe_account_id,
            description=f"FlowAI token cashout: {request.token_amount} tokens"
        )
        
        # Burn tokens from blockchain (if user has wallet)
        user_address = user.get("wallet_address")
        if user_address:
            tx_hash = await BlockchainService.burn_tokens_for_cashout(
                user_address,
                request.token_amount
            )
        else:
            tx_hash = None
        
        # Update database
        await db.users.update(
            {"id": user_id},
            {"$inc": {"tokens_balance": -request.token_amount}}
        )
        
        # Record transaction
        await db.token_transactions.create({
            "user_id": user_id,
            "amount": -request.token_amount,
            "type": "cashout",
            "blockchain_tx_hash": tx_hash,
            "stripe_payout_id": payout.id,
            "usd_amount": usd_amount
        })
        
        return {
            "success": True,
            "tokens_cashed_out": request.token_amount,
            "usd_received": usd_amount,
            "platform_fee": round(request.token_amount / TOKENS_PER_DOLLAR * 0.20, 2),
            "payout_id": payout.id
        }
    except stripe.error.StripeError as e:
        raise HTTPException(500, f"Payout failed: {str(e)}")

@router.get("/stats")
async def get_token_stats(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get user's token earning/spending statistics"""
    user_id = current_user["id"]
    user_address = current_user.get("wallet_address")
    
    # Get blockchain stats if wallet connected
    if user_address:
        stats = BlockchainService.get_user_stats(user_address)
        return stats
    
    # Otherwise, get from database
    user = await db.users.find_one({"id": user_id})
    
    # Calculate from transaction history
    transactions = await db.token_transactions.find({"user_id": user_id}).to_list(1000)
    
    earned = sum(t["amount"] for t in transactions if t["amount"] > 0)
    spent = sum(abs(t["amount"]) for t in transactions if t["amount"] < 0)
    
    return {
        "balance": user.get("tokens_balance", 0),
        "earned": earned,
        "spent": spent
    }

@router.get("/pricing")
async def get_token_pricing():
    """Get token pricing information"""
    return {
        "base_rate": TOKENS_PER_DOLLAR,
        "currency": "USD",
        "bonus_tiers": [
            {"min_purchase": 10, "bonus_percent": 5},
            {"min_purchase": 50, "bonus_percent": 10},
            {"min_purchase": 100, "bonus_percent": 15}
        ],
        "cashout_fee_percent": 20,
        "minimum_cashout": 1000
    }

# Webhook handler for token purchases
async def handle_token_purchase(session: dict, db):
    """Process completed token purchase"""
    user_id = session["metadata"]["user_id"]
    token_amount = int(session["metadata"]["token_amount"])
    payment_id = session["payment_intent"]
    
    # Get user
    user = await db.users.find_one({"id": user_id})
    user_address = user.get("wallet_address")
    
    # Mint tokens to blockchain if user has wallet
    if user_address:
        tx_hash = await BlockchainService.mint_tokens_for_purchase(
            user_address,
            token_amount,
            session["amount_total"] / 100
        )
    else:
        tx_hash = None
    
    # Update database balance
    await db.users.update(
        {"id": user_id},
        {"$inc": {"tokens_balance": token_amount}}
    )
    
    # Record transaction
    await db.token_transactions.create({
        "user_id": user_id,
        "amount": token_amount,
        "type": "purchase",
        "stripe_payment_id": payment_id,
        "blockchain_tx_hash": tx_hash
    })

def get_current_user():
    pass

def get_database():
    pass
