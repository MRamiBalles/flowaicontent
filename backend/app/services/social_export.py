"""
TikTok/Instagram Export Optimizer
Auto-optimize videos for social media platforms
"""

import cv2
import numpy as np
from moviepy.editor import VideoFileClip, TextClip, CompositeVideoClip, AudioFileClip
from PIL import Image, ImageDraw, ImageFont
import subprocess
from typing import Optional, Tuple
import os

class SocialMediaExporter:
    """Optimize videos for TikTok, Instagram, YouTube Shorts"""
    
    def __init__(self):
        self.tiktok_size = (1080, 1920)  # 9:16
        self.instagram_reel_size = (1080, 1920)  # 9:16
        self.youtube_shorts_size = (1080, 1920)  # 9:16
    
    def export_for_tiktok(
        self,
        input_video: str,
        output_path: str,
        add_captions: bool = True,
        add_trending_music: bool = False,
        add_watermark: bool = True
    ) -> str:
        """Export video optimized for TikTok"""
        
        clip = VideoFileClip(input_video)
        
        # Resize to 9:16
        clip_resized = self._resize_to_vertical(clip, self.tiktok_size)
        
        # Add auto-captions
        if add_captions:
            clip_resized = self._add_auto_captions(clip_resized)
        
        # Add trending music
        if add_trending_music:
            music_file = self._get_trending_music()
            if music_file:
                audio = AudioFileClip(music_file)
                clip_resized = clip_resized.set_audio(audio)
        
        # Add watermark
        if add_watermark:
            clip_resized = self._add_watermark(clip_resized, "flowai.com")
        
        # Export with TikTok-optimized settings
        clip_resized.write_videofile(
            output_path,
            codec='libx264',
            audio_codec='aac',
            preset='medium',
            fps=30,
            bitrate='8000k'
        )
        
        clip.close()
        clip_resized.close()
        
        return output_path
    
    def export_for_instagram(
        self,
        input_video: str,
        output_path: str,
        add_captions: bool = True,
        add_watermark: bool = True
    ) -> str:
        """Export video optimized for Instagram Reels"""
        
        clip = VideoFileClip(input_video)
        
        # Resize to 9:16
        clip_resized = self._resize_to_vertical(clip, self.instagram_reel_size)
        
        # Add captions
        if add_captions:
            clip_resized = self._add_auto_captions(clip_resized)
        
        # Add watermark (more subtle for IG)
        if add_watermark:
            clip_resized = self._add_watermark(clip_resized, "@flowai", position="bottom_right")
        
        # Instagram-specific encoding
        clip_resized.write_videofile(
            output_path,
            codec='libx264',
            audio_codec='aac',
            preset='slow',
            fps=30,
            bitrate='10000k',  # Higher quality for IG
            audio_bitrate='192k'
        )
        
        clip.close()
        clip_resized.close()
        
        return output_path
    
    def _resize_to_vertical(self, clip: VideoFileClip, target_size: Tuple[int, int]) -> VideoFileClip:
        """Resize horizontal video to vertical (9:16)"""
        
        w, h = clip.size
        target_w, target_h = target_size
        
        # If already vertical, just resize
        if h > w:
            return clip.resize(height=target_h)
        
        # Crop center for horizontal videos
        aspect_ratio = target_w / target_h
        new_w = int(h * aspect_ratio)
        
        # Center crop
        x_center = w / 2
        x1 = int(x_center - new_w / 2)
        x2 = int(x_center + new_w / 2)
        
        clip_cropped = clip.crop(x1=x1, x2=x2)
        clip_resized = clip_cropped.resize((target_w, target_h))
        
        return clip_resized
    
    def _add_auto_captions(self, clip: VideoFileClip) -> VideoFileClip:
        """Add auto-generated captions using Whisper"""
        
        # Extract audio and transcribe with Whisper
        try:
            import whisper
            model = whisper.load_model("base")
            
            # Extract audio to temp file
            audio_path = "/tmp/temp_audio.wav"
            clip.audio.write_audiofile(audio_path)
            
            # Transcribe
            result = model.transcribe(audio_path)
            
            # Create caption clips for each segment
            caption_clips = []
            for segment in result["segments"]:
                caption = TextClip(
                    segment["text"],
                    fontsize=40,
                    color='white',
                    stroke_color='black',
                    stroke_width=2,
                    font='Arial-Bold'
                )
                caption = caption.set_start(segment["start"]).set_duration(segment["end"] - segment["start"])
                caption = caption.set_position(('center', 'bottom'))
                caption_clips.append(caption)
            
            return CompositeVideoClip([clip] + caption_clips)
        except Exception as e:
            print(f"Whisper transcription failed: {e}")
            # Fallback to static caption
            caption = TextClip(
                "Generated with FlowAI",
                fontsize=40,
                color='white',
                stroke_color='black',
                stroke_width=2,
                font='Arial-Bold'
            )
            caption = caption.set_position(('center', 'bottom')).set_duration(clip.duration)
            return CompositeVideoClip([clip, caption])
    
    def _add_watermark(
        self,
        clip: VideoFileClip,
        text: str,
        position: str = "bottom_center"
    ) -> VideoFileClip:
        """Add subtle watermark"""
        
        watermark = TextClip(
            text,
            fontsize=20,
            color='white',
            font='Arial',
            stroke_color='black',
            stroke_width=1
        )
        
        # Position watermark
        if position == "bottom_center":
            watermark = watermark.set_position(('center', 0.95), relative=True)
        elif position == "bottom_right":
            watermark = watermark.set_position((0.85, 0.95), relative=True)
        elif position == "top_right":
            watermark = watermark.set_position((0.85, 0.05), relative=True)
        
        watermark = watermark.set_duration(clip.duration).set_opacity(0.7)
        
        return CompositeVideoClip([clip, watermark])
    
    def _get_trending_music(self) -> Optional[str]:
        """Get trending music file"""
        # Trending music library
        trending_tracks = [
            "/music/trending/upbeat_1.mp3",
            "/music/trending/chill_vibes.mp3",
            "/music/trending/energetic.mp3",
            "/music/trending/ambient.mp3"
        ]
        
        # Check if files exist
        for track in trending_tracks:
            if os.path.exists(track):
                return track
        
        # If no trending music available, return None
        return None
    
    def batch_export(
        self,
        input_video: str,
        output_dir: str,
        platforms: list = ["tiktok", "instagram"]
    ) -> dict:
        """Export to multiple platforms at once"""
        
        results = {}
        
        if "tiktok" in platforms:
            tiktok_path = os.path.join(output_dir, "tiktok_export.mp4")
            results["tiktok"] = self.export_for_tiktok(input_video, tiktok_path)
        
        if "instagram" in platforms:
            ig_path = os.path.join(output_dir, "instagram_export.mp4")
            results["instagram"] = self.export_for_instagram(input_video, ig_path)
        
        return results


# Example usage
if __name__ == "__main__":
    exporter = SocialMediaExporter()
    
    # Test export
    input_video = "generated_video.mp4"
    output_dir = "exports"
    
    os.makedirs(output_dir, exist_ok=True)
    
    results = exporter.batch_export(
        input_video,
        output_dir,
        platforms=["tiktok", "instagram"]
    )
    
    print("✅ Exports complete:")
    for platform, path in results.items():
        print(f"  {platform}: {path}")
