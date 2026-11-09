#!/usr/bin/env bash
set -e

# ==============================================================================
# EnterpriseOps — Docker Run Script
# ==============================================================================

IMAGE_NAME="enterpriseops:latest"
CONTAINER_NAME="enterpriseops-app"

HOST_FRONTEND_PORT="${1:-${PORT:-3001}}"
HOST_BACKEND_PORT="${2:-${BACKEND_PORT:-8001}}"

cd "$(dirname "$0")"

# Stop existing container if running
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "[!] Removing existing container '${CONTAINER_NAME}'..."
  docker rm -f "${CONTAINER_NAME}" >/dev/null 2>&1 || true
fi

echo "===================================================================="
echo " Launching EnterpriseOps Container: ${CONTAINER_NAME}"
echo " Ports: Frontend -> ${HOST_FRONTEND_PORT} | Backend -> ${HOST_BACKEND_PORT}"
echo "===================================================================="

docker run -d \
  --name "${CONTAINER_NAME}" \
  -p "${HOST_FRONTEND_PORT}:3000" \
  -p "${HOST_BACKEND_PORT}:8000" \
  --restart unless-stopped \
  "${IMAGE_NAME}"

echo ""
echo "[✓] EnterpriseOps container is starting up!"
echo ""
echo "Access URLs:"
echo " - Web UI (Liquid Glass): http://localhost:${HOST_FRONTEND_PORT}"
echo " - Backend API & Docs:    http://localhost:${HOST_BACKEND_PORT}/docs"
echo " - Health Status:         http://localhost:${HOST_BACKEND_PORT}/healthz"
echo ""
echo "View container logs:  docker logs -f ${CONTAINER_NAME}"
echo "Stop container:       docker stop ${CONTAINER_NAME}"
echo "===================================================================="

