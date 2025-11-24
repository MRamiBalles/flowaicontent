"""
Achievements & Leaderboards System
Track user achievements and rankings
"""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional
import uuid

class Achievement(BaseModel):
    """Achievement definition"""
    id: str
    name: str
    description: str
    icon: str  # Icon name or URL
    category: str  # 'generation', 'social', 'earning', 'viral'
    rarity: str  # 'common', 'rare', 'epic', 'legendary'
    requirement: str  # What user needs to do
    target_value: int
    reward_tokens: int
    reward_badge: Optional[str] = None

class UserAchievement(BaseModel):
    """User's achievement progress"""
    id: uuid.UUID
    user_id: uuid.UUID
    achievement_id: str
    current_progress: int = 0
    unlocked: bool = False
    unlocked_at: Optional[datetime] = None

# Achievement definitions
ACHIEVEMENTS = [
    # Generation achievements
    Achievement(
        id='first_video',
        name='First Steps',
        description='Generate your first video',
        icon='🎬',
        category='generation',
        rarity='common',
        requirement='generate_videos',
        target_value=1,
        reward_tokens=10
    ),
    Achievement(
        id='video_100',
        name='Prolific Creator',
        description='Generate 100 videos',
        icon='🎥',
        category='generation',
        rarity='rare',
        requirement='generate_videos',
        target_value=100,
        reward_tokens=500
    ),
    Achievement(
        id='video_1000',
        name='Content Machine',
        description='Generate 1000 videos',
        icon='🏭',
        category='generation',
        rarity='legendary',
        requirement='generate_videos',
        target_value=1000,
        reward_tokens=5000,
        reward_badge='legendary_creator'
    ),
    
    # Social achievements
    Achievement(
        id='first_like',
        name='Appreciated',
        description='Get your first like',
        icon='💖',
        category='social',
        rarity='common',
        requirement='get_likes',
        target_value=1,
        reward_tokens=5
    ),
    Achievement(
        id='likes_1000',
        name='Community Favorite',
        description='Get 1000 total likes',
        icon='⭐',
        category='social',
        rarity='epic',
        requirement='get_likes',
        target_value=1000,
        reward_tokens=1000
    ),
    Achievement(
        id='viral_clip',
        name='Viral Sensation',
        description='Get 10,000 views on a single clip',
        icon='🚀',
        category='viral',
        rarity='legendary',
        requirement='single_clip_views',
        target_value=10000,
        reward_tokens=2000
    ),
    
    # Earning achievements
    Achievement(
        id='first_tokens',
        name='Token Collector',
        description='Earn your first 100 tokens',
        icon='🪙',
        category='earning',
        rarity='common',
        requirement='earn_tokens',
        target_value=100,
        reward_tokens=25
    ),
    Achievement(
        id='tokens_10k',
        name='Crypto Whale',
        description='Accumulate 10,000 tokens',
        icon='🐳',
        category='earning',
        rarity='legendary',
        requirement='total_tokens_earned',
        target_value=10000,
        reward_tokens=1000
    ),
    
    # Viral achievements
    Achievement(
        id='first_remix',
        name='Remix Rookie',
        description='Create your first remix',
        icon='🔀',
        category='viral',
        rarity='common',
        requirement='create_remixes',
        target_value=1,
        reward_tokens=15
    ),
    Achievement(
        id='remix_master',
        name='Remix Master',
        description='Create 100 remixes',
        icon='🎭',
        category='viral',
        rarity='epic',
        requirement='create_remixes',
        target_value=100,
        reward_tokens=750
    ),
    
    # Premium achievements
    Achievement(
        id='first_upgrade',
        name='Support the Platform',
        description='Upgrade to PRO tier',
        icon='👑',
        category='earning',
        rarity='rare',
        requirement='upgrade_tier',
        target_value=1,
        reward_tokens=200
    ),
    Achievement(
        id='referral_king',
        name='Referral King',
        description='Refer 10 friends who sign up',
        icon='👥',
        category='social',
        rarity='epic',
        requirement='successful_referrals',
        target_value=10,
        reward_tokens=1500
    )
]

