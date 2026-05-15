"""
Modal Configuration for FlowAI
Deploy serverless GPU workers for video generation.

Usage:
    modal deploy modal_app.py

Architecture:
    1. Receives prompt + style config from Celery worker or direct call.
    2. Generates a seed image using SDXL Turbo (text-to-image).
    3. Feeds the seed into StableVideoDiffusion for frame generation.
    4. Encodes frames to MP4 using moviepy/ffmpeg.
    5. Uploads to S3 and returns the public URL.

Models cached in /models volume to avoid re-downloading on cold starts.
"""

import modal
import os

# Define image with dependencies
image = (
    modal.Image.from_registry("nvidia/cuda:12.1.0-runtime-ubuntu22.04", add_python="3.10")
    .apt_install("git", "ffmpeg", "libsm6", "libxext6")
    .pip_install(
        "torch==2.1.2",
        "diffusers==0.25.0",
        "transformers==4.36.0",
        "accelerate==0.25.0",
        "safetensors==0.4.1",
        "xformers==0.0.23",
        "opencv-python-headless",
        "moviepy==1.0.3",
        "Pillow",
        "boto3",
    )
)

app = modal.App("flowai-worker")

# Volume for model caching
model_volume = modal.Volume.from_name("flowai-models", create_if_missing=True)

# Style presets that map style_id to generation parameters
STYLE_PRESETS = {
    "cinematic": {
        "prompt_suffix": ", cinematic lighting, dramatic shadows, film grain, 4k, anamorphic lens",
        "negative_prompt": "cartoon, anime, blurry, low quality, watermark",
        "num_frames": 25,
        "decode_chunk_size": 8,
    },
    "anime": {
        "prompt_suffix": ", anime style, cel shaded, vibrant colors, studio ghibli quality",
        "negative_prompt": "photorealistic, 3d render, blurry, watermark",
        "num_frames": 20,
        "decode_chunk_size": 4,
    },
    "photorealistic": {
        "prompt_suffix": ", photorealistic, natural lighting, ultra detailed, 8k uhd",
        "negative_prompt": "cartoon, painting, illustration, blurry, watermark",
        "num_frames": 25,
        "decode_chunk_size": 8,
    },
    "artistic": {
        "prompt_suffix": ", oil painting style, impressionist, rich textures, fine art",
        "negative_prompt": "photorealistic, 3d, blurry, low quality, watermark",
        "num_frames": 20,
        "decode_chunk_size": 4,
    },
}

DEFAULT_STYLE = {
    "prompt_suffix": ", high quality, detailed",
    "negative_prompt": "blurry, low quality, watermark, distorted",
    "num_frames": 25,
    "decode_chunk_size": 8,
}


def _generate_seed_image(prompt: str, negative_prompt: str, cache_dir: str):
    """Generate a seed image from text using SDXL Turbo for fast conditioning."""
    import torch
    from diffusers import AutoPipelineForText2Image

    print("[1/4] Loading SDXL Turbo for seed image generation...")
    seed_pipe = AutoPipelineForText2Image.from_pretrained(
        "stabilityai/sdxl-turbo",
        torch_dtype=torch.float16,
        variant="fp16",
        cache_dir=cache_dir,
    )
    seed_pipe.to("cuda")

    print("[1/4] Generating seed image...")
    image = seed_pipe(
        prompt=prompt,
        negative_prompt=negative_prompt,
        num_inference_steps=4,
        guidance_scale=0.0,  # Turbo mode — no CFG needed
        width=1024,
        height=576,
    ).images[0]

    # Free VRAM before loading the video model
    del seed_pipe
    torch.cuda.empty_cache()

    return image


