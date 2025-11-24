# FlowAI - Windows Setup Script (PowerShell)

Write-Host "🚀 FlowAI Development Setup" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""

# Check Docker
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker not found. Please install Docker Desktop." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker installed" -ForegroundColor Green

# Check Python
if (!(Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Python not found. Please install Python 3.11+" -ForegroundColor Red
    exit 1
}
$pythonVersion = python --version
Write-Host "✅ Python installed: $pythonVersion" -ForegroundColor Green

# Check Node
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}
$nodeVersion = node --version
Write-Host "✅ Node.js installed: $nodeVersion" -ForegroundColor Green

Write-Host ""
Write-Host "🐳 Starting Docker containers..." -ForegroundColor Yellow

# Start Redis
$redisRunning = docker ps --filter "name=flowai-redis" --format "{{.Names}}"
if (!$redisRunning) {
    docker rm flowai-redis -f 2>$null
    docker run --name flowai-redis -p 6379:6379 -d redis:7
    Write-Host "✅ Redis started on port 6379" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Redis already running" -ForegroundColor Blue
}

# Start PostgreSQL
$postgresRunning = docker ps --filter "name=flowai-postgres" --format "{{.Names}}"
if (!$postgresRunning) {
    docker rm flowai-postgres -f 2>$null
    docker run --name flowai-postgres `
      -e POSTGRES_USER=flowai `
      -e POSTGRES_PASSWORD=flowai123 `
      -e POSTGRES_DB=flowai_dev `
      -p 5432:5432 `
      -d postgres:15
    Write-Host "✅ PostgreSQL started on port 5432" -ForegroundColor Green
    Start-Sleep -Seconds 3
} else {
    Write-Host "ℹ️  PostgreSQL already running" -ForegroundColor Blue
}

Write-Host ""
Write-Host "🐍 Setting up Backend..." -ForegroundColor Yellow

Set-Location backend

# Create virtual environment
if (!(Test-Path "venv")) {
    python -m venv venv
    Write-Host "✅ Virtual environment created" -ForegroundColor Green
}

# Activate and install
& .\venv\Scripts\Activate.ps1
pip install -q -r requirements.txt
Write-Host "✅ Backend dependencies installed" -ForegroundColor Green

# Create .env
if (!(Test-Path ".env")) {
    Copy-Item .env.example .env
    Write-Host "✅ .env file created (please configure your API keys)" -ForegroundColor Green
} else {
    Write-Host "ℹ️  .env already exists" -ForegroundColor Blue
}

# Run migrations
Write-Host "📊 Running database migrations..." -ForegroundColor Yellow
alembic upgrade head
Write-Host "✅ Migrations complete" -ForegroundColor Green

Set-Location ..

Write-Host ""
Write-Host "⚛️  Setting up Frontend..." -ForegroundColor Yellow

Set-Location frontend

# Install dependencies
npm install --silent
Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green

# Create .env
if (!(Test-Path ".env")) {
    @"
VITE_API_URL=http://localhost:8000/v1
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
"@ | Out-File -FilePath .env -Encoding utf8
    Write-Host "✅ Frontend .env created" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Frontend .env already exists" -ForegroundColor Blue
}

Set-Location ..

Write-Host ""
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Configure Stripe keys in backend/.env"
Write-Host "2. Start backend:" -ForegroundColor Yellow
Write-Host "   cd backend"
Write-Host "   .\venv\Scripts\Activate.ps1"
Write-Host "   uvicorn app.main:app --reload"
Write-Host ""
Write-Host "3. Start frontend (new terminal):" -ForegroundColor Yellow
Write-Host "   cd frontend"
Write-Host "   npm run dev"
Write-Host ""
Write-Host "4. Open http://localhost:5173"
Write-Host ""
Write-Host "📚 See QUICK_START.md for detailed instructions" -ForegroundColor Cyan
