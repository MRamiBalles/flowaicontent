"""
Enhanced Referral Service
Handles gamified referrals, token rewards, and social sharing.
"""

import logging
import random
import string
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class ReferralService:
    def __init__(self):
        # Mock database
        self.referral_codes = {} # {code: user_id}
        self.user_codes = {} # {user_id: code}
        self.referrals = {} # {referrer_id: [referee_ids]}
        self.rewards = {} # {user_id: token_amount}

    def generate_code(self, user_id: str) -> str:
        """Generate or retrieve unique referral code."""
        if user_id in self.user_codes:
            return self.user_codes[user_id]
        
        # Generate random 6-char code
        chars = string.ascii_uppercase + string.digits
        code = ''.join(random.choice(chars) for _ in range(6))
        
        self.referral_codes[code] = user_id
        self.user_codes[user_id] = code
        return code

    async def process_referral(self, code: str, new_user_id: str) -> Dict[str, Any]:
        """Link new user to referrer and award tokens."""
        referrer_id = self.referral_codes.get(code)
        if not referrer_id:
            return {"status": "invalid_code"}
            
        if referrer_id == new_user_id:
            return {"status": "self_referral"}

        # Record referral
        if referrer_id not in self.referrals:
            self.referrals[referrer_id] = []
        self.referrals[referrer_id].append(new_user_id)

        # Award tokens (Mock)
        self._award_tokens(referrer_id, 100) # 100 FLOW for referrer
        self._award_tokens(new_user_id, 50)  # 50 FLOW for referee

        # Check milestones
        bonus = self._check_milestones(referrer_id)
        
        return {
            "status": "success",
            "referrer_id": referrer_id,
            "reward_referrer": 100,
            "reward_referee": 50,
            "milestone_bonus": bonus
        }

    def _award_tokens(self, user_id: str, amount: int):
        current = self.rewards.get(user_id, 0)
        self.rewards[user_id] = current + amount
        logger.info(f"Awarded {amount} FLOW to {user_id}")

    def _check_milestones(self, user_id: str) -> int:
        count = len(self.referrals.get(user_id, []))
        bonus = 0
        
        if count == 5:
            bonus = 500
        elif count == 10:
            bonus = 1500
        elif count == 25:
            bonus = 5000
            
        if bonus > 0:
            self._award_tokens(user_id, bonus)
            logger.info(f"Milestone reached! User {user_id} gets {bonus} bonus FLOW")
            
        return bonus

    def get_stats(self, user_id: str) -> Dict[str, Any]:
        return {
            "total_referrals": len(self.referrals.get(user_id, [])),
            "total_earned": self.rewards.get(user_id, 0),
            "code": self.user_codes.get(user_id)
        }

    def get_social_share_links(self, code: str) -> Dict[str, str]:
        base_url = "https://flowai.com/join"
        link = f"{base_url}?ref={code}"
        text = "Join me on FlowAI and create amazing AI content! Use my code to get 50 FLOW tokens."
        
        return {
            "twitter": f"https://twitter.com/intent/tweet?text={text}&url={link}",
            "whatsapp": f"https://wa.me/?text={text} {link}",
            "telegram": f"https://t.me/share/url?url={link}&text={text}",
            "copy": link
        }

# Global instance
referral_service = ReferralService()
