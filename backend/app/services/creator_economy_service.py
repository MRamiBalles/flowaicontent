"""
Creator Economy Service
Handles Creator Coins using a bonding curve mechanism.
Price = Supply^2 * Coefficient
"""

import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class CreatorEconomyService:
    def __init__(self):
        # Mock database for coin supplies and user holdings
        self.coin_supplies = {
            "user_1": 100,  # Initial supply
            "user_2": 500
        }
        self.user_holdings = {} # {user_id: {creator_id: amount}}
        self.coefficient = 0.001 # Price scaling factor

    def _calculate_price(self, supply: int, amount: int) -> float:
        """
        Calculate cost to mint 'amount' coins starting from 'supply'.
        Integral of Price Function (Supply^2 * k)
        """
        # Simplified for MVP: Price = Current Supply * k
        return supply * self.coefficient * amount

    async def get_coin_info(self, creator_id: str) -> Dict[str, Any]:
        """Get current price and supply of a creator coin."""
        supply = self.coin_supplies.get(creator_id, 0)
        price = supply * self.coefficient
        return {
            "creator_id": creator_id,
            "supply": supply,
            "current_price": price,
            "market_cap": price * supply
        }

    async def buy_coin(self, user_id: str, creator_id: str, amount: int) -> Dict[str, Any]:
        """Buy creator coins."""
        current_supply = self.coin_supplies.get(creator_id, 0)
        cost = self._calculate_price(current_supply, amount)
        
        # In prod: Verify user has enough FLOW tokens -> Transfer FLOW to contract
        
        # Update supply
        self.coin_supplies[creator_id] = current_supply + amount
        
        # Update holdings
        if user_id not in self.user_holdings:
            self.user_holdings[user_id] = {}
        
        current_holding = self.user_holdings[user_id].get(creator_id, 0)
        self.user_holdings[user_id][creator_id] = current_holding + amount
        
        return {
            "status": "success",
            "bought_amount": amount,
            "cost_flow": cost,
            "new_supply": self.coin_supplies[creator_id]
        }

    async def sell_coin(self, user_id: str, creator_id: str, amount: int) -> Dict[str, Any]:
        """Sell creator coins."""
        # Check holdings
        holdings = self.user_holdings.get(user_id, {}).get(creator_id, 0)
        if holdings < amount:
            raise ValueError("Insufficient coins")
            
        current_supply = self.coin_supplies.get(creator_id, 0)
        # Sell price is slightly lower (slippage/fee)
        return_amount = self._calculate_price(current_supply - amount, amount) * 0.95
        
        # Update supply and holdings
        self.coin_supplies[creator_id] = current_supply - amount
        self.user_holdings[user_id][creator_id] = holdings - amount
        
        return {
            "status": "success",
            "sold_amount": amount,
            "return_flow": return_amount,
            "new_supply": self.coin_supplies[creator_id]
        }

# Global instance
creator_economy_service = CreatorEconomyService()
