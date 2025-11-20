#!/usr/bin/env bash
set -e

########################################
# Configuration
########################################

# Frontend dev server URL (change if your dev server uses another port)
FRONTEND_URL="http://localhost:5173"

########################################
# Helpers
########################################

PROJECT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$PROJECT_ROOT"

BACKEND_PID=""
BROWSER_OPENED=0
PYTHON_CMD=""

cleanup() {
  # Stop backend if still running
  if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo "Stopping backend (PID $BACKEND_PID)..."
    kill "$BACKEND_PID" 2>/dev/null || true
  fi

  echo
  echo "🔗 If your browser didn't open automatically, you can access the app at:"
  echo "   $FRONTEND_URL"
}

trap cleanup EXIT

detect_python() {
  if command -v python3.10 >/dev/null 2>&1; then
    PYTHON_CMD="python3.10"
  elif command -v python3 >/dev/null 2>&1; then
    PYTHON_CMD="python3"
  elif command -v python >/dev/null 2>&1; then
    PYTHON_CMD="python"
  else
    echo "Could not find python3.10, python3, or python on PATH."
    exit 1
  fi
}

open_browser() {
  # macOS
  if command -v open >/dev/null 2>&1; then
    open "$FRONTEND_URL" >/dev/null 2>&1 && return 0
  fi

  # Linux
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$FRONTEND_URL" >/dev/null 2>&1 && return 0
  fi

  # Windows Git Bash/MSYS/WSL fallback
  if command -v cmd.exe >/dev/null 2>&1; then
    cmd.exe /c start "$FRONTEND_URL" >/dev/null 2>&1 && return 0
  fi

  return 1
}

########################################
# Python venv + backend
########################################

echo "Detecting Python executable..."
detect_python
echo "Using Python: $PYTHON_CMD"
echo

echo "📦 Setting up Python virtual environment..."

if [ ! -d ".venv" ]; then
  echo "➡️  Creating .venv in project root..."
  "$PYTHON_CMD" -m venv .venv
fi

# Activate venv
# shellcheck source=/dev/null
source .venv/bin/activate

echo "Installing backend dependencies..."
pip install -r backend/requirements.txt

echo "Starting backend (uvicorn on port 8000)..."
(
  cd backend
  python -m uvicorn app.main:app --reload --port 8000
) &
BACKEND_PID=$!
echo "Backend started with PID $BACKEND_PID"
echo

########################################
# Frontend
########################################

echo "Setting up frontend..."
cd "$PROJECT_ROOT/frontend"

if [ ! -d "node_modules" ]; then
  echo "node_modules not found. Running npm install..."
  npm install
else
  echo "node_modules already present, skipping npm install."
fi

echo
echo "Attempting to open $FRONTEND_URL in your browser..."
if open_browser; then
  BROWSER_OPENED=1
  echo "Browser open command dispatched."
else
  echo "Could not automatically open the browser."
  echo "   Once the frontend dev server is running, open this link manually:"
  echo "   $FRONTEND_URL"
fi

echo
echo "Starting frontend dev server (npm run dev)..."
# This runs in the foreground; Ctrl+C will stop it and trigger cleanup
npm run dev
