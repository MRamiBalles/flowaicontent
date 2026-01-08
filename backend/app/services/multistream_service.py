"""
Multi-streaming Hub Service
Transmit simultaneously to YouTube, Twitch, and Kick from FlowAI.
"""
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime
from enum import Enum

class StreamPlatform(str, Enum):
    YOUTUBE = "youtube"
    TWITCH = "twitch"
    KICK = "kick"
    FACEBOOK = "facebook"
    TIKTOK = "tiktok"

class MultiStreamService:
    """
    Manages multi-platform streaming from a single FlowAI source.
    """
    
    def __init__(self):
        self.active_multistreams: Dict[str, Dict[str, Any]] = {}
        self.platform_connections: Dict[str, List[Dict[str, Any]]] = {}  # user_id -> connections
    
    async def connect_platform(
        self,
        user_id: str,
        platform: StreamPlatform,
        stream_key: str,
        rtmp_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Connect a streaming platform account.
        """
        connection_id = f"conn_{uuid.uuid4().hex[:8]}"
        
        # Default RTMP URLs per platform
        default_rtmp = {
            StreamPlatform.YOUTUBE: "rtmp://a.rtmp.youtube.com/live2",
            StreamPlatform.TWITCH: "rtmp://live.twitch.tv/app",
            StreamPlatform.KICK: "rtmp://fa723fc1b171.global-contribute.live-video.net/app",
            StreamPlatform.FACEBOOK: "rtmps://live-api-s.facebook.com:443/rtmp",
            StreamPlatform.TIKTOK: "rtmp://push.tiktokv.com/live"
        }
        
        connection = {
            "id": connection_id,
            "user_id": user_id,
            "platform": platform.value,
            "stream_key_masked": f"****{stream_key[-4:]}",
            "rtmp_url": rtmp_url or default_rtmp.get(platform, ""),
            "status": "connected",
            "connected_at": datetime.utcnow().isoformat()
        }
        
        if user_id not in self.platform_connections:
            self.platform_connections[user_id] = []
        
        self.platform_connections[user_id].append(connection)
        print(f"[MULTISTREAM] User {user_id} connected to {platform.value}")
        
        return connection
    
    async def get_connected_platforms(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Get all connected platforms for a user.
        """
        return self.platform_connections.get(user_id, [])
    
    async def start_multistream(
        self,
        user_id: str,
        title: str,
        platforms: List[StreamPlatform],
        settings: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Start multi-streaming to selected platforms.
        Returns a single FlowAI ingest URL that restreams to all platforms.
        """
        stream_id = f"mst_{uuid.uuid4().hex[:8]}"
        ingest_key = uuid.uuid4().hex
        
        # Get user's connected platforms
        user_connections = self.platform_connections.get(user_id, [])
        active_platforms = []
        
        for platform in platforms:
            matching = [c for c in user_connections if c["platform"] == platform.value]
            if matching:
                active_platforms.append({
                    "platform": platform.value,
                    "status": "streaming",
                    "connection_id": matching[0]["id"],
                    "viewers": 0
                })
        
        multistream = {
            "id": stream_id,
            "user_id": user_id,
            "title": title,
            "status": "live",
            "ingest_url": f"rtmp://ingest.flowai.com/multistream/{ingest_key}",
            "ingest_key": ingest_key,
            "platforms": active_platforms,
            "total_viewers": 0,
            "started_at": datetime.utcnow().isoformat(),
            "settings": settings or {
                "quality": "1080p60",
                "bitrate_kbps": 6000,
                "audio_bitrate_kbps": 160
            }
        }
        
        self.active_multistreams[stream_id] = multistream
        print(f"[MULTISTREAM] Started multistream {stream_id} to {len(active_platforms)} platforms")
        
        return multistream
    
    async def get_stream_stats(self, stream_id: str) -> Dict[str, Any]:
        """
        Get real-time stats across all platforms.
        """
        if stream_id not in self.active_multistreams:
            raise Exception("Stream not found")
        
        stream = self.active_multistreams[stream_id]
        
        # Mock aggregated stats
        return {
            "stream_id": stream_id,
            "platforms": [
                {
                    "platform": "youtube",
                    "viewers": 1250,
                    "chat_rate": 45,  # messages per minute
                    "health": "excellent"
                },
                {
                    "platform": "twitch",
                    "viewers": 3200,
                    "chat_rate": 120,
                    "health": "excellent"
                },
                {
                    "platform": "kick",
                    "viewers": 890,
                    "chat_rate": 65,
                    "health": "good"
                }
            ],
            "total_viewers": 5340,
            "total_chat_rate": 230,
            "duration_seconds": 3600,
            "peak_viewers": 6100
        }
    
    async def stop_multistream(self, stream_id: str) -> Dict[str, Any]:
        """
        Stop multi-streaming to all platforms.
        """
        if stream_id in self.active_multistreams:
            stream = self.active_multistreams[stream_id]
            stream["status"] = "offline"
            stream["ended_at"] = datetime.utcnow().isoformat()
            print(f"[MULTISTREAM] Stopped multistream {stream_id}")
            return stream
        raise Exception("Stream not found")
    
    async def get_platform_requirements(self) -> Dict[str, Any]:
        """
        Returns setup requirements for each platform.
        """
        return {
            "youtube": {
                "name": "YouTube Live",
                "icon": "📺",
                "requirements": [
                    "Verified YouTube channel",
                    "Live streaming enabled",
                    "Stream key from YouTube Studio"
                ],
                "rtmp_url": "rtmp://a.rtmp.youtube.com/live2",
                "max_bitrate_kbps": 51000,
                "recommended_bitrate_kbps": 4500
            },
            "twitch": {
                "name": "Twitch",
                "icon": "💜",
                "requirements": [
                    "Twitch account",
                    "Stream key from Twitch dashboard"
                ],
                "rtmp_url": "rtmp://live.twitch.tv/app",
                "max_bitrate_kbps": 6000,
                "recommended_bitrate_kbps": 6000
            },
            "kick": {
                "name": "Kick",
                "icon": "💚",
                "requirements": [
                    "Kick creator account",
                    "Stream key from Kick dashboard"
                ],
                "rtmp_url": "rtmp://fa723fc1b171.global-contribute.live-video.net/app",
                "max_bitrate_kbps": 8000,
                "recommended_bitrate_kbps": 6000
            },
            "facebook": {
                "name": "Facebook Gaming",
                "icon": "📘",
                "requirements": [
                    "Facebook Gaming creator page",
                    "Persistent stream key"
                ],
                "rtmp_url": "rtmps://live-api-s.facebook.com:443/rtmp",
                "max_bitrate_kbps": 4000,
                "recommended_bitrate_kbps": 4000
            },
            "tiktok": {
                "name": "TikTok LIVE",
                "icon": "🎵",
                "requirements": [
                    "TikTok LIVE access (1000+ followers)",
                    "Stream key from TikTok LIVE studio"
                ],
                "rtmp_url": "rtmp://push.tiktokv.com/live",
                "max_bitrate_kbps": 4000,
                "recommended_bitrate_kbps": 2500
            }
        }

# Singleton instance
multistream_service = MultiStreamService()
