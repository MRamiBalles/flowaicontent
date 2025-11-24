"""
Analytics Service
Calculate business metrics: MRR, CAC, LTV, churn, conversion rates
"""

from datetime import datetime, timedelta
from typing import Dict, List
from pydantic import BaseModel

class AnalyticsMetrics(BaseModel):
    """Key business metrics"""
    mrr: float  # Monthly Recurring Revenue
    arr: float  # Annual Recurring Revenue
    active_subscribers: int
    new_subscribers_this_month: int
    churned_subscribers_this_month: int
    churn_rate: float  # Percentage
    
    cac: float  # Customer Acquisition Cost
    ltv: float  # Lifetime Value
    ltv_cac_ratio: float
    
    conversion_rate: float  # Free to paid conversion
    arpu: float  # Average Revenue Per User
    
    total_users: int
    paying_users: int
    
class AnalyticsService:
    """Service for calculating analytics metrics"""
    
    @staticmethod
    async def calculate_mrr(db) -> float:
        """Calculate Monthly Recurring Revenue"""
        from app.models.subscription import TIER_PRICING, UserTier
        
        # Get active subscriptions
        active_subs = await db.subscriptions.find({
            "status": "active",
            "cancel_at_period_end": False
        }).to_list(10000)
        
        mrr = 0
        for sub in active_subs:
            tier = sub.get("tier", "free")
            if tier != "free":
                price_cents = TIER_PRICING.get(UserTier(tier), 0)
                mrr += price_cents / 100  # Convert to dollars
        
        return round(mrr, 2)
    
    @staticmethod
    async def calculate_churn_rate(db) -> float:
        """Calculate monthly churn rate"""
        now = datetime.now()
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0)
        
        # Subscribers at start of month
        total_start = await db.subscriptions.count_documents({
            "created_at": {"$lt": start_of_month},
            "status": "active"
        })
        
        # Churned this month
        churned = await db.subscriptions.count_documents({
            "status": "canceled",
            "updated_at": {"$gte": start_of_month}
        })
        
        if total_start == 0:
            return 0.0
        
        churn_rate = (churned / total_start) * 100
        return round(churn_rate, 2)
    
    @staticmethod
    async def calculate_ltv(db, avg_monthly_churn_rate: float = 5.0) -> float:
        """
        Calculate Customer Lifetime Value
        LTV = ARPU / Churn Rate
        """
        arpu = await AnalyticsService.calculate_arpu(db)
        
        if avg_monthly_churn_rate == 0:
            return 0.0
        
        # LTV = ARPU * Average Customer Lifespan (in months)
        avg_lifespan_months = 1 / (avg_monthly_churn_rate / 100)
        ltv = arpu * avg_lifespan_months
        
        return round(ltv, 2)
    
    @staticmethod
    async def calculate_arpu(db) -> float:
        """Calculate Average Revenue Per User (monthly)"""
        mrr = await AnalyticsService.calculate_mrr(db)
        paying_users = await db.subscriptions.count_documents({"status": "active"})
        
        if paying_users == 0:
            return 0.0
        
        return round(mrr / paying_users, 2)
    
    @staticmethod
    async def calculate_conversion_rate(db) -> float:
        """Calculate free to paid conversion rate"""
        total_users = await db.users.count_documents({})
        paying_users = await db.subscriptions.count_documents({"status": "active"})
        
        if total_users == 0:
            return 0.0
        
        conversion_rate = (paying_users / total_users) * 100
        return round(conversion_rate, 2)
    
    @staticmethod
    async def get_growth_metrics(db) -> Dict:
        """Get user growth metrics"""
        now = datetime.now()
        
        # This month
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0)
        users_this_month = await db.users.count_documents({
            "created_at": {"$gte": start_of_month}
        })
        
        # Last month
        last_month = (start_of_month - timedelta(days=1)).replace(day=1)
        users_last_month = await db.users.count_documents({
            "created_at": {"$gte": last_month, "$lt": start_of_month}
        })
        
        # Calculate growth rate
        if users_last_month == 0:
            growth_rate = 0.0
        else:
            growth_rate = ((users_this_month - users_last_month) / users_last_month) * 100
        
        return {
            "new_users_this_month": users_this_month,
            "new_users_last_month": users_last_month,
            "growth_rate": round(growth_rate, 2)
        }
    
    @staticmethod
    async def get_revenue_breakdown(db) -> Dict:
        """Get revenue breakdown by source"""
        from app.models.subscription import TIER_PRICING, UserTier
        
        # Subscription revenue by tier
        revenue_by_tier = {}
        for tier in [UserTier.PRO, UserTier.STUDIO, UserTier.BUSINESS]:
            count = await db.subscriptions.count_documents({
                "tier": tier.value,
                "status": "active"
            })
            price = TIER_PRICING[tier] / 100
            revenue_by_tier[tier.value] = {
                "subscribers": count,
                "mrr": round(count * price, 2)
            }
        
        # Style packs revenue (one-time)
        now = datetime.now()
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0)
        
        style_pack_purchases = await db.style_pack_purchases.find({
            "purchased_at": {"$gte": start_of_month}
        }).to_list(10000)
        
        style_pack_revenue = 0
        for purchase in style_pack_purchases:
            pack = await db.style_packs.find_one({"id": purchase["style_pack_id"]})
            if pack:
                style_pack_revenue += pack["price_cents"] / 100
        
        return {
            "subscriptions": revenue_by_tier,
            "style_packs_this_month": round(style_pack_revenue, 2)
        }
    
    @staticmethod
    async def get_all_metrics(db) -> AnalyticsMetrics:
        """Get all analytics metrics"""
        mrr = await AnalyticsService.calculate_mrr(db)
        churn_rate = await AnalyticsService.calculate_churn_rate(db)
        conversion_rate = await AnalyticsService.calculate_conversion_rate(db)
        arpu = await AnalyticsService.calculate_arpu(db)
        ltv = await AnalyticsService.calculate_ltv(db, churn_rate)
        
        total_users = await db.users.count_documents({})
        paying_users = await db.subscriptions.count_documents({"status": "active"})
        
        # Get new/churned this month
        now = datetime.now()
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0)
        
        new_subs = await db.subscriptions.count_documents({
            "created_at": {"$gte": start_of_month}
        })
        
        churned_subs = await db.subscriptions.count_documents({
            "status": "canceled",
            "updated_at": {"$gte": start_of_month}
        })
        
        # Calculate CAC (placeholder - would need marketing spend data)
        cac = 50.0  # Assume $50 CAC for now
        
        return AnalyticsMetrics(
            mrr=mrr,
            arr=mrr * 12,
            active_subscribers=paying_users,
            new_subscribers_this_month=new_subs,
            churned_subscribers_this_month=churned_subs,
            churn_rate=churn_rate,
            cac=cac,
            ltv=ltv,
            ltv_cac_ratio=round(ltv / cac, 2) if cac > 0 else 0,
            conversion_rate=conversion_rate,
            arpu=arpu,
            total_users=total_users,
            paying_users=paying_users
        )
