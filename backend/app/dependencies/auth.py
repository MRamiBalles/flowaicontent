"""
Authentication Dependencies for FastAPI Endpoints
Uses Supabase Auth + Role-Based Access Control
"""

from fastapi import Depends, HTTPException, Header
from typing import Optional
from app.services.supabase_service import verify_token, has_role, get_user_profile


async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """
    Dependency to get current authenticated user from Supabase JWT
    
    Usage:
        @router.get("/protected")
        async def protected_route(current_user: dict = Depends(get_current_user)):
            user_id = current_user["id"]
            email = current_user["email"]
    
    Args:
        authorization: Authorization header with Bearer token
        
    Returns:
        User dict with id, email, metadata
        
    Raises:
        HTTPException: 401 if not authenticated
    """
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Missing authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header format. Use: Bearer <token>",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = authorization.replace("Bearer ", "")
    
    try:
        user = await verify_token(token)
        
        # Attach user profile data
        profile = await get_user_profile(user["id"])
        if profile:
            user["profile"] = profile
        
        return user
    except ValueError as e:
        raise HTTPException(
            status_code=401,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_admin_user(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Dependency to require admin role
    
    Usage:
        @router.post("/admin-only")
        async def admin_route(current_user: dict = Depends(get_admin_user)):
            # Only admins can access
    
    Args:
        current_user: Current authenticated user from get_current_user
        
    Returns:
        User dict if user is admin
        
    Raises:
        HTTPException: 403 if not admin
    """
    user_id = current_user["id"]
    
    if not await has_role(user_id, "admin"):
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )
    
    return current_user


async def get_moderator_user(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Dependency to require moderator or admin role
    
    Usage:
        @router.post("/moderator-only")
        async def mod_route(current_user: dict = Depends(get_moderator_user)):
            # Moderators and admins can access
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        User dict if user is moderator or admin
        
    Raises:
        HTTPException: 403 if not moderator/admin
    """
    user_id = current_user["id"]
    
    is_moderator = await has_role(user_id, "moderator")
    is_admin = await has_role(user_id, "admin")
    
    if not (is_moderator or is_admin):
        raise HTTPException(
            status_code=403,
            detail="Moderator or admin access required"
        )
    
    return current_user


async def get_optional_user(authorization: Optional[str] = Header(None)) -> Optional[dict]:
    """
    Dependency to get current user if authenticated, None otherwise
    
    Useful for endpoints that work for both authenticated and anonymous users
    
    Usage:
        @router.get("/public-or-private")
        async def route(current_user: Optional[dict] = Depends(get_optional_user)):
            if current_user:
                # Show personalized content
            else:
                # Show public content
    
    Args:
        authorization: Optional authorization header
        
    Returns:
        User dict if authenticated, None otherwise
    """
    if not authorization or not authorization.startswith("Bearer "):
        return None
    
    try:
        return await get_current_user(authorization)
    except HTTPException:
        return None
