"""
FlowAI Backend - Main FastAPI Application (2026 Standards)
"""
from fastapi import FastAPI
import uvicorn
import json

# Import routers
from app.api import video_generation, co_streaming, emotes, safety, staking
from app.api import marketplace, trading, economy, notifications
from app.api import referrals_v2, social_export_v2, voice, enterprise

# MCP Server for 2026 AI Agent Integration
from mcp_server import MCPServer

# Create FastAPI Application
app = FastAPI(
    title="FlowAI API",
    description="Enterprise-grade AI content creation platform",
    version="2026.1.0"
)

# --- Router Registration ---
app.include_router(video_generation.router, prefix="/api/v1/video", tags=["Video Generation"])
app.include_router(co_streaming.router, prefix="/api/v1/co-streaming", tags=["Co-Streaming"])
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
    """
    Initialize MCP Server on application startup.
    This allows AI agents to discover tools/resources via standard protocol.
    """
    app.state.mcp_server = MCPServer("FlowAI Main Server", "1.0.0")
    print("FlowAI 2026: MCP Server integrated in state.")

@app.post("/api/v1/mcp/rpc")
async def mcp_rpc_endpoint(request: dict):
    """
    Standard RPC entry point for MCP interactions.
    Accepts JSON-RPC 2.0 formatted requests.
    """
    return await app.state.mcp_server.handle_request(json.dumps(request))

# --- Health Check ---
@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "2026.1.0"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
