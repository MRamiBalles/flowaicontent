"""
LoRA Manager Service
Manages LoRA style packs, metadata, and file paths.
"""

import json
import os
from typing import List, Dict, Optional, Any
import logging

logger = logging.getLogger(__name__)

class LoRAManager:
    def __init__(self):
        self.models_dir = os.getenv("MODELS_DIR", "models")
        self.loras_dir = os.path.join(self.models_dir, "loras")
        self.metadata_file = os.path.join(self.loras_dir, "metadata.json")
        self._styles_cache = None

    def get_available_styles(self) -> List[Dict[str, Any]]:
        """
        Get list of all available style packs
        """
        if self._styles_cache:
            return self._styles_cache

        # For development/demo, return default styles if no metadata file exists
        if not os.path.exists(self.metadata_file):
            return self._get_default_styles()

        try:
            with open(self.metadata_file, 'r') as f:
                data = json.load(f)
                # Convert dict to list and inject ID
                styles = []
                for style_id, style_data in data.items():
                    style_data['id'] = style_id
                    styles.append(style_data)
                
                self._styles_cache = styles
                return styles
        except Exception as e:
            logger.error(f"Failed to load LoRA metadata: {e}")
            return self._get_default_styles()

    def get_style(self, style_id: str) -> Optional[Dict[str, Any]]:
        """Get specific style details"""
        styles = self.get_available_styles()
        for style in styles:
            if style['id'] == style_id:
                return style
        return None

    def _get_default_styles(self) -> List[Dict[str, Any]]:
        """Return default styles for development"""
        return [
            {
                "id": "cinematic",
                "name": "Cinematic",
                "description": "High contrast, dramatic lighting, movie look",
                "trigger_words": ["cinematic", "dramatic lighting", "4k", "highly detailed"],
                "preview_url": "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=500&q=80",
                "default_weight": 0.8
            },
            {
                "id": "anime",
                "name": "Anime Vibrant",
                "description": "Japanese animation style, vibrant colors",
                "trigger_words": ["anime style", "cel shaded", "vibrant", "studio ghibli"],
                "preview_url": "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&q=80",
                "default_weight": 0.7
            },
            {
                "id": "3d-render",
                "name": "3D Render",
                "description": "Octane render, unreal engine 5 style",
                "trigger_words": ["3d render", "octane render", "unreal engine", "ray tracing"],
                "preview_url": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80",
                "default_weight": 0.9
            },
            {
                "id": "analog",
                "name": "Analog Film",
                "description": "Vintage film look, grain, light leaks",
                "trigger_words": ["analog film", "grain", "vintage", "kodak portra"],
                "preview_url": "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=500&q=80",
                "default_weight": 0.6
            }
        ]

# Global instance
lora_manager = LoRAManager()
