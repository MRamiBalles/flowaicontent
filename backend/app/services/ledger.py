from typing import Dict, List, Optional
import time

class LedgerService:
    """
    Simulates a centralized ledger for the Attention Economy.
    In production, this would interface with a Blockchain (e.g., Solana/Polygon).
    """
    def __init__(self):
        # In-memory storage for simulation
        # Format: {user_id: balance}
        self.balances: Dict[str, float] = {}
        # Format: {user_id: [{timestamp, amount, reason, type}]}
        self.transactions: Dict[str, List[Dict]] = {}
        
        # Economy Constants
        self.TOKENS_PER_MINUTE_VIEW = 10.0
        self.CREATOR_REWARD_MULTIPLIER = 5.0

    def get_balance(self, user_id: str) -> float:
        return self.balances.get(user_id, 0.0)

    def get_transactions(self, user_id: str) -> List[Dict]:
        return self.transactions.get(user_id, [])

    def mint(self, user_id: str, amount: float, reason: str):
        """
        Mints new tokens for a user (e.g., PoA rewards).
        """
        if user_id not in self.balances:
            self.balances[user_id] = 0.0
            self.transactions[user_id] = []
            
        self.balances[user_id] += amount
        
        tx = {
            "timestamp": time.time(),
            "amount": amount,
            "reason": reason,
            "type": "MINT"
        }
        self.transactions[user_id].append(tx)
        return tx

    def process_poa(self, user_id: str, duration_seconds: float) -> float:
        """
        Processes Proof-of-Attention heartbeat.
        Calculates reward based on duration.
        """
        # Calculate reward: (duration / 60) * TOKENS_PER_MINUTE
        reward = (duration_seconds / 60.0) * self.TOKENS_PER_MINUTE_VIEW
        
        self.mint(user_id, reward, "Proof-of-Attention Reward")
        return reward

ledger_service = LedgerService()
