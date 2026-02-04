from fastmcp import FastMCP
import json
import uuid
from typing import Optional, Dict, Any

# Initialize FastMCP Server with name and dependencies
mcp = FastMCP("FlowAI Core")

# --- Resources ---
# Passive context reading (standard architecture)

@mcp.resource("project://{project_id}/metadata")
def get_project_metadata(project_id: str) -> str:
    """
    Reads read-only metadata for a project.
    Exposed as a resource for agents to 'read' without triggering actions.
    """
    # Simulate DB lookup
    # In production: await supabase.table("projects").select("*").eq("id", project_id).single()
    fake_data = {
        "id": project_id,
        "name": "Demo Project Alpha",
        "created_at": "2026-02-05T10:00:00Z",
        "status": "active",
        "owner_id": "user_123"
    }
    return json.dumps(fake_data)

# --- Tools ---
# Active actions that require parameters (action architecture)

@mcp.tool()
def query_project_status(project_id: str, tenant_context: Optional[str] = None) -> str:
    """
    Queries the detailed status of a project, enforcing tenant isolation.
    
    Args:
        project_id: The UUID of the project.
        tenant_context: The tenant_id of the organization (Required for multi-tenant RLS).
    """
    # 1. Enforce Tenancy (Simulated RLS)
    if not tenant_context:
        # In strict mode, we might raise an error, but for now we default/warn
        return json.dumps({
            "error": "Missing tenant_context",
            "message": "Security Policy: You must provide a valid tenant_id to query project data."
        })
    
    # 2. Simulate Logic
    # In production: Verify tenant_context matches user's session
    
    # 3. Return Data
    return json.dumps({
        "status": "success",
        "project_id": project_id,
        "tenant_id": tenant_context,
        "data": {
            "health": "healthy",
            "last_generation": "2026-02-05T12:30:00Z",
            "cost_to_date": "$12.50",
            "active_agents": ["video-optimizer", "subtitle-generator"]
        }
    })

if __name__ == "__main__":
    # Run via stdio by default simply by calling run()
    # FastMCP handles the loop and JSON-RPC over stdin/stdout
    mcp.run()
