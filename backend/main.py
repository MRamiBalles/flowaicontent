from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import ingest, economy, social

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
app.include_router(ingest.router, prefix="/api/v1/context", tags=["Context Ingestion"])
app.include_router(economy.router, prefix="/api/v1/economy", tags=["Attention Economy"])
app.include_router(social.router, prefix="/api/v1/social", tags=["Social Hive"])

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "Lovable AI Core"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
