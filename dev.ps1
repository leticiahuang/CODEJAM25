# dev.ps1 - Windows PowerShell dev script
# Run with: powershell -ExecutionPolicy Bypass -File dev.ps1

$ErrorActionPreference = "Stop"

# Configuration
$FrontendUrl = "http://localhost:5173"

# Helpers
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $ProjectRoot

Write-Host "Setting up Python virtual environment..."


# Detect python
$pythonExe = $null
$pythonArgs = @()

foreach ($v in "3.11", "3.10") {
    try {
        # Check if py -3.x exists
        $versionOutput = & py "-$v" --version 2>&1
        if ($versionOutput -match "Python (\d+)\.(\d+)\.(\d+)") {
            $pythonExe = "py"
            $pythonArgs = @("-$v")
            break
        }
    } catch {
        continue
    }
}

if (-not $pythonExe) {
    Write-Host "Python 3.10 or 3.11 not found." -ForegroundColor Red
    exit 1
} else {
    Write-Host "Using Python executable: $pythonExe $($pythonArgs -join ' ')" -ForegroundColor Green
}

# Create virtual environment
$venvPath = ".venv"
& $pythonExe $pythonArgs -m venv $venvPath

if ($LASTEXITCODE -eq 0) {
    Write-Host "Virtual environment created at $venvPath" -ForegroundColor Green
} else {
    Write-Host "Failed to create virtual environment." -ForegroundColor Red
}

# Activate venv
$venvActivate = Join-Path ".venv" "Scripts\Activate.ps1"
if (-not (Test-Path $venvActivate)) {
    Write-Host "Could not find venv activate script at $venvActivate"
    exit 1
}
. $venvActivate

Write-Host "Installing backend dependencies..."
& pip install -r "backend\requirements.txt"

Write-Host "Starting backend (uvicorn on port 8000)..."
$backendScript = {
    param($ProjectRootInner)

    Set-Location (Join-Path $ProjectRootInner "backend")
    python -m uvicorn app.main:app --reload --port 8000
}

# Start backend as a background job
$backendJob = Start-Job -ScriptBlock $backendScript -ArgumentList $ProjectRoot
Write-Host "Backend started as Job Id:" $backendJob.Id
Write-Host ""

# Frontend
Write-Host "Setting up frontend..."
Set-Location (Join-Path $ProjectRoot "frontend")

if (-not (Test-Path "node_modules")) {
    Write-Host "node_modules not found. Running npm install..."
    & npm install
} else {
    Write-Host "node_modules already present, skipping npm install."
}

Write-Host ""
Write-Host "Attempting to open $FrontendUrl in your browser..."
try {
    Start-Process $FrontendUrl
    Write-Host "Browser open command dispatched."
} catch {
    Write-Host "Could not automatically open the browser."
    Write-Host "   Once the frontend dev server is running, open this link manually:"
    Write-Host "   $FrontendUrl"
}

Write-Host ""
Write-Host "Starting frontend dev server (npm run dev)..."
try {
    & npm run dev
} finally {
    # On exit, try to stop backend job
    if ($backendJob -and ($backendJob.State -eq "Running")) {
        Write-Host ""
        Write-Host "Stopping backend job Id:" $backendJob.Id
        Stop-Job $backendJob | Out-Null
        Remove-Job $backendJob | Out-Null
    }

    Write-Host ""
    Write-Host "If your browser didn't open automatically, you can access the app at:"
    Write-Host "   $FrontendUrl"
}
