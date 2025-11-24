# FlowAI - Quick Deployment & Testing Guide

## 🚀 Step-by-Step Local Deployment

### Prerequisites Check
```bash
node --version    # Should be 18+
python --version  # Should be 3.11+
docker --version  # For Redis/PostgreSQL
```

---

## 1️⃣ Start Infrastructure (5 minutes)

### Terminal 1: Redis
```bash
docker run --name flowai-redis -p 6379:6379 -d redis:7
```

### Terminal 2: PostgreSQL
```bash
docker run --name flowai-postgres \
  -e POSTGRES_USER=flowai \
  -e POSTGRES_PASSWORD=flowai123 \
  -e POSTGRES_DB=flowai_dev \
  -p 5432:5432 \
  -d postgres:15
```

**Verify running**:
```bash
docker ps
# Should show both containers running
```

---

## 2️⃣ Backend Setup (10 minutes)

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn sqlalchemy alembic psycopg2-binary redis stripe web3 pydantic-settings python-dotenv

# Create .env file
cp .env.example .env
```

**Edit `.env`** with minimal config:
```bash
# Database
DATABASE_URL=postgresql://flowai:flowai123@localhost:5432/flowai_dev
REDIS_URL=redis://localhost:6379

# Stripe (use test keys for now)
STRIPE_SECRET_KEY=sk_test_your_test_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key_here
STRIPE_WEBHOOK_SECRET=whsec_test_key_here

# Optional for now (skip blockchain)
# POLYGON_RPC_URL=https://polygon-rpc.com
# FLO_TOKEN_CONTRACT_ADDRESS=0x...

# JWT
JWT_SECRET=dev-secret-key-change-in-production-min-32-chars
JWT_ALGORITHM=HS256
JWT_EXPIRATION=86400
```

**Run migrations**:
```bash
# Initialize Alembic (if not done)
alembic init alembic

# Create migration
alembic revision --autogenerate -m "Initial schema"

# Apply migration
alembic upgrade head
```

**Start backend**:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Test**: Open http://localhost:8000/docs (Swagger UI)

---

## 3️⃣ Frontend Setup (5 minutes)

### New Terminal:
```bash
cd frontend

# Install dependencies
npm install

# Create .env
cp .env.example .env
```

**Edit `.env`**:
```bash
VITE_API_URL=http://localhost:8000/v1
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key_here
```

**Start frontend**:
```bash
npm run dev
```

**Test**: Open http://localhost:5173

---

## 4️⃣ Quick Health Check (2 minutes)

### Backend API Test
```bash
# Health check
curl http://localhost:8000/health

# Expected: {"status":"healthy"}
```

### Frontend Test
1. Open http://localhost:5173
2. Should see homepage
3. Try signup/login
4. Navigate to different pages

---

## 5️⃣ Stripe Test Mode Setup (10 minutes)

### A. Create Test Products

1. Go to https://dashboard.stripe.com/test/products
2. Click "Add product"

**Product 1: FlowAI PRO**
- Name: FlowAI PRO
- Price: $9.99
- Billing: Recurring monthly
- Copy Price ID → Add to `.env` as `STRIPE_PRICE_PRO`

**Product 2: FlowAI STUDIO**
- Name: FlowAI STUDIO  
- Price: $49.99
- Billing: Recurring monthly
- Copy Price ID → Add to `.env` as `STRIPE_PRICE_STUDIO`

**Product 3: FlowAI BUSINESS**
- Name: FlowAI BUSINESS
- Price: $199
- Billing: Recurring monthly
- Copy Price ID → Add to `.env` as `STRIPE_PRICE_BUSINESS`

### B. Test Checkout Flow

**Test Card**: 4242 4242 4242 4242
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

1. Navigate to http://localhost:5173/pricing
2. Click "Get Started" on PRO
3. Should redirect to Stripe Checkout
4. Use test card above
5. Complete purchase
6. Should redirect back with success

---

## 6️⃣ Run Automated Tests (5 minutes)

### Backend Tests
```bash
cd backend

# Install test dependencies
pip install pytest pytest-asyncio pytest-mock

# Run tests
pytest tests/test_subscriptions.py -v

