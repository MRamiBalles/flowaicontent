# Testing & Setup Guide for Sprint 1.1

## Prerequisites

1. **Install Dependencies**
```bash
cd backend
pip install -r requirements.txt
pip install pytest pytest-asyncio pytest-mock
```

2. **Setup Environment Variables**
```bash
cp .env.example .env
# Edit .env and add your Stripe test keys
```

3. **Start Services**
```bash
# Terminal 1: Redis
docker run -p 6379:6379 redis:7

# Terminal 2: PostgreSQL
docker run -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:15

# Terminal 3: Backend
cd backend
uvicorn app.main:app --reload
```

---

## Running Tests

### Unit Tests
```bash
cd backend
pytest tests/test_subscriptions.py -v
```

### Integration Tests (with Stripe Test Mode)
```bash
# 1. Get Stripe test keys from https://dashboard.stripe.com/test/apikeys
# 2. Add to .env:
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# 3. Run integration tests
pytest tests/test_subscriptions.py::TestStripeIntegration -v
```

---

## Manual Testing Checklist

### ✅ Test Checkout Flow

1. **Start Frontend**
```bash
cd ../
npm run dev
```

2. **Navigate to Pricing**
- Go to http://localhost:5173/pricing
- Click "Get Started" on PRO tier

3. **Expected**: Redirects to Stripe Checkout
- Use test card: 4242 4242 4242 4242
- Expiry: any future date
- CVC: any 3 digits

4. **After Payment**
- Redirects to /dashboard?checkout=success
- User tier upgraded to "pro"
- Check database: `SELECT * FROM subscriptions;`

---

### ✅ Test Rate Limiting

```bash
# Test FREE tier (10 gen/day limit)
curl -X POST http://localhost:8000/v1/videos/generate \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test", "style": "cinematic"}'

# Repeat 11 times, 11th should return 429
```

---

### ✅ Test Stripe Webhooks

1. **Install Stripe CLI**
```bash
brew install stripe/stripe-cli/stripe
stripe login
```

2. **Forward Webhooks to Local**
```bash
stripe listen --forward-to localhost:8000/v1/subscriptions/webhook
```

3. **Trigger Test Events**
```bash
# Test subscription created
stripe trigger checkout.session.completed

# Test subscription canceled
stripe trigger customer.subscription.deleted
```

4. **Verify in Database**
```sql
SELECT * FROM subscriptions ORDER BY created_at DESC LIMIT 5;
```

---

### ✅ Test Subscription Management

1. **Cancel Subscription**
```bash
curl -X POST http://localhost:8000/v1/subscriptions/cancel \
  -H "Authorization: Bearer YOUR_JWT"
```

Expected: `cancel_at_period_end: true`

2. **Reactivate Subscription**
```bash
curl -X POST http://localhost:8000/v1/subscriptions/reactivate \
  -H "Authorization: Bearer YOUR_JWT"
```

Expected: `cancel_at_period_end: false`

3. **Customer Portal**
```bash
curl http://localhost:8000/v1/subscriptions/portal \
  -H "Authorization: Bearer YOUR_JWT"
```

Expected: Returns Stripe portal URL

---

## Database Migrations

```bash
cd backend

# Create migration
alembic revision --autogenerate -m "create subscriptions table"

# Run migration
alembic upgrade head

# Rollback
alembic downgrade -1
```

---

## Common Issues & Solutions

### Issue: "Stripe API key not set"
**Solution**: Check `.env` file has `STRIPE_SECRET_KEY`

### Issue: "Redis connection refused"
**Solution**: Start Redis: `docker run -p 6379:6379 redis:7`

### Issue: "Rate limit not working"
**Solution**: Flush Redis: `redis-cli FLUSHDB`

### Issue: "Webhook signature verification failed"
**Solution**: 
1. Get webhook secret from Stripe CLI output
2. Add to `.env`: `STRIPE_WEBHOOK_SECRET=whsec_xxxxx`

---

## Performance Benchmarks

### Expected Metrics:
- **Checkout Creation**: <500ms
- **Rate Limit Check**: <10ms (Redis cached)
- **Webhook Processing**: <200ms
- **Usage Stats Query**: <50ms

### Load Test (k6):
```javascript
import http from 'k6/http';

export let options = {
  vus: 100,
  duration: '30s',
};

export default function () {
  http.get('http://localhost:8000/v1/subscriptions/usage', {
    headers: { 'Authorization': 'Bearer test_token' }
  });
}
```

---

## Next Steps After Testing

If all tests pass:
1. ✅ Mark Sprint 1.1 complete
2. 🚀 Proceed to Sprint 1.2: Style Packs Marketplace
3. 📊 Deploy to staging environment
4. 🔔 Set up Sentry error tracking

---

## Support

Questions? Check logs:
```bash
tail -f backend/logs/app.log
```

Or open an issue on GitHub.
