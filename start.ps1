# ProcureIQ — Safe Windows Startup Script
# Usage: powershell -ExecutionPolicy Bypass -File .\start.ps1

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "         ProcureIQ - Intelligent Procurement Platform     " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Determine Project Directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
if (Test-Path "$ScriptDir\procureiq\backend") {
    $BackendDir = "$ScriptDir\procureiq\backend"
    $FrontendDir = "$ScriptDir\procureiq\frontend"
} elseif (Test-Path "$ScriptDir\backend") {
    $BackendDir = "$ScriptDir\backend"
    $FrontendDir = "$ScriptDir\frontend"
} else {
    Write-Host "[ERROR] Could not locate ProcureIQ backend and frontend folders." -ForegroundColor Red
    exit 1
}

# 2. Check Node.js and npm
Write-Host "[1/4] Checking Node.js and npm..." -ForegroundColor Yellow
try {
    $nodeVersion = node -v
    $npmVersion = npm -v
    Write-Host "  -> Node.js version: $nodeVersion" -ForegroundColor Green
    Write-Host "  -> npm version:     $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js or npm is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# 3. Check MongoDB Availability
Write-Host "[2/4] Checking MongoDB configuration..." -ForegroundColor Yellow
$mongoLocalActive = $false
try {
    $tcp = Test-NetConnection -ComputerName 127.0.0.1 -Port 27017 -WarningAction SilentlyContinue
    if ($tcp.TcpTestSucceeded) {
        $mongoLocalActive = $true
        Write-Host "  -> Local MongoDB server detected on 127.0.0.1:27017." -ForegroundColor Green
    }
} catch {}

if (-not $mongoLocalActive) {
    Write-Host "  -> Note: Local MongoDB service is not running on port 27017." -ForegroundColor Cyan
    Write-Host "  -> The backend will automatically use its built-in in-memory database fallback." -ForegroundColor Cyan
    Write-Host "  -> Demo data will be automatically populated on startup." -ForegroundColor Cyan
}

# 4. Check Environment Files
Write-Host "[3/4] Verifying backend configuration..." -ForegroundColor Yellow
if (-not (Test-Path "$BackendDir\.env")) {
    if (Test-Path "$BackendDir\.env.example") {
        Write-Host "  -> Creating .env from .env.example..." -ForegroundColor Cyan
        Copy-Item "$BackendDir\.env.example" "$BackendDir\.env"
    } else {
        Write-Host "[ERROR] Missing backend configuration file (.env)." -ForegroundColor Red
        exit 1
    }
}
Write-Host "  -> Backend .env verified." -ForegroundColor Green

# 5. Launch Backend and Frontend in separate windows
Write-Host "[4/4] Starting ProcureIQ services..." -ForegroundColor Yellow

Write-Host "  -> Starting Backend on http://localhost:5000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$BackendDir'; Write-Host 'Starting ProcureIQ Backend...' -ForegroundColor Cyan; npm run start"

Start-Sleep -Seconds 2

Write-Host "  -> Starting Frontend on http://localhost:5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$FrontendDir'; Write-Host 'Starting ProcureIQ Frontend...' -ForegroundColor Cyan; npm run dev"

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "ProcureIQ launched successfully!" -ForegroundColor Green
Write-Host "  Frontend URL: http://localhost:5173" -ForegroundColor White
Write-Host "  Backend API:  http://localhost:5000" -ForegroundColor White
Write-Host ""
Write-Host "Demo Credentials (Password: Password@123):" -ForegroundColor White
Write-Host "  Requester: requester@procureiq.com" -ForegroundColor Gray
Write-Host "  Officer:   officer@procureiq.com" -ForegroundColor Gray
Write-Host "  Approver:  approver@procureiq.com" -ForegroundColor Gray
Write-Host "  Admin:     admin@procureiq.com" -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Green
