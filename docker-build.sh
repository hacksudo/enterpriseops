#!/usr/bin/env bash
set -e

# ==============================================================================
# EnterpriseOps — Docker Build Script
# ==============================================================================

IMAGE_NAME="enterpriseops:latest"

echo "===================================================================="
echo " Building Docker Image: ${IMAGE_NAME}"
echo "===================================================================="

cd "$(dirname "$0")"

docker build -t "${IMAGE_NAME}" -f Dockerfile .

echo ""
echo "[✓] Docker Image '${IMAGE_NAME}' successfully built!"
echo ""
echo "To run this image:"
echo "  ./docker-run.sh"
echo "  OR: docker run -d -p 3000:3000 -p 8000:8000 --name enterpriseops enterpriseops:latest"
echo "===================================================================="

