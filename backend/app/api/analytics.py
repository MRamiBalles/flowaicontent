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
    # TODO: Implement cohort analysis
    return {"message": "Cohort analysis not yet implemented"}

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
