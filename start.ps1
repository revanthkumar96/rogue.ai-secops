# Rouge.ai - The Fairy Tail
# Windows PowerShell startup script

Write-Host "✨ Starting Rouge.ai - The Fairy Tail ✨" -ForegroundColor Magenta
Write-Host ""

# Check if bun is installed
if (-not (Get-Command bun -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Bun is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "   https://bun.sh/install" -ForegroundColor Yellow
    exit 1
}

# Check if Ollama is running
Write-Host "🔍 Checking Ollama..." -ForegroundColor Blue
try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -TimeoutSec 2 -ErrorAction SilentlyContinue
} catch {
    Write-Host "⚠️  Ollama is not running. Please start it with:" -ForegroundColor Yellow
    Write-Host "   ollama serve" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Continuing anyway..." -ForegroundColor Yellow
}

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Blue
    bun install
}

# Start backend server
Write-Host "🚀 Starting API Server (port 3000)..." -ForegroundColor Green
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    Set-Location packages/rouge
    bun run dev serve --port 3000
}

# Wait for backend to be ready
Write-Host "⏳ Waiting for API to be ready..." -ForegroundColor Blue
$retries = 0
$maxRetries = 30
while ($retries -lt $maxRetries) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -TimeoutSec 1 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ API Server is ready!" -ForegroundColor Green
            break
        }
    } catch {
        # Ignore errors
    }
    Start-Sleep -Seconds 1
    $retries++
}

if ($retries -eq $maxRetries) {
    Write-Host "❌ API Server failed to start" -ForegroundColor Red
    Stop-Job -Job $backendJob
    Remove-Job -Job $backendJob
    exit 1
}

# Start frontend dev server
Write-Host "🎨 Starting Web UI (port 3001)..." -ForegroundColor Magenta
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    Set-Location packages/web
    bun run dev --port 3001
}

# Wait a bit for frontend to start
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor Green
Write-Host "✨ Rouge.ai - The Fairy Tail is READY! ✨" -ForegroundColor Magenta
Write-Host "════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "📡 API Server:  " -NoNewline -ForegroundColor Blue
Write-Host "http://localhost:3000"
Write-Host "🌐 Web UI:      " -NoNewline -ForegroundColor Magenta
Write-Host "http://localhost:3001"
Write-Host ""
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow
Write-Host ""

# Wait and handle Ctrl+C
try {
    while ($true) {
        Start-Sleep -Seconds 1

        # Check if jobs are still running
        if ((Get-Job -Id $backendJob.Id).State -eq "Failed") {
            Write-Host "❌ Backend server stopped unexpectedly" -ForegroundColor Red
            break
        }
        if ((Get-Job -Id $frontendJob.Id).State -eq "Failed") {
            Write-Host "❌ Frontend server stopped unexpectedly" -ForegroundColor Red
            break
        }
    }
} finally {
    Write-Host ""
    Write-Host "🛑 Shutting down Rouge.ai..." -ForegroundColor Blue
    Stop-Job -Job $backendJob -ErrorAction SilentlyContinue
    Stop-Job -Job $frontendJob -ErrorAction SilentlyContinue
    Remove-Job -Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job -Job $frontendJob -ErrorAction SilentlyContinue
}
