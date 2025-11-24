#!/bin/bash
# FlowAI - Automated Setup Script for Development

echo "🚀 FlowAI Development Setup"
echo "============================"
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker Desktop."
    exit 1
fi
echo "✅ Docker installed"

# Check Python
if ! command -v python &> /dev/null; then
    echo "❌ Python not found. Please install Python 3.11+"
    exit 1
fi
echo "✅ Python installed: $(python --version)"

# Check Node
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi
echo "✅ Node.js installed: $(node --version)"

echo ""
echo "🐳 Starting Docker containers..."

# Start Redis
if [ ! "$(docker ps -q -f name=flowai-redis)" ]; then
    if [ "$(docker ps -aq -f status=exited -f name=flowai-redis)" ]; then
        docker rm flowai-redis
    fi
    docker run --name flowai-redis -p 6379:6379 -d redis:7
    echo "✅ Redis started on port 6379"
else
    echo "ℹ️  Redis already running"
fi

# Start PostgreSQL
if [ ! "$(docker ps -q -f name=flowai-postgres)" ]; then
    if [ "$(docker ps -aq -f status=exited -f name=flowai-postgres)" ]; then
        docker rm flowai-postgres
    fi
    docker run --name flowai-postgres \
      -e POSTGRES_USER=flowai \
      -e POSTGRES_PASSWORD=flowai123 \
      -e POSTGRES_DB=flowai_dev \
      -p 5432:5432 \
      -d postgres:15
    echo "✅ PostgreSQL started on port 5432"
    sleep 3
else
    echo "ℹ️  PostgreSQL already running"
fi

echo ""
echo "🐍 Setting up Backend..."

cd backend

# Create virtual environment if needed
if [ ! -d "venv" ]; then
    python -m venv venv
    echo "✅ Virtual environment created"
fi

# Activate virtual environment
source venv/bin/activate  # For Windows Git Bash: source venv/Scripts/activate

# Install dependencies
pip install -q -r requirements.txt
echo "✅ Backend dependencies installed"

# Create .env if not exists
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ .env file created (please configure your API keys)"
else
    echo "ℹ️  .env already exists"
fi

# Run migrations
echo "📊 Running database migrations..."
alembic upgrade head
echo "✅ Migrations complete"

cd ..

echo ""
echo "⚛️  Setting up Frontend..."

cd frontend

# Install dependencies
npm install --silent
echo "✅ Frontend dependencies installed"

# Create .env if not exists  
if [ ! -f ".env" ]; then
    echo "VITE_API_URL=http://localhost:8000/v1" > .env
    echo "VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here" >> .env
    echo "✅ Frontend .env created"
else
    echo "ℹ️  Frontend .env already exists"
fi

cd ..

echo ""
echo "✅ Setup Complete!"
echo ""
echo "🎯 Next Steps:"
echo ""
echo "1. Configure Stripe keys in backend/.env"
echo "2. Start backend:"
echo "   cd backend && source venv/bin/activate && uvicorn app.main:app --reload"
echo ""
echo "3. Start frontend (new terminal):"
echo "   cd frontend && npm run dev"
echo ""
echo "4. Open http://localhost:5173"
echo ""
echo "📚 See QUICK_START.md for detailed instructions"
