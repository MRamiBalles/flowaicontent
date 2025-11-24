"""
Analytics API Endpoints
Get business metrics for dashboard
"""

from fastapi import APIRouter, Depends, HTTPException
from app.services.analytics_service import AnalyticsService, AnalyticsMetrics

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/metrics", response_model=AnalyticsMetrics)
async def get_metrics(
    db = Depends(get_database),
    current_user: dict = Depends(get_admin_user)
):
    """Get all business metrics (admin only)"""
    metrics = await AnalyticsService.get_all_metrics(db)
    return metrics

@router.get("/mrr")
async def get_mrr(
    db = Depends(get_database),
    current_user: dict = Depends(get_admin_user)
):
    """Get Monthly Recurring Revenue"""
    mrr = await AnalyticsService.calculate_mrr(db)
    return {"mrr": mrr, "arr": mrr * 12}

@router.get("/growth")
async def get_growth(
    db = Depends(get_database),
    current_user: dict = Depends(get_admin_user)
):
    """Get user growth metrics"""
    metrics = await AnalyticsService.get_growth_metrics(db)
    return metrics

@router.get("/revenue-breakdown")
async def get_revenue_breakdown(
    db = Depends(get_database),
    current_user: dict = Depends(get_admin_user)
):
    """Get revenue breakdown by source"""
    breakdown = await AnalyticsService.get_revenue_breakdown(db)
    return breakdown

@router.get("/cohort/{year}/{month}")
async def get_cohort_analysis(
    year: int,
    month: int,
    db = Depends(get_database),
    current_user: dict = Depends(get_admin_user)
):
    """Get cohort retention analysis for specific month"""
    from datetime import datetime, timedelta
    
    # Get users who signed up in the specified month
    start_date = datetime(year, month, 1)
    if month == 12:
        end_date = datetime(year + 1, 1, 1)
    else:
        end_date = datetime(year, month + 1, 1)
    
    cohort_users = await db.users.find({
        "created_at": {"$gte": start_date, "$lt": end_date}
    }).to_list(None)
    
    cohort_size = len(cohort_users)
    user_ids = [u["id"] for u in cohort_users]
    
    # Calculate retention for each month after signup
    retention_data = []
    for months_after in range(12):  # Track 12 months
        check_date = start_date + timedelta(days=30 * (months_after + 1))
        
        # Count active users (had any activity in that month)
        active_count = await db.user_activity.count_documents({
            "user_id": {"$in": user_ids},
            "activity_date": {
                "$gte": check_date,
                "$lt": check_date + timedelta(days=30)
            }
        })
        
        retention_rate = (active_count / cohort_size * 100) if cohort_size > 0 else 0
        
        retention_data.append({
            "month": months_after,
            "active_users": active_count,
            "retention_rate": round(retention_rate, 2)
        })
    
    # Calculate revenue cohort
    total_revenue = await db.payments.aggregate([
        {"$match": {"user_id": {"$in": user_ids}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]).to_list(1)
    
    avg_revenue_per_user = total_revenue[0]["total"] / cohort_size if total_revenue and cohort_size > 0 else 0
    
    return {
        "cohort": f"{year}-{month:02d}",
        "cohort_size": cohort_size,
        "retention_by_month": retention_data,
        "total_revenue": total_revenue[0]["total"] if total_revenue else 0,
        "avg_revenue_per_user": round(avg_revenue_per_user, 2)
    }

def get_database():
    """Database dependency"""
    pass

def get_admin_user(current_user: dict = Depends(get_current_user)):
    """Verify user is admin"""
    if not current_user.get("is_admin", False):
        raise HTTPException(403, "Admin access required")
    return current_user

def get_current_user():
    """Get current authenticated user"""
    pass
