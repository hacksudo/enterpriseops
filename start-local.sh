#!/usr/bin/env bash
set -e

# ==============================================================================
# EnterpriseOps — Local Runner (Without Docker)
# Starts FastAPI Monolith (Port 8000) & Next.js Liquid Glass UI (Port 3000)
# ==============================================================================

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="${ROOT_DIR}/apps/backend"
FRONTEND_DIR="${ROOT_DIR}/apps/frontend"
VENV_DIR="${ROOT_DIR}/venv"

FRONTEND_PORT="${1:-${PORT:-3001}}"
BACKEND_PORT="${2:-${BACKEND_PORT:-8001}}"

echo "===================================================================="
echo " Starting hacksudo EnterpriseOps Locally (Without Docker)"
echo " Ports: Frontend -> ${FRONTEND_PORT} | Backend -> ${BACKEND_PORT}"
echo "===================================================================="

# 1. Check Python
if ! command -v python3 >/dev/null 2>&1; then
  echo "[ERROR] Python 3 is required but not found on your PATH."
  exit 1
fi

# 2. Check Node & npm
if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "[ERROR] Node.js and npm are required for the frontend."
  exit 1
fi

# 3. Setup Virtual Environment
if [ ! -d "${VENV_DIR}" ]; then
  echo "[*] Creating Python virtual environment in ${VENV_DIR}..."
  python3 -m venv "${VENV_DIR}"
  echo "[*] Installing backend dependencies..."
  "${VENV_DIR}/bin/pip" install --upgrade pip
  "${VENV_DIR}/bin/pip" install -r "${BACKEND_DIR}/requirements.txt"
fi

PYTHON_EXEC="${VENV_DIR}/bin/python"
UVICORN_EXEC="${VENV_DIR}/bin/uvicorn"

# 4. Check Frontend node_modules
if [ ! -d "${FRONTEND_DIR}/node_modules" ]; then
  echo "[*] Installing frontend dependencies..."
  (cd "${FRONTEND_DIR}" && npm install)
fi

# 5. Ensure SQLite Database is in place
if [ ! -f "${BACKEND_DIR}/enterpriseops.db" ]; then
  if [ -f "${ROOT_DIR}/enterpriseops.db" ]; then
    echo "[*] Syncing pre-seeded SQLite database..."
    cp "${ROOT_DIR}/enterpriseops.db" "${BACKEND_DIR}/enterpriseops.db"
  fi
fi

# 6. Check for conflicting ports
for CHECK_PORT in "${BACKEND_PORT}" "${FRONTEND_PORT}"; do
  PID=$(lsof -ti :${CHECK_PORT} 2>/dev/null || true)
  if [ -n "$PID" ]; then
    echo "[!] Port ${CHECK_PORT} is currently in use by process PID ${PID}."
    echo "[!] Attempting to terminate PID ${PID}..."
    kill -9 $PID 2>/dev/null || true
    sleep 1
  fi
done

# Clean shutdown handler
cleanup() {
  echo ""
  echo "[!] Shutting down EnterpriseOps local servers..."
  kill -TERM "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
  wait "$BACKEND_PID" 2>/dev/null || true
  wait "$FRONTEND_PID" 2>/dev/null || true
  echo "[✓] Servers stopped cleanly."
  exit 0
}
trap cleanup SIGINT SIGTERM

# 7. Start FastAPI Backend
echo "[1/2] Starting FastAPI backend on http://0.0.0.0:${BACKEND_PORT} ..."
cd "${BACKEND_DIR}"
"${UVICORN_EXEC}" app.main:app --host 0.0.0.0 --port "${BACKEND_PORT}" &
BACKEND_PID=$!

# Wait for backend readiness
echo "[*] Waiting for backend readiness..."
for i in $(seq 1 30); do
  if curl -s "http://127.0.0.1:${BACKEND_PORT}/healthz" >/dev/null 2>&1; then
    echo "[✓] Backend is ready."
    break
  fi
  sleep 1
done

# 8. Start Next.js Frontend
echo "[2/2] Starting Next.js frontend on http://localhost:${FRONTEND_PORT} ..."
cd "${FRONTEND_DIR}"
npm run dev -- -p "${FRONTEND_PORT}" &
FRONTEND_PID=$!

echo ""
echo "===================================================================="
echo " EnterpriseOps is running successfully!"
echo "===================================================================="
echo " - Web UI:       http://localhost:${FRONTEND_PORT}"
echo " - Backend API:  http://127.0.0.1:${BACKEND_PORT}"
echo " - Swagger Docs: http://127.0.0.1:${BACKEND_PORT}/docs"
echo ""
echo " Login Credentials (Demo Accounts):"
echo "  • Super Admin: superadmin@enterpriseops.internal / AdminP@ssw0rd2026!Secure"
echo "  • Security PMO: pmo@enterpriseops.internal / DemoP@ssw0rd2026!"
echo "  • VAPT Tester:  tester@enterpriseops.internal / DemoP@ssw0rd2026!"
echo "  • Developer:    dev@enterpriseops.internal / DemoP@ssw0rd2026!"
echo ""
echo " [Press Ctrl+C to stop all servers]"
echo "===================================================================="

wait -n "$BACKEND_PID" "$FRONTEND_PID"
cleanup