# Expected output:
# test_free_tier_limits PASSED
# test_pro_tier_limits PASSED
# test_can_generate_within_limit PASSED
# etc.
```

### Check Test Coverage
```bash
pytest --cov=app tests/
# Target: >70% coverage
```

---

## 7️⃣ Manual Testing Checklist

### ✅ User Flow
- [ ] Sign up new account
- [ ] Verify email (if enabled)
- [ ] Login successfully
- [ ] Generate first video (FREE tier)
- [ ] Hit rate limit (try 11th generation)
- [ ] Navigate to /pricing
- [ ] Purchase PRO tier
- [ ] Generate 11th video (should work now)
- [ ] Check analytics dashboard
- [ ] View token balance

### ✅ Payment Flow
- [ ] Stripe checkout loads
- [ ] Test card works
- [ ] Redirect back to app
- [ ] Subscription shows in dashboard
- [ ] Can cancel subscription
- [ ] Can reactivate subscription

### ✅ Token Flow
- [ ] Navigate to /tokens
- [ ] Purchase $10 tokens
- [ ] See bonus applied (5% for $10+)
- [ ] Balance updates
- [ ] Check token stats page

---

## 🐛 Common Issues & Fixes

### Issue 1: "Database connection failed"
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Restart if needed
docker restart flowai-postgres

# Verify connection
psql postgresql://flowai:flowai123@localhost:5432/flowai_dev -c "\dt"
```

### Issue 2: "Redis connection refused"
```bash
# Check Redis is running
docker ps | grep redis

# Test connection
redis-cli ping
# Expected: PONG

# Restart if needed
docker restart flowai-redis
```

### Issue 3: "Stripe error: No API key provided"
```bash
# Verify .env has Stripe keys
cat backend/.env | grep STRIPE

# Make sure to restart backend after adding keys
# Press Ctrl+C in backend terminal, then:
uvicorn app.main:app --reload
```

### Issue 4: "ModuleNotFoundError"
```bash
# Reinstall dependencies
cd backend
pip install -r requirements.txt

# Or install missing module directly
pip install <module_name>
```

### Issue 5: Frontend won't start
```bash
# Clear node modules and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## 📊 Verify Everything Works

### Backend Endpoints to Test

```bash
# 1. Health
curl http://localhost:8000/health

# 2. Token pricing (no auth needed)
curl http://localhost:8000/v1/tokens/pricing

# 3. Analytics (needs admin auth - replace JWT)
curl -H "Authorization: Bearer YOUR_JWT_HERE" \
  http://localhost:8000/v1/analytics/metrics

# 4. Create checkout (needs user auth)
curl -X POST http://localhost:8000/v1/subscriptions/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_HERE" \
  -d '{
    "tier": "pro",
    "success_url": "http://localhost:5173/success",
    "cancel_url": "http://localhost:5173/cancel"
  }'
```

### Frontend Pages to Check
- [ ] http://localhost:5173 → Homepage
- [ ] http://localhost:5173/pricing → Pricing page loads
- [ ] http://localhost:5173/marketplace → Style packs display
- [ ] http://localhost:5173/wallet → Token purchase UI
- [ ] http://localhost:5173/analytics → Dashboard (admin only)

---

## ✅ Success Criteria

**You're ready to demo if**:
- ✅ Backend API responds (http://localhost:8000/docs)
- ✅ Frontend loads (http://localhost:5173)
- ✅ Database connected (tables created)
- ✅ Redis working (rate limiting active)
- ✅ Stripe checkout creates session
- ✅ Can sign up and login
- ✅ Can navigate all pages

---

## 🎯 Next Steps After Local Testing

1. **Deploy to Staging**
   - Use deployment_guide.md
   - Deploy smart contract to Mumbai testnet
   - Setup production Stripe webhook

2. **Performance Testing**
   - Load test with k6
   - Check response times (<500ms target)
   - GPU optimization

3. **Security Audit**
   - SQL injection tests
   - XSS prevention
   - Rate limiting verification
   - JWT expiration checks

---

## 📞 Need Help?

**Check logs**:
```bash
# Backend logs
tail -f backend/logs/app.log

# Frontend logs  
npm run dev --verbose
```

**Common commands**:
```bash
# Stop all Docker containers
docker stop flowai-redis flowai-postgres

# Remove containers
docker rm flowai-redis flowai-postgres

# Check Python packages
pip list

# Check Node packages
npm list --depth=0
```

---

**Ready to deploy!** 🚀

Start with Terminal 1 (Redis), then 2 (PostgreSQL), then 3 (Backend), then 4 (Frontend).
