from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import context_ingestion, attention_economy, social_features, video_generation
from app.core.config import settings

app = FastAPI(
    title="Lovable AI Core",
    description="Backend API for Multimodal Video Platform (LRM & Video Generation)",
    version="0.1.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(context_ingestion.router, prefix="/api/v1/context", tags=["Context Ingestion"])
app.include_router(attention_economy.router, prefix="/api/v1/economy", tags=["Attention Economy"])
app.include_router(social_features.router, prefix="/api/v1/social", tags=["Social Hive"])
app.include_router(video_generation.router, prefix="/api/v1/video", tags=["Video Generation"])

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "Lovable AI Core"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
