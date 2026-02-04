from fastmcp import FastMCP
import json
import uuid
from typing import Optional, Dict, Any

# Initialize FastMCP Server with name and dependencies
mcp = FastMCP("FlowAI Core")

from app.utils.mcp_decorators import budget_gate

# --- Resources ---
# Passive context reading (standard architecture)

@mcp.resource("project://{project_id}/metadata")
def get_project_metadata(project_id: str) -> str:
    """
    Reads read-only metadata for a project.
    Exposed as a resource for agents to 'read' without triggering actions.
    """
    # Simulate DB lookup
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
@budget_gate(static_cost=0.005) # Enforce a small cost for querying status
async def query_project_status(project_id: str, tenant_context: Optional[str] = None) -> str:
    """
    Queries the detailed status of a project, enforcing tenant isolation.
    """
    # Return Data
    return json.dumps({
        "status": "success",
        "project_id": project_id,
        "tenant_id": tenant_context,
        "data": {
            "health": "healthy",
            "last_generation": "2026-02-05T12:30:00Z",
            "cost_to_date": "$12.50"
        }
    })
@mcp.tool()
@budget_gate(static_cost=0.50) # Professional generation is expensive
async def generate_cloud_video(prompt: str, duration: int = 5, tenant_context: Optional[str] = None) -> str:
    """
    Generates a professional video clip using high-end cloud models (Runway/Sora).
    Uses metadata from local vision analysis as the base prompt.
    """
    # Simulate API call to Runway/Luma/Sora
    print(f"[CLOUD-AI] Generating video for tenant {tenant_context} with prompt: {prompt}")
    
    # Mock Response
    video_id = str(uuid.uuid4())
    return json.dumps({
        "status": "processing",
        "video_id": video_id,
        "estimated_time": "30s",
        "preview_url": f"https://cdn.flowai.com/clips/{video_id}.mp4",
        "engine": "runway-gen3"
    })



if __name__ == "__main__":
    # Run via stdio by default simply by calling run()
    # FastMCP handles the loop and JSON-RPC over stdin/stdout
    mcp.run()
