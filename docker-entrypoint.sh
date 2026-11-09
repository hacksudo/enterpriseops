#!/usr/bin/env bash
set -e

# ==============================================================================
# EnterpriseOps Unified Docker Entrypoint
# ==============================================================================

echo "===================================================================="
echo " Starting hacksudo EnterpriseOps Management Platform"
echo "===================================================================="

# Ensure SQLite database exists in backend directory
if [ ! -f /app/apps/backend/enterpriseops.db ]; then
  if [ -f /app/enterpriseops.db ]; then
    echo "[*] Initializing SQLite database from pre-seeded data template..."
    cp /app/enterpriseops.db /app/apps/backend/enterpriseops.db
  fi
fi

# Ensure .env exists in backend if not provided
if [ ! -f /app/apps/backend/.env ]; then
  if [ -f /app/.env ]; then
    cp /app/.env /app/apps/backend/.env
  fi
fi

# If user provided a specific command (e.g. bash, backend, frontend)
if [ "$1" = "backend" ]; then
  echo "[*] Starting FastAPI Backend only..."
  cd /app/apps/backend
  exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
elif [ "$1" = "frontend" ]; then
  echo "[*] Starting Next.js Frontend only..."
  cd /app/apps/frontend
  exec npm start -- -p "${PORT:-3000}"
elif [ "$1" = "sh" ] || [ "$1" = "bash" ]; then
  exec "$@"
fi

# Default: Start both Backend and Frontend in unified container
cleanup() {
  echo ""
  echo "[!] Stopping EnterpriseOps services..."
  kill -TERM "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
  wait "$BACKEND_PID" 2>/dev/null || true
  wait "$FRONTEND_PID" 2>/dev/null || true
  echo "[✓] All EnterpriseOps services stopped."
  exit 0
}
trap cleanup SIGINT SIGTERM

# Default ports (can be overridden via environment variables)
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${PORT:-${FRONTEND_PORT:-3000}}"

echo "[1/2] Starting FastAPI Backend on http://0.0.0.0:${BACKEND_PORT} ..."
cd /app/apps/backend
uvicorn app.main:app --host 0.0.0.0 --port "${BACKEND_PORT}" &
BACKEND_PID=$!

echo "[*] Waiting for backend readiness..."
for i in $(seq 1 30); do
  if curl -s "http://127.0.0.1:${BACKEND_PORT}/healthz" >/dev/null 2>&1; then
    echo "[✓] Backend is ready and responding."
    break
  fi
  sleep 1
done

echo "[2/2] Starting Next.js Frontend on http://0.0.0.0:${FRONTEND_PORT} ..."
cd /app/apps/frontend
PORT="${FRONTEND_PORT}" npm start &
FRONTEND_PID=$!

echo "===================================================================="
echo " EnterpriseOps is ready to accept connections!"
echo " - Web UI:       http://localhost:${FRONTEND_PORT}"
echo " - Swagger Docs: http://localhost:${BACKEND_PORT}/docs"
echo " - Health Check: http://localhost:${BACKEND_PORT}/healthz"
echo "===================================================================="

# Monitor processes
wait -n "$BACKEND_PID" "$FRONTEND_PID"
cleanup

