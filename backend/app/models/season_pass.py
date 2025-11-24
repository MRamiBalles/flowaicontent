"""
Season Pass System - Battle Pass Style
Track user progress through seasons with quests and rewards
"""

from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import List, Optional, Dict
import uuid

class Quest(BaseModel):
    """Individual quest/challenge"""
    id: str
    title: str
    description: str
    type: str  # 'daily', 'weekly', 'seasonal'
    objective: str  # 'generate_videos', 'get_likes', 'earn_tokens', etc.
    target_amount: int
    current_progress: int = 0
    reward_xp: int
    reward_tokens: int = 0
    completed: bool = False
    expires_at: Optional[datetime] = None

class SeasonPassTier(BaseModel):
    """Individual tier in the season pass"""
    tier: int
    xp_required: int
    free_reward: Dict  # {'type': 'tokens', 'amount': 50}
    premium_reward: Optional[Dict] = None  # Extra reward for premium pass holders

class SeasonPass(BaseModel):
    """Season pass instance"""
    id: uuid.UUID
    user_id: uuid.UUID
    season_number: int
    current_xp: int = 0
    current_tier: int = 1
    is_premium: bool = False  # Paid for premium track
    quests: List[Quest] = []
    created_at: datetime
    expires_at: datetime

# Season configuration
SEASON_DURATION_DAYS = 90
SEASON_PASS_PRICE = 999  # tokens

# XP required per tier (exponential growth)
def calculate_tier_xp(tier: int) -> int:
    """Calculate XP required for a tier"""
    base_xp = 100
    return int(base_xp * (1.2 ** (tier - 1)))

# Generate tier rewards
def generate_season_tiers(max_tier: int = 50) -> List[SeasonPassTier]:
    """Generate all tiers for a season"""
    tiers = []
    
    for tier in range(1, max_tier + 1):
        xp_required = calculate_tier_xp(tier)
        
        # Free rewards (everyone gets)
        free_reward = {
            'type': 'tokens',
            'amount': 25 * tier  # Scales with tier
        }
        
        # Premium rewards (only premium pass holders)
        premium_reward = None
        if tier % 5 == 0:  # Every 5 tiers, premium gets special reward
            premium_reward = {
                'type': 'style_pack',
                'item_id': f'exclusive_season_{tier}'
            }
        elif tier % 10 == 0:  # Every 10 tiers, big token bonus
            premium_reward = {
                'type': 'tokens',
                'amount': 500
            }
        else:
            premium_reward = {
                'type': 'tokens',
                'amount': 50 * tier
            }
        
        tiers.append(SeasonPassTier(
            tier=tier,
            xp_required=xp_required,
            free_reward=free_reward,
            premium_reward=premium_reward
        ))
    
    return tiers

# Daily quests templates
DAILY_QUESTS = [
    {
        'title': 'Daily Creator',
        'description': 'Generate 3 videos today',
        'objective': 'generate_videos',
        'target': 3,
        'reward_xp': 50,
        'reward_tokens': 10
    },
    {
        'title': 'Social Butterfly',
        'description': 'Comment on 5 videos',
        'objective': 'add_comments',
        'target': 5,
        'reward_xp': 30,
        'reward_tokens': 5
    },
    {
        'title': 'Remix Master',
        'description': 'Remix 2 videos',
        'objective': 'create_remixes',
        'target': 2,
        'reward_xp': 40,
        'reward_tokens': 8
    },
    {
        'title': 'Token Earner',
        'description': 'Earn 50 tokens from any source',
        'objective': 'earn_tokens',
        'target': 50,
        'reward_xp': 60,
        'reward_tokens': 0
    }
]

# Weekly quests
WEEKLY_QUESTS = [
    {
        'title': 'Power User',
        'description': 'Generate 25 videos this week',
        'objective': 'generate_videos',
        'target': 25,
        'reward_xp': 300,
        'reward_tokens': 100
    },
    {
        'title': 'Viral Content',
        'description': 'Get 1000 total views on your videos',
        'objective': 'get_views',
        'target': 1000,
        'reward_xp': 500,
        'reward_tokens': 200
    },
    {
        'title': 'Community Leader',
        'description': 'Get 50 likes across all videos',
        'objective': 'get_likes',
        'target': 50,
        'reward_xp': 400,
        'reward_tokens': 150
    }
]

