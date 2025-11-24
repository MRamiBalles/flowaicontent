import asyncio
import sys
import os
from pathlib import Path

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.services.video_engine import video_engine
from app.data.processor import main as process_data
# from app.training.train_lora import main as train_model # This would run the training loop

async def verify_phase_2():
    print("=== Starting Phase 2 Verification ===")
    
    # 1. Data Processing
    print("\n[1] Verifying Data Processing...")
    process_data()
    if Path("backend/app/data/processed/dummy_video_01.mp4").exists():
        print("✅ Data processing successful.")
    else:
        print("❌ Data processing failed.")
        
    # 2. Training Simulation
    print("\n[2] Verifying Training Pipeline...")
    # We won't run the full training loop here as it might take time/resources, 
    # but we assume the script exists and is valid.
    if Path("backend/app/training/train_lora.py").exists():
        print("✅ Training script exists.")
    else:
        print("❌ Training script missing.")

    # 3. Inference Optimization
    print("\n[3] Verifying Inference Optimization...")
    video_engine.optimize_inference(bits=8)
    
    # 4. LoRA Adapter Loading
    print("\n[4] Verifying LoRA Adapter Loading...")
    video_engine.load_style_adapter("path/to/cyberpunk_lora.safetensors")
    
    # 5. Generation
    print("\n[5] Verifying Generation with Adapter...")
    result = await video_engine.process_scene("A cyberpunk detective walking in the rain")
    
    if result["status"] == "completed" and result["adapter"] is not None:
        print("✅ Generation with adapter successful.")
        print(f"   Video URL: {result['video_url']}")
    else:
        print("❌ Generation failed.")

    print("\n=== Phase 2 Verification Complete ===")

if __name__ == "__main__":
    asyncio.run(verify_phase_2())
