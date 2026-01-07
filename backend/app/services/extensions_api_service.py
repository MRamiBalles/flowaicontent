"""
Twitch Community Tools: Extensions API Service
Public API for third-party developers to build FlowAI extensions.
"""
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime
from enum import Enum

class ExtensionType(str, Enum):
    OVERLAY = "overlay"  # On-screen overlays
    PANEL = "panel"      # Below-stream panels
    COMPONENT = "component"  # Interactive components
    MOBILE = "mobile"    # Mobile-specific

class ExtensionPermission(str, Enum):
    READ_STREAM = "stream:read"
    WRITE_OVERLAY = "overlay:write"
    READ_CHAT = "chat:read"
    WRITE_CHAT = "chat:write"
    READ_VIEWERS = "viewers:read"
    TRIGGER_EVENTS = "events:trigger"
    READ_ANALYTICS = "analytics:read"
    MANAGE_POLLS = "polls:manage"
    CHANNEL_POINTS = "points:manage"

class ExtensionsAPIService:
    """
    Manages third-party extensions for FlowAI streams.
    Similar to Twitch Extensions but with AI-enhanced capabilities.
    """
    
    def __init__(self):
        self.registered_extensions: Dict[str, Dict[str, Any]] = {}
        self.active_installations: Dict[str, List[str]] = {}  # stream_id -> [ext_ids]
    
    async def register_extension(
        self,
        developer_id: str,
        name: str,
        description: str,
        extension_type: ExtensionType,
        permissions: List[ExtensionPermission],
        manifest_url: str
    ) -> Dict[str, Any]:
        """
        Register a new extension in the FlowAI marketplace.
        """
        ext_id = f"ext_{uuid.uuid4().hex[:10]}"
        client_secret = f"fai_secret_{uuid.uuid4().hex}"
        
        extension = {
            "id": ext_id,
            "developer_id": developer_id,
            "name": name,
            "description": description,
            "type": extension_type.value,
            "permissions": [p.value for p in permissions],
            "manifest_url": manifest_url,
            "client_secret": client_secret,
            "status": "pending_review",
            "installs": 0,
            "rating": 0.0,
            "version": "1.0.0",
            "created_at": datetime.utcnow().isoformat()
        }
        
        self.registered_extensions[ext_id] = extension
        print(f"[EXTENSIONS] Registered new extension: {name} (ID: {ext_id})")
        
        return {
            "extension_id": ext_id,
            "client_secret": client_secret,
            "status": "pending_review",
            "api_base_url": "https://api.flowai.com/v1/extensions",
            "webhook_url": f"https://api.flowai.com/v1/extensions/{ext_id}/webhook"
        }
    
    async def install_extension(
        self,
        stream_id: str,
        extension_id: str,
        config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Install an extension on a stream.
        """
        if stream_id not in self.active_installations:
            self.active_installations[stream_id] = []
        
        if extension_id not in self.active_installations[stream_id]:
            self.active_installations[stream_id].append(extension_id)
        
        return {
            "success": True,
            "stream_id": stream_id,
            "extension_id": extension_id,
            "config": config or {},
            "installed_at": datetime.utcnow().isoformat()
        }
    
    async def get_extension_sdk(self) -> Dict[str, Any]:
        """
        Returns SDK documentation for extension developers.
        """
        return {
            "sdk_version": "2.0.0",
            "base_url": "https://api.flowai.com/v1/extensions",
            "auth_method": "OAuth2 + JWT",
            "available_events": [
                "stream.start",
                "stream.end",
                "chat.message",
                "viewer.join",
                "viewer.leave",
                "poll.created",
                "poll.ended",
                "donation.received",
                "raid.incoming",
                "raid.outgoing",
                "channel_points.redeemed"
            ],
            "available_actions": [
                "overlay.show",
                "overlay.hide",
                "overlay.update",
                "chat.send",
                "poll.create",
                "poll.end",
                "alert.trigger",
                "sound.play"
            ],
            "iframe_sandbox": [
                "allow-scripts",
                "allow-same-origin"
            ],
            "rate_limits": {
                "api_calls_per_minute": 60,
                "websocket_messages_per_second": 10
            },
            "example_manifest": {
                "name": "My Extension",
                "version": "1.0.0",
                "type": "overlay",
                "permissions": ["stream:read", "chat:read"],
                "entry_point": "https://myext.com/overlay.html",
                "config_schema": {
                    "color": {"type": "string", "default": "#FF0000"},
                    "position": {"type": "string", "enum": ["top", "bottom"]}
                }
            }
        }
    
    async def trigger_extension_event(
        self,
        stream_id: str,
        event_type: str,
        payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Broadcast an event to all installed extensions.
        """
        installed = self.active_installations.get(stream_id, [])
        
        results = {
            "event_type": event_type,
            "extensions_notified": len(installed),
            "timestamp": datetime.utcnow().isoformat()
        }
        
        for ext_id in installed:
            # In production, would send webhook to each extension
            print(f"[EXTENSIONS] Event {event_type} -> Extension {ext_id}")
        
        return results
    
    async def list_marketplace_extensions(
        self,
        category: Optional[str] = None,
        sort_by: str = "installs"
    ) -> List[Dict[str, Any]]:
        """
        List available extensions in the marketplace.
        """
        # Mock popular extensions
        return [
            {
                "id": "ext_streamlabs",
                "name": "StreamLabs Integration",
                "description": "Connect your StreamLabs alerts and donations",
                "type": "overlay",
                "installs": 15000,
                "rating": 4.8,
                "verified": True
            },
            {
                "id": "ext_chatgpt",
                "name": "AI Chat Moderator",
                "description": "GPT-powered chat moderation and responses",
                "type": "component",
                "installs": 8500,
                "rating": 4.6,
                "verified": True
            },
            {
                "id": "ext_minigames",
                "name": "Viewer Minigames",
                "description": "Interactive games for your viewers",
                "type": "panel",
                "installs": 12000,
                "rating": 4.7,
                "verified": True
            },
            {
                "id": "ext_predictions",
                "name": "AI Predictions",
                "description": "Let viewers bet on stream outcomes",
                "type": "component",
                "installs": 6200,
                "rating": 4.5,
                "verified": True
            }
        ]

# Singleton instance
extensions_api_service = ExtensionsAPIService()