async def create_season_pass(user_id: str, season_number: int, db) -> SeasonPass:
    """Create new season pass for user"""
    now = datetime.now()
    
    # Generate daily quests
    import random
    daily_quests = [
        Quest(
            id=str(uuid.uuid4()),
            **{**q, 'type': 'daily', 'expires_at': now + timedelta(days=1)}
        )
        for q in random.sample(DAILY_QUESTS, 2)  # 2 random daily quests
    ]
    
    # Generate weekly quest
    weekly_quest = Quest(
        id=str(uuid.uuid4()),
        **{**WEEKLY_QUESTS[0], 'type': 'weekly', 'expires_at': now + timedelta(weeks=1)}
    )
    
    season_pass = SeasonPass(
        id=uuid.uuid4(),
        user_id=user_id,
        season_number=season_number,
        current_xp=0,
        current_tier=1,
        is_premium=False,
        quests=daily_quests + [weekly_quest],
        created_at=now,
        expires_at=now + timedelta(days=SEASON_DURATION_DAYS)
    )
    
    await db.season_passes.create(season_pass.dict())
    
    return season_pass

async def track_quest_progress(user_id: str, objective: str, amount: int, db):
    """Update quest progress when user performs actions"""
    # Get user's active season pass
    season_pass = await db.season_passes.find_one({
        'user_id': user_id,
        'expires_at': {'$gt': datetime.now()}
    })
    
    if not season_pass:
        return
    
    # Update relevant quests
    quests_updated = []
    for quest in season_pass['quests']:
        if quest['objective'] == objective and not quest['completed']:
            quest['current_progress'] = min(
                quest['current_progress'] + amount,
                quest['target_amount']
            )
            
            # Check if completed
            if quest['current_progress'] >= quest['target_amount']:
                quest['completed'] = True
                
                # Award XP
                season_pass['current_xp'] += quest['reward_xp']
                
                # Award tokens
                if quest['reward_tokens'] > 0:
                    await db.users.update(
                        {'id': user_id},
                        {'$inc': {'tokens_balance': quest['reward_tokens']}}
                    )
                
                quests_updated.append(quest)
    
    # Check for tier up
    tiers = generate_season_tiers()
    new_tier = 1
    for tier in tiers:
        if season_pass['current_xp'] >= tier.xp_required:
            new_tier = tier.tier
    
    if new_tier > season_pass['current_tier']:
        # Level up! Award rewards
        for tier_num in range(season_pass['current_tier'] + 1, new_tier + 1):
            tier = tiers[tier_num - 1]
            
            # Free reward
            if tier.free_reward['type'] == 'tokens':
                await db.users.update(
                    {'id': user_id},
                    {'$inc': {'tokens_balance': tier.free_reward['amount']}}
                )
            
            # Premium reward
            if season_pass['is_premium'] and tier.premium_reward:
                if tier.premium_reward['type'] == 'tokens':
                    await db.users.update(
                        {'id': user_id},
                        {'$inc': {'tokens_balance': tier.premium_reward['amount']}}
                    )
        
        season_pass['current_tier'] = new_tier
    
    # Save updates
    await db.season_passes.update(
        {'id': season_pass['id']},
        {'$set': season_pass}
    )
    
    return {
        'quests_completed': quests_updated,
        'new_tier': new_tier if new_tier > season_pass['current_tier'] else None,
        'current_xp': season_pass['current_xp']
    }

async def purchase_premium_pass(user_id: str, db):
    """Upgrade to premium season pass"""
    # Check balance
    user = await db.users.find_one({'id': user_id})
    if user.get('tokens_balance', 0) < SEASON_PASS_PRICE:
        raise ValueError('Insufficient tokens')
    
    # Deduct tokens
    await db.users.update(
        {'id': user_id},
        {'$inc': {'tokens_balance': -SEASON_PASS_PRICE}}
    )
    
    # Upgrade pass
    await db.season_passes.update(
        {'user_id': user_id, 'expires_at': {'$gt': datetime.now()}},
        {'$set': {'is_premium': True}}
    )
    
    return True
