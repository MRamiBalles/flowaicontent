"""
Supabase Service - Authentication and Database Integration
"""

from supabase import create_client, Client
import os
from typing import Optional, List

# Get Supabase credentials from environment
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not all([SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY]):
    raise ValueError("Missing Supabase environment variables. Check .env file.")

# Admin client (for backend operations)
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Public client (for user operations)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)


async def verify_token(token: str) -> dict:
    """
    Verify Supabase JWT token and return user data
    
    Args:
        token: JWT token from Authorization header
        
    Returns:
        User data dict with id, email, etc.
        
    Raises:
        ValueError: If token is invalid
    """
    try:
        # Verify token with Supabase
        response = supabase_admin.auth.get_user(token)
        
        if not response or not response.user:
            raise ValueError("Invalid token")
        
        return {
            "id": response.user.id,
            "email": response.user.email,
            "metadata": response.user.user_metadata,
        }
    except Exception as e:
        raise ValueError(f"Token verification failed: {str(e)}")


async def get_user_roles(user_id: str) -> List[str]:
    """
    Get all roles for a user from user_roles table
    
    Args:
        user_id: User UUID
        
    Returns:
        List of role strings (e.g., ['user', 'admin'])
    """
    try:
        result = supabase_admin.table("user_roles")\
            .select("role")\
            .eq("user_id", user_id)\
            .execute()
        
        return [r["role"] for r in result.data]
    except Exception as e:
        print(f"Error fetching roles: {e}")
        return []


async def has_role(user_id: str, role: str) -> bool:
    """
    Check if user has a specific role
    
    Args:
        user_id: User UUID
        role: Role to check ('admin', 'moderator', 'user')
        
    Returns:
        True if user has the role
    """
    roles = await get_user_roles(user_id)
    return role in roles


async def get_user_profile(user_id: str) -> Optional[dict]:
    """
    Get user profile data (tier, tokens, etc.)
    
    Args:
        user_id: User UUID
        
    Returns:
        User profile dict or None
    """
    try:
        result = supabase_admin.table("user_profiles")\
            .select("*")\
            .eq("id", user_id)\
            .single()\
            .execute()
        
        return result.data
    except Exception as e:
        print(f"Error fetching profile: {e}")
        return None


async def update_user_profile(user_id: str, updates: dict) -> bool:
    """
    Update user profile fields
    
    Args:
        user_id: User UUID
        updates: Dict of fields to update
        
    Returns:
        True if successful
    """
    try:
        supabase_admin.table("user_profiles")\
            .update(updates)\
            .eq("id", user_id)\
            .execute()
        
        return True
    except Exception as e:
        print(f"Error updating profile: {e}")
        return False


async def assign_role(user_id: str, role: str) -> bool:
    """
    Assign a role to a user (admin only operation)
    
    Args:
        user_id: User UUID
        role: Role to assign ('admin', 'moderator', 'user')
        
    Returns:
        True if successful
    """
    try:
        supabase_admin.table("user_roles")\
            .insert({"user_id": user_id, "role": role})\
            .execute()
        
        return True
    except Exception as e:
        print(f"Error assigning role: {e}")
        return False


async def remove_role(user_id: str, role: str) -> bool:
    """
    Remove a role from a user
    
    Args:
        user_id: User UUID
        role: Role to remove
        
    Returns:
        True if successful
    """
    try:
        supabase_admin.table("user_roles")\
            .delete()\
            .eq("user_id", user_id)\
            .eq("role", role)\
            .execute()
        
        return True
    except Exception as e:
        print(f"Error removing role: {e}")
        return False