async def initialize_user_achievements(user_id: str, db):
    """Initialize achievement tracking for new user"""
    for achievement in ACHIEVEMENTS:
        user_achievement = UserAchievement(
            id=uuid.uuid4(),
            user_id=user_id,
            achievement_id=achievement.id,
            current_progress=0,
            unlocked=False
        )
        
        await db.user_achievements.create(user_achievement.dict())

async def track_achievement_progress(user_id: str, requirement: str, amount: int, db):
    """Update achievement progress"""
    # Get user's achievements for this requirement
    user_achievements = await db.user_achievements.find({
        'user_id': user_id,
        'unlocked': False
    }).to_list(100)
    
    newly_unlocked = []
    
    for user_ach in user_achievements:
        # Find matching achievement definition
        achievement = next(
            (a for a in ACHIEVEMENTS if a.id == user_ach['achievement_id'] and a.requirement == requirement),
            None
        )
        
        if not achievement:
            continue
        
        # Update progress
        user_ach['current_progress'] += amount
        
        # Check if unlocked
        if user_ach['current_progress'] >= achievement.target_value:
            user_ach['unlocked'] = True
            user_ach['unlocked_at'] = datetime.now()
            
            # Award tokens
            await db.users.update(
                {'id': user_id},
                {'$inc': {'tokens_balance': achievement.reward_tokens}}
            )
            
            # Log transaction
            await db.token_transactions.create({
                'user_id': user_id,
                'amount': achievement.reward_tokens,
                'type': 'achievement_reward',
                'metadata': {
                    'achievement_id': achievement.id,
                    'achievement_name': achievement.name
                }
            })
            
            newly_unlocked.append(achievement)
        
        # Save progress
        await db.user_achievements.update(
            {'id': user_ach['id']},
            {'$set': user_ach}
        )
    
    return newly_unlocked

async def get_leaderboard(category: str = 'all', period: str = 'all_time', limit: int = 100, db = None):
    """Get leaderboard rankings"""
    from datetime import timedelta
    
    # Calculate time filter
    if period == 'day':
        since = datetime.now() - timedelta(days=1)
    elif period == 'week':
        since = datetime.now() - timedelta(weeks=1)
    elif period == 'month':
        since = datetime.now() - timedelta(days=30)
    else:
        since = datetime.min
    
    # Aggregate achievements by user
    pipeline = [
        {
            '$match': {
                'unlocked': True,
                'unlocked_at': {'$gte': since}
            }
        },
        {
            '$group': {
                '_id': '$user_id',
                'total_achievements': {'$sum': 1},
                'total_tokens_earned': {
                    '$sum': {
                        '$let': {
                            'vars': {
                                'achievement': {
                                    '$arrayElemAt': [
                                        ACHIEVEMENTS,
                                        {'$indexOfArray': [[a.id for a in ACHIEVEMENTS], '$achievement_id']}
                                    ]
                                }
                            },
                            'in': '$$achievement.reward_tokens'
                        }
                    }
                }
            }
        },
        {
            '$sort': {'total_achievements': -1}
        },
        {
            '$limit': limit
        }
    ]
    
    results = await db.user_achievements.aggregate(pipeline).to_list(limit)
    
    # Get user details
    leaderboard = []
    for idx, result in enumerate(results):
        user = await db.users.find_one({'id': result['_id']})
        
        if user:
            leaderboard.append({
                'rank': idx + 1,
                'username': user.get('username', 'Anonymous'),
                'total_achievements': result['total_achievements'],
                'tokens_earned_from_achievements': result.get('total_tokens_earned', 0),
                'tier': user.get('tier', 'free')
            })
    
    return leaderboard

async def get_user_achievements(user_id: str, db):
    """Get user's achievement progress"""
    user_achievements = await db.user_achievements.find({'user_id': user_id}).to_list(100)
    
    # Combine with achievement definitions
    achievements_data = []
    for user_ach in user_achievements:
        achievement = next((a for a in ACHIEVEMENTS if a.id == user_ach['achievement_id']), None)
        
        if achievement:
            achievements_data.append({
                **achievement.dict(),
                'current_progress': user_ach['current_progress'],
                'unlocked': user_ach['unlocked'],
                'unlocked_at': user_ach.get('unlocked_at'),
                'progress_percent': min(100, (user_ach['current_progress'] / achievement.target_value) * 100)
            })
    
    return achievements_data
