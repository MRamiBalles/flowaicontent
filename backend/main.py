app.include_router(video_generation.router, prefix="/api/v1/video", tags=["Video Generation"])
app.include_router(co_streaming.router, prefix="/api/v1/co-streaming", tags=["Co-Streaming"])
import emotes
import safety
import staking
import marketplace
import trading
import economy
import notifications
import referrals_v2
import social_export_v2
app.include_router(emotes.router, prefix="/api/v1/emotes", tags=["Emotes"])
app.include_router(safety.router, prefix="/api/v1/safety", tags=["Safety"])
app.include_router(staking.router, prefix="/api/v1/staking", tags=["Staking"])
app.include_router(marketplace.router, prefix="/api/v1/marketplace", tags=["Marketplace"])
app.include_router(trading.router, prefix="/api/v1/trading", tags=["Trading"])
app.include_router(economy.router, prefix="/api/v1/economy", tags=["Economy"])
app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["Notifications"])
app.include_router(referrals_v2.router, prefix="/api/v1/referrals-v2", tags=["Referrals V2"])
app.include_router(social_export_v2.router, prefix="/api/v1/social-export", tags=["Social Export"])
