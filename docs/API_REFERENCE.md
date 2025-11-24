# FlowAI API Reference

Base URL: `/api/v1`

## 🎬 Video Generation (`/video`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/generate` | Start a new video generation task |
| GET | `/status/{task_id}` | Check status of a generation task |
| GET | `/styles` | List available LoRA style packs |

## 🤝 Co-Streaming (`/co-streaming`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/matches` | Find potential co-streaming partners |
| POST | `/raid` | Initiate a raid on another stream |

## 😄 Emotes (`/emotes`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/generate` | Generate a custom AI emote |
| GET | `/library` | Get user's generated emotes |

## 🛡️ Safety (`/safety`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/check` | Check content for deepfakes/NSFW |

## 🥩 Staking (`/staking`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/info` | Get user's staking balance and rewards |
| GET | `/stats` | Get global platform TVL and APY |

## 🛍️ Marketplace (`/marketplace`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/listings` | Get active NFT listings |
| POST | `/mint` | Mint a video as an NFT |
| POST | `/buy/{id}` | Purchase a listed NFT |

## 📈 Economy (`/economy`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/coins/{id}` | Get Creator Coin price and supply |
| POST | `/coins/buy` | Buy Creator Coins |
| POST | `/coins/sell` | Sell Creator Coins |
| GET | `/governance/proposals` | List DAO proposals |
| POST | `/governance/vote` | Vote on a proposal |

## 🔔 Notifications (`/notifications`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/subscribe` | Register for push notifications |
| POST | `/test` | Send a test notification |

## 🚀 Social Export (`/social-export`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/share` | Export video to TikTok/Reels/Shorts |
| GET | `/history` | Get export history |

## 👥 Referrals V2 (`/referrals-v2`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Get referral stats and share links |
| POST | `/claim` | Claim a referral code |
| GET | `/leaderboard` | Get top referrers |
