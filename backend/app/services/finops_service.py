import asyncio
import time
from typing import Dict, Any, Tuple, Optional
from enum import Enum
import threading

class BudgetStatus(Enum):
    ALLOWED = "allowed"
    REJECTED_INSUFFICIENT_FUNDS = "rejected_insufficient_funds"
    REJECTED_RATE_LIMIT = "rejected_rate_limit"

class FinOpsService:
    """
    2026 Gold Standard FinOps Service.
    Handles Atomic Credit Deductions and Rate Limiting for AI Agents.
    """
    def __init__(self):
        # Simulated DB: tenant_id -> credits (USD)
        self._credits: Dict[str, float] = {}
        # Rate limit tracking: tenant_id -> [timestamps]
        self._request_history: Dict[str, list] = {}
        # Thread lock for atomic simulation in Python memory
        self._lock = threading.Lock()
        
        # Rate Limit config: max requests per second
        self.MAX_RPS = 10
        
    def set_credits(self, tenant_id: str, amount: float):
        """Mock method to seed credits"""
        with self._lock:
            self._credits[tenant_id] = amount

    async def check_and_spend(self, tenant_id: str, cost_estimate: float) -> Tuple[BudgetStatus, Optional[str]]:
        """
        Atomic operation to check rules and deduct costs.
        In production: This would be a single SQL UPDATE with RETURNING.
        """
        with self._lock:
            # 1. Rate Limit Check
            now = time.time()
            history = self._request_history.get(tenant_id, [])
            # Keep only last second
            history = [t for t in history if now - t < 1.0]
            
            if len(history) >= self.MAX_RPS:
                return BudgetStatus.REJECTED_RATE_LIMIT, f"Rate limit exceeded: {self.MAX_RPS} RPS"
            
            # Update history
            history.append(now)
            self._request_history[tenant_id] = history

            # 2. Credit Check & Atomic Deduction
            current_balance = self._credits.get(tenant_id, 0.0)
            
            if current_balance < cost_estimate:
                return BudgetStatus.REJECTED_INSUFFICIENT_FUNDS, f"Insufficient funds: ${current_balance:.4f} < ${cost_estimate:.4f}"
            
            # Atomic subtraction
            self._credits[tenant_id] -= cost_estimate
            new_balance = self._credits[tenant_id]
            
            print(f"[FINOPS] Tenant {tenant_id} spent ${cost_estimate:.4f}. Balance: ${new_balance:.4f}")
            return BudgetStatus.ALLOWED, None

    def get_balance(self, tenant_id: str) -> float:
        return self._credits.get(tenant_id, 0.0)

finops_service = FinOpsService()
