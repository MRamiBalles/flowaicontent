from fastmcp import FastMCP
import json
import uuid
from typing import Optional, Dict, Any

# Initialize FastMCP Server with name and dependencies
# Initialize FastMCP Server with name and dependencies
mcp = FastMCP("FlowAI Core")

from app.utils.mcp_decorators import budget_gate
from app.core.errors import (
    FlowAIError, 
    RateLimitError, 
    ContentViolationError, 
    QuotaExhaustedError,
    UpstreamServiceError
)
import functools
import logging

# --- Error Handling ---

def mcp_error_handler(func):
    """
    Decorator to wrap MCP tools and return structured JSON-RPC errors.
    Translates FlowAIError exceptions into MCP-compliant error responses.
    """
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except FlowAIError as e:
            logging.warning(f"FlowAI Error in {func.__name__}: {e.message}")
            # Return the structured error dict directly. 
            # FastMCP will serialize this as the result payload if we don't raise.
            # However, for an *error* reponse in JSON-RPC, we effectively want to communicate failure.
            # If FastMCP supports raising exceptions that map to JSON-RPC errors, we should do that.
            # For this implementation, we return the JSON structure defined in our spec.
            return json.dumps(e.to_mcp_response())
        except Exception as e:
            logging.error(f"Unexpected error in {func.__name__}: {str(e)}")
            # Mask internal errors
            return json.dumps({
                "error": {
                    "code": -32603,
                    "message": "Internal Server Error",
                    "data": {"original_error": str(e)} # Dev mode only
                }
            })
    return wrapper

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
@mcp_error_handler
@budget_gate(static_cost=0.005, feature_tag="project_query") # Enforce a small cost for querying status
async def query_project_status(project_id: str, tenant_context: Optional[str] = None) -> str:
    """
    Queries the detailed status of a project, enforcing tenant isolation.
    """
    if not tenant_context:
        raise FlowAIError("Missing tenant context", "INVALID_PARAMS")

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
@mcp_error_handler
@budget_gate(static_cost=0.50, feature_tag="video_gen") # Professional generation is expensive
async def generate_cloud_video(prompt: str, duration: int = 5, tenant_context: Optional[str] = None) -> str:
    """
    Generates a professional video clip using high-end cloud models (Runway/Sora).
    Uses metadata from local vision analysis as the base prompt.
    """
    # 1. Simulate Safety/Content Filter
    if "violence" in prompt.lower() or "explicit" in prompt.lower():
        # Agent-Friendly Error (Resilience Pattern 2026)
        raise ContentViolationError("Prompt contains restricted keywords.")

    # 2. Simulate API call to Runway/Luma/Sora
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

@mcp.tool()
@mcp_error_handler
async def get_finops_status(tenant_context: str) -> str:
    """
    Allows the agent to check its current budget and rate limit status.
    Pre-check before expensive operations.
    """
    from app.services.finops_service import finops_service
    balance = finops_service.get_balance(tenant_context)
    return json.dumps({
        "tenant_id": tenant_context,
        "balance_usd": balance,
        "currency": "USD",
        "can_afford_generation": balance >= 0.50
    })

@mcp.tool()
# No error handler needed for admin tool usually, but adding for consistency if desired.
# Skipping for seed_credits to keep it simple, or add it if strict.
async def seed_credits(tenant_context: str, amount: float) -> str:
    """
    ADMIN TOOL: Seeds credits for a tenant for testing purposes.
    """
    from app.services.finops_service import finops_service
    finops_service.set_credits(tenant_context, amount)
    return json.dumps({"status": "success", "tenant_id": tenant_context, "new_balance": amount})

if __name__ == "__main__":
    mcp.run()



