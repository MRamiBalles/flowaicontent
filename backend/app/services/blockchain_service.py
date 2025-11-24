"""
Blockchain Service
Interact with FloToken smart contract for token economy
"""

from web3 import Web3
from eth_account import Account
import os
import json
from typing import Optional

# Connect to Polygon network
POLYGON_RPC = os.getenv("POLYGON_RPC_URL", "https://polygon-rpc.com")
w3 = Web3(Web3.HTTPProvider(POLYGON_RPC))

# Platform wallet (holds tokens, can mint)
PLATFORM_PRIVATE_KEY = os.getenv("PLATFORM_PRIVATE_KEY")
platform_account = Account.from_key(PLATFORM_PRIVATE_KEY) if PLATFORM_PRIVATE_KEY else None

# Contract address (deploy first, then set in .env)
CONTRACT_ADDRESS = os.getenv("FLO_TOKEN_CONTRACT_ADDRESS")

# Load contract ABI
with open("contracts/FloToken.json", "r") as f:
    contract_abi = json.load(f)["abi"]

# Initialize contract
if CONTRACT_ADDRESS and w3.is_connected():
    token_contract = w3.eth.contract(
        address=Web3.to_checksum_address(CONTRACT_ADDRESS),
        abi=contract_abi
    )
else:
    token_contract = None

class BlockchainService:
    """Service for blockchain operations"""
    
    @staticmethod
    def get_token_balance(user_address: str) -> int:
        """Get user's token balance (in wei, divide by 10^18 for actual tokens)"""
        if not token_contract:
            return 0
        
        balance = token_contract.functions.balanceOf(
            Web3.to_checksum_address(user_address)
        ).call()
        
        # Convert from wei to tokens
        return balance // (10 ** 18)
    
    @staticmethod
    async def mint_tokens_for_purchase(
        user_address: str,
        token_amount: int,
        usd_value: float
    ) -> str:
        """
        Mint tokens to user after fiat purchase
        Returns: transaction hash
        """
        if not token_contract or not platform_account:
            raise Exception("Blockchain not configured")
        
        # Convert to wei (18 decimals)
        amount_wei = token_amount * (10 ** 18)
        usd_cents = int(usd_value * 100)
        
        # Build transaction
        function_call = token_contract.functions.mintToPurchaser(
            Web3.to_checksum_address(user_address),
            amount_wei,
            usd_cents
        )
        
        # Estimate gas
        gas_estimate = function_call.estimate_gas({'from': platform_account.address})
        
        # Build and sign transaction
        transaction = function_call.build_transaction({
            'from': platform_account.address,
            'gas': gas_estimate,
            'gasPrice': w3.eth.gas_price,
            'nonce': w3.eth.get_transaction_count(platform_account.address),
        })
        
        signed_txn = w3.eth.account.sign_transaction(transaction, PLATFORM_PRIVATE_KEY)
        
        # Send transaction
        tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        
        # Wait for confirmation (optional, can be async)
        # receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        
        return tx_hash.hex()
    
    @staticmethod
    async def award_tokens(
        user_address: str,
        amount: int,
        reason: str
    ) -> str:
        """
        Award tokens for platform activity (PoA, content creation, etc)
        """
        if not token_contract or not platform_account:
            raise Exception("Blockchain not configured")
        
        amount_wei = amount * (10 ** 18)
        
        function_call = token_contract.functions.awardTokens(
            Web3.to_checksum_address(user_address),
            amount_wei,
            reason
        )
        
        gas_estimate = function_call.estimate_gas({'from': platform_account.address})
        
        transaction = function_call.build_transaction({
            'from': platform_account.address,
            'gas': gas_estimate,
            'gasPrice': w3.eth.gas_price,
            'nonce': w3.eth.get_transaction_count(platform_account.address),
        })
        
        signed_txn = w3.eth.account.sign_transaction(transaction, PLATFORM_PRIVATE_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        
        return tx_hash.hex()
    
    @staticmethod
    async def burn_tokens_for_cashout(
        user_address: str,
        amount: int
    ) -> str:
        """
        Burn tokens when user cashes out to fiat
        """
        if not token_contract or not platform_account:
            raise Exception("Blockchain not configured")
        
        amount_wei = amount * (10 ** 18)
        
        function_call = token_contract.functions.cashOut(
            Web3.to_checksum_address(user_address),
            amount_wei
        )
        
        gas_estimate = function_call.estimate_gas({'from': platform_account.address})
        
        transaction = function_call.build_transaction({
            'from': platform_account.address,
            'gas': gas_estimate,
            'gasPrice': w3.eth.gas_price,
            'nonce': w3.eth.get_transaction_count(platform_account.address),
        })
        
        signed_txn = w3.eth.account.sign_transaction(transaction, PLATFORM_PRIVATE_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        
        return tx_hash.hex()
    
    @staticmethod
    def get_user_stats(user_address: str) -> dict:
        """Get user's token statistics"""
        if not token_contract:
            return {"balance": 0, "earned": 0, "spent": 0}
        
        stats = token_contract.functions.getUserStats(
            Web3.to_checksum_address(user_address)
        ).call()
        
        return {
            "balance": stats[0] // (10 ** 18),
            "earned": stats[1] // (10 ** 18),
            "spent": stats[2] // (10 ** 18)
        }

# Token pricing (how many tokens per dollar)
TOKENS_PER_DOLLAR = 100  # 1 USD = 100 FLO

def calculate_token_amount(usd_amount: float) -> int:
    """Calculate how many tokens user gets for USD amount"""
    base_tokens = int(usd_amount * TOKENS_PER_DOLLAR)
    
    # Bonus tiers
    if usd_amount >= 100:
        bonus = int(base_tokens * 0.15)  # 15% bonus
    elif usd_amount >= 50:
        bonus = int(base_tokens * 0.10)  # 10% bonus
    elif usd_amount >= 10:
        bonus = int(base_tokens * 0.05)  # 5% bonus
    else:
        bonus = 0
    
    return base_tokens + bonus

def calculate_cashout_amount(token_amount: int) -> float:
    """Calculate USD amount for token cashout (with 20% platform fee)"""
    gross_usd = token_amount / TOKENS_PER_DOLLAR
    platform_fee = gross_usd * 0.20  # 20% fee
    net_usd = gross_usd - platform_fee
    
    return round(net_usd, 2)
