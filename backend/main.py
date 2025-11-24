```app.include_router(video_generation.router, prefix="/api/v1/video", tags=["Video Generation"])
app.include_router(co_streaming.router, prefix="/api/v1/co-streaming", tags=["Co-Streaming"])
import emotes
import safety
app.include_router(emotes.router, prefix="/api/v1/emotes", tags=["Emotes"])
app.include_router(safety.router, prefix="/api/v1/safety", tags=["Safety"])
```
