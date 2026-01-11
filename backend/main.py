"""
FlowAI Backend - Main FastAPI Application (2026 Standards)
"""
from fastapi import FastAPI, Request, HTTPException, WebSocket, WebSocketDisconnect
import uvicorn
import json
from datetime import datetime
from app.services.collaboration_service import collaboration_service

# Import routers
from app.api import video_generation, co_streaming, emotes, safety, staking
from app.api import marketplace, trading, economy, notifications
from app.api import referrals_v2, social_export_v2, voice, enterprise
from app.api import linear_platform

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
app.include_router(linear_platform.router, prefix="/api/v1", tags=["Linear Video Platform"])

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
    Supports session_token for multi-tenant auth.
    """
    return await app.state.mcp_server.handle_request(json.dumps(request))

# --- 2026 Collaborative WebSocket (Step 4) ---
@app.websocket("/ws/collab/{project_id}")
async def collaboration_websocket(websocket: WebSocket, project_id: str):
    """
    WebSocket endpoint for real-time multiplayer editing (Live OTIO).
    Supports Human + AI agent interaction in the same session.
    """
    await websocket.accept()
    session = await collaboration_service.get_or_create_session(project_id)
    
    # Register connection
    user_id = f"user_{id(websocket)}" # Mock user identification
    session.active_users[user_id] = {"joined_at": datetime.utcnow().isoformat()}
    
    try:
        # Send initial state
        await websocket.send_text(json.dumps({
            "type": "sync_initial",
            "timeline": session.to_json(),
            "active_users": list(session.active_users.keys())
        }))
        
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle OTIO updates (Simplified CRDT-like sync)
            if message["type"] == "edit_action":
                # In a real 2026 app, this would use Yjs binary updates
                # For this Steel Thread, we'll process basic edit commands
                if message["action"] == "add_clip":
                    session.add_clip(
                        track_index=message.get("track", 0),
                        name=message["name"],
                        media_reference=message["url"],
                        start_time=message["start"],
                        duration=message["duration"]
                    )
                
                # Broadcast update to all (except sender in production)
                # await broadcast_to_session(project_id, message)
                await websocket.send_text(json.dumps({
                    "type": "sync_update",
                    "timeline": session.to_json()
                }))
                
    except WebSocketDisconnect:
        if user_id in session.active_users:
            del session.active_users[user_id]
        print(f"User {user_id} disconnected from project {project_id}")

# --- Health Check ---
@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "2026.1.0"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
