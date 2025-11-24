"""
Push Notification Service
Handles storage of subscriptions and sending of push messages.
"""

import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class PushNotificationService:
    def __init__(self):
        # Mock database for subscriptions: {user_id: [subscription_objects]}
        self.subscriptions: Dict[str, List[Dict[str, Any]]] = {}

    async def add_subscription(self, user_id: str, subscription: Dict[str, Any]):
        """Save a user's push subscription."""
        if user_id not in self.subscriptions:
            self.subscriptions[user_id] = []
        
        # Avoid duplicates
        if subscription not in self.subscriptions[user_id]:
            self.subscriptions[user_id].append(subscription)
            logger.info(f"New subscription added for user {user_id}")

    async def send_notification(self, user_id: str, title: str, body: str):
        """
        Send a push notification to a user.
        In prod: Use pywebpush to send to the subscription endpoint.
        """
        user_subs = self.subscriptions.get(user_id, [])
        if not user_subs:
            logger.warning(f"No subscriptions found for user {user_id}")
            return

        logger.info(f"Sending push to {user_id}: {title} - {body}")
        
        # Mock sending process
        # for sub in user_subs:
        #     webpush(sub, data={"title": title, "body": body})
        
        return {"status": "sent", "count": len(user_subs)}

# Global instance
push_service = PushNotificationService()