def _generate_frames(seed_image, num_frames: int, decode_chunk_size: int, cache_dir: str):
    """Run SVD img2vid-xt to produce video frames from the seed image."""
    import torch
    from diffusers import StableVideoDiffusionPipeline

    print("[2/4] Loading StableVideoDiffusion for frame generation...")
    video_pipe = StableVideoDiffusionPipeline.from_pretrained(
        "stabilityai/stable-video-diffusion-img2vid-xt",
        torch_dtype=torch.float16,
        variant="fp16",
        cache_dir=cache_dir,
    )
    video_pipe.enable_model_cpu_offload()

    print(f"[2/4] Generating {num_frames} frames...")
    generator = torch.manual_seed(42)
    frames = video_pipe(
        image=seed_image,
        num_frames=num_frames,
        decode_chunk_size=decode_chunk_size,
        generator=generator,
    ).frames[0]

    del video_pipe
    torch.cuda.empty_cache()

    return frames


def _encode_video(frames, fps: int = 7) -> str:
    """Encode PIL frames into an MP4 file using moviepy."""
    import numpy as np
    from moviepy.editor import ImageSequenceClip

    print(f"[3/4] Encoding {len(frames)} frames to MP4 at {fps}fps...")
    frame_arrays = [np.array(frame) for frame in frames]
    clip = ImageSequenceClip(frame_arrays, fps=fps)

    output_path = "/tmp/flowai_output.mp4"
    clip.write_videofile(
        output_path,
        codec="libx264",
        audio=False,
        logger=None,
    )
    return output_path


def _upload_to_s3(local_path: str, prompt: str) -> str:
    """Upload the generated video to S3 and return the public URL."""
    import boto3
    import hashlib
    import time

    print("[4/4] Uploading to S3...")

    bucket = os.environ.get("AWS_S3_BUCKET", "flowai-generated-videos")
    region = os.environ.get("AWS_REGION", "eu-west-1")

    # Deterministic but unique key
    hash_seed = f"{prompt}-{time.time()}"
    file_hash = hashlib.sha256(hash_seed.encode()).hexdigest()[:12]
    s3_key = f"generated/{file_hash}.mp4"

    s3 = boto3.client(
        "s3",
        region_name=region,
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
    )
    s3.upload_file(
        local_path,
        bucket,
        s3_key,
        ExtraArgs={"ContentType": "video/mp4"},
    )

    url = f"https://{bucket}.s3.{region}.amazonaws.com/{s3_key}"
    print(f"[4/4] Uploaded: {url}")
    return url


@app.function(
    image=image,
    gpu="A100",
    timeout=600,
    volumes={"/models": model_volume},
    secrets=[modal.Secret.from_name("flowai-secrets")],
)
def generate_video(prompt: str, style_id: str = None, duration: int = 4):
    """
    End-to-end video generation pipeline.

    Args:
        prompt: Text description of the desired video.
        style_id: Optional style preset (cinematic, anime, photorealistic, artistic).
        duration: Target duration in seconds (controls frame count via fps).

    Returns:
        dict with status, url, duration, resolution, and style metadata.
    """
    cache_dir = "/models/huggingface"
    style = STYLE_PRESETS.get(style_id, DEFAULT_STYLE)

    conditioned_prompt = prompt + style["prompt_suffix"]
    negative_prompt = style["negative_prompt"]
    num_frames = min(style["num_frames"], duration * 7)  # ~7fps for SVD
    decode_chunk_size = style["decode_chunk_size"]

    print(f"=== FlowAI Video Generation ===")
    print(f"Prompt: {conditioned_prompt[:80]}...")
    print(f"Style: {style_id or 'default'} | Frames: {num_frames}")

    # Step 1: Seed image
    seed_image = _generate_seed_image(conditioned_prompt, negative_prompt, cache_dir)

    # Step 2: Video frames
    frames = _generate_frames(seed_image, int(num_frames), decode_chunk_size, cache_dir)

    # Step 3: Encode to MP4
    video_path = _encode_video(frames, fps=7)

    # Step 4: Upload
    video_url = _upload_to_s3(video_path, prompt)

    return {
        "status": "completed",
        "url": video_url,
        "duration": len(frames) / 7.0,
        "resolution": "1024x576",
        "style": style_id or "default",
        "frames_generated": len(frames),
    }


@app.local_entrypoint()
def main():
    """Local test entrypoint."""
    result = generate_video.remote("A cyberpunk city in rain", style_id="cinematic")
    print(f"Result: {result}")
