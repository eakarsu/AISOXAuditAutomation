#!/bin/bash

echo "============================================"
echo "  AI SOX Audit Automation - Starting Up"
echo "  [script version: FIXED-2026-06-26]"
echo "============================================"

# Load environment variables
set -a
source .env 2>/dev/null
set +a

BACKEND_PORT=${BACKEND_PORT:-3001}
FRONTEND_PORT=${FRONTEND_PORT:-3000}
DB_NAME=${DB_NAME:-sox_audit}
DB_USER=${DB_USER:-postgres}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

# Function to clean up on exit
cleanup() {
  echo ""
  echo "Shutting down..."
  kill $BACKEND_PID 2>/dev/null
  kill $FRONTEND_PID 2>/dev/null
  exit 0
}
trap cleanup SIGINT SIGTERM

# Kill processes on used ports
echo ""
echo "[1/6] Cleaning up ports $BACKEND_PORT and $FRONTEND_PORT..."
# Kill the nodemon/vite parents first — otherwise nodemon respawns its child
# and re-grabs the port right after we free it (EADDRINUSE on restart).
pkill -f "$(pwd)/server/node_modules/.bin/nodemon" 2>/dev/null
pkill -f "$(pwd)/client/node_modules/.bin/vite" 2>/dev/null
# Then free anything still bound to the ports.
lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null
lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null
sleep 1
# Verify the backend port is actually free before continuing.
if lsof -ti:$BACKEND_PORT >/dev/null 2>&1; then
  echo "  Port $BACKEND_PORT still busy, forcing kill..."
  lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null
  sleep 1
fi
echo "  Ports cleaned."

# Check PostgreSQL
echo ""
echo "[2/6] Checking PostgreSQL..."
if ! pg_isready -h $DB_HOST -p $DB_PORT > /dev/null 2>&1; then
  echo "  PostgreSQL is not running. Attempting to start..."
  brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null
  sleep 3
  if ! pg_isready -h $DB_HOST -p $DB_PORT > /dev/null 2>&1; then
    echo "  ERROR: Could not start PostgreSQL. Please start it manually."
    exit 1
  fi
fi
echo "  PostgreSQL is running."

# Create database if not exists
echo ""
echo "[3/6] Setting up database..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" 2>/dev/null | grep -q 1 || \
  createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME 2>/dev/null
echo "  Database '$DB_NAME' ready."

# Install dependencies
echo ""
echo "[4/6] Installing dependencies..."
cd server && npm install --silent 2>&1 | tail -1 && cd ..
cd client && npm install --silent 2>&1 | tail -1 && cd ..
echo "  Dependencies installed."

# Seed database
echo ""
echo "[5/6] Seeding database..."
cd server && node seed.js && cd ..

# Start servers with hot reload
echo ""
echo "[6/6] Starting servers..."
echo "  Backend:  http://localhost:$BACKEND_PORT (with nodemon hot reload)"
echo "  Frontend: http://localhost:$FRONTEND_PORT (with Vite HMR)"
echo ""
echo "============================================"
echo "  App is ready! Open http://localhost:$FRONTEND_PORT"
echo "  Login: admin@sox.local / admin123"
echo "============================================"
echo ""

# Start backend with nodemon (hot reload)
(cd server && npx nodemon index.js) &
BACKEND_PID=$!

# Start frontend with Vite (HMR)
(cd client && npx vite --port $FRONTEND_PORT) &
FRONTEND_PID=$!

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
