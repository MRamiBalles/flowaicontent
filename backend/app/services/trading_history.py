"""
Trading History Service
Tracks marketplace transactions and historical price data.
"""

import logging
from typing import List, Dict, Any
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class TradingHistoryService:
    def __init__(self):
        # Mock transaction database
        self.transactions = [
            {
                "tx_id": "0x123...abc",
                "asset_id": "nft_1",
                "price": 45,
                "seller": "0xSeller1",
                "buyer": "0xBuyer1",
                "timestamp": (datetime.utcnow() - timedelta(days=2)).isoformat()
            },
            {
                "tx_id": "0x456...def",
                "asset_id": "nft_1",
                "price": 50,
                "seller": "0xBuyer1",
                "buyer": "0xBuyer2",
                "timestamp": datetime.utcnow().isoformat()
            },
            {
                "tx_id": "0x789...ghi",
                "asset_id": "nft_2",
                "price": 120,
                "seller": "0xSeller2",
                "buyer": "0xBuyer3",
                "timestamp": (datetime.utcnow() - timedelta(hours=5)).isoformat()
            }
        ]

    async def get_asset_history(self, asset_id: str) -> List[Dict[str, Any]]:
        """Get transaction history for a specific asset."""
        return [tx for tx in self.transactions if tx["asset_id"] == asset_id]

    async def get_recent_activity(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get most recent platform transactions."""
        return sorted(self.transactions, key=lambda x: x["timestamp"], reverse=True)[:limit]

    async def get_platform_stats(self) -> Dict[str, Any]:
        """Get total volume and transaction count."""
        total_volume = sum(tx["price"] for tx in self.transactions)
        return {
            "total_volume": total_volume,
            "total_transactions": len(self.transactions),
            "24h_volume": 170  # Mock 24h volume
        }

# Global instance
trading_history_service = TradingHistoryService()
