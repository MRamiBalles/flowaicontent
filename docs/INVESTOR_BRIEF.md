# FlowAI: Technical Overview for Investors

## Summary

FlowAI is a content creation platform for professional creators and media companies. The product combines video editing, AI dubbing, thumbnail generation, and audience analytics in a single web application.

**Target Market**: Creator economy ($250B by 2025)

**Competitive Position**: All-in-one platform vs. point solutions (ElevenLabs for voice, Runway for video, etc.)

## Technology

| Layer | Stack | Notes |
|-------|-------|-------|
| Frontend | React, TypeScript | Desktop-first, mobile planned |
| Database | PostgreSQL (Supabase) | Row-level security enabled |
| Serverless | Deno Edge Functions | <50ms cold starts |
| AI | OpenAI, ElevenLabs, Fal.ai | Best-in-class APIs |
| Payments | Stripe | Subscriptions + usage billing |
| Video Render | AWS Lambda + Remotion | Parallel encoding |

## Security

- All tables protected by row-level security policies
- JWT-based authentication
- Role-based access control
- Enterprise tenant isolation
- December 2025 security audit: no critical findings

## Revenue Model

Credit-based pricing. Users purchase credits consumed by AI features.

| Feature | Credit Cost |
|---------|-------------|
| AI text generation | 1 |
| Thumbnail | 5 |
| 1-minute dubbing | 10 |
| Voice clone | 100 |

### Subscription Tiers (Updated December 2025)

| Tier | Monthly | Generations | Target |
|------|---------|-------------|--------|
| Free | $0 | 20/day (~600/mo) | Trial |
| Creator | $9.99 | 500/month | Hobbyists |
| Pro | $99.99 | Unlimited | Agencies |
| Enterprise | Custom | Unlimited | Large organizations |

*Note: Migrated from credit-based to generation-based pricing in December 2025 for simplicity.*

## Comparable Companies

| Company | Focus | Funding | Valuation |
|---------|-------|---------|-----------|
| ElevenLabs | Voice AI | $350M | $3.3B |
| Runway | Video AI | $240M | $4B |
| Synthesia | Avatar video | $180M | $4B |
| Descript | Audio/video editing | $100M | $550M |

FlowAI differentiates by combining capabilities these companies offer separately.

## Milestones

| Quarter | Goal |
|---------|------|
| Q1 2025 | 1,000 active users, $10K MRR |
| Q2 2025 | Mobile app launch |
| Q3 2025 | Enterprise pilots (3 companies) |
| Q4 2025 | Series A readiness |

## Use of Funds (Seed Round)

| Category | Allocation |
|----------|------------|
| Engineering | 50% |
| Marketing | 25% |
| Infrastructure | 15% |
| Operations | 10% |

## Technical Documentation

- [Architecture](ARCHITECTURE.md)
- [Video Editor](VIDEO_EDITOR_PRO.md)
- [Security Audit](SECURITY_AUDIT_2025-12.md)
- [API Reference](API_REFERENCE.md)
