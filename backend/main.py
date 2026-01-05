from fastapi import FastAPI
import uvicorn
import asyncio
from mcp_server import MCPServer
app.include_router(co_streaming.router, prefix="/api/v1/co-streaming", tags=["Co-Streaming"])
import emotes
import safety
import staking
import marketplace
import trading
import economy
import notifications
import referrals_v2
import social_export_v2
import voice
import enterprise
app.include_router(emotes.router, prefix="/api/v1/emotes", tags=["Emotes"])
app.include_router(safety.router, prefix="/api/v1/safety", tags=["Safety"])
app.include_router(staking.router, prefix="/api/v1/staking", tags=["Staking"])
app.include_router(marketplace.router, prefix="/api/v1/marketplace", tags=["Marketplace"])
app.include_router(trading.router, prefix="/api/v1/trading", tags=["Trading"])
app.include_router(economy.router, prefix="/api/v1/economy", tags=["Economy"])
app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["Notifications"])
app.include_router(referrals_v2.router, prefix="/api/v1/referrals-v2", tags=["Referrals V2"])
app.include_router(social_export_v2.router, prefix="/api/v1/social-export", tags=["Social Export"])
app.include_router(voice.router, prefix="/api/v1/voice", tags=["Voice Cloning"])
app.include_router(enterprise.router, prefix="/api/v1/enterprise", tags=["Enterprise"])

# --- 2026 MCP Server Integration ---
@app.on_event("startup")
async def startup_event():
    # Initialize and register MCP Server component
    # This allows AI agents to discover tools/resources via standard protocol
    app.state.mcp_server = MCPServer("FlowAI Main Server", "1.0.0")
    print("FlowAI 2026: MCP Server integrated in state.")

@app.post("/api/v1/mcp/rpc")
async def mcp_rpc_endpoint(request: dict):
    """
    Standard RPC entry point for MCP interactions.
    """
    return await app.state.mcp_server.handle_request(json.dumps(request))
