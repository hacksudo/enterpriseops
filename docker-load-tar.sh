#!/usr/bin/env bash
set -e

# ==============================================================================
# EnterpriseOps — Load & Run Docker Image from TAR File
# ==============================================================================

TAR_FILE="${1:-enterpriseops_image.tar}"
IMAGE_NAME="enterpriseops:latest"
CONTAINER_NAME="enterpriseops-app"

cd "$(dirname "$0")"

echo "===================================================================="
echo " EnterpriseOps — Load Docker Image"
echo "===================================================================="

if [ -f "${TAR_FILE}.gz" ] && [ ! -f "${TAR_FILE}" ]; then
  TAR_FILE="${TAR_FILE}.gz"
fi

if [ ! -f "${TAR_FILE}" ]; then
  echo "[ERROR] TAR file '${TAR_FILE}' not found."
  echo "Usage: ./docker-load-tar.sh [path/to/enterpriseops_image.tar]"
  exit 1
fi

echo "[*] Loading Docker image from ${TAR_FILE}..."
if [[ "${TAR_FILE}" == *.gz ]]; then
  docker load < "${TAR_FILE}"
else
  docker load -i "${TAR_FILE}"
fi

echo "[*] Removing any existing '${CONTAINER_NAME}' container..."
docker rm -f "${CONTAINER_NAME}" 2>/dev/null || true

echo "[*] Starting EnterpriseOps container..."
docker run -d \
  --name "${CONTAINER_NAME}" \
  -p 3000:3000 \
  -p 8000:8000 \
  --restart unless-stopped \
  "${IMAGE_NAME}"

echo ""
echo "===================================================================="
echo " [✓] EnterpriseOps is running!"
echo " - Web UI:       http://localhost:3000"
echo " - Backend API:  http://localhost:8000"
echo " - Swagger Docs: http://localhost:8000/docs"
echo "===================================================================="

