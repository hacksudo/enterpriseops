#!/usr/bin/env bash
set -e

# ==============================================================================
# EnterpriseOps — Export Docker Image to TAR File
# ==============================================================================

IMAGE_NAME="enterpriseops:latest"
OUTPUT_TAR="enterpriseops_image.tar"
OUTPUT_GZ="enterpriseops_image.tar.gz"

cd "$(dirname "$0")"

echo "===================================================================="
echo " EnterpriseOps — Docker Image TAR Export"
echo "===================================================================="

# Check if Docker daemon is running
if ! docker info >/dev/null 2>&1; then
  echo "[ERROR] Docker daemon is not responding."
  echo "If using Colima on macOS, start it first with:"
  echo "  colima start"
  exit 1
fi

# Check if image exists; if not, build it first
if ! docker images --format '{{.Repository}}:{{.Tag}}' | grep -q "^${IMAGE_NAME}$"; then
  echo "[*] Image '${IMAGE_NAME}' not found locally. Building image now..."
  docker build -t "${IMAGE_NAME}" -f Dockerfile .
fi

echo "[*] Saving Docker image '${IMAGE_NAME}' to ${OUTPUT_TAR}..."
docker save -o "${OUTPUT_TAR}" "${IMAGE_NAME}"

echo "[*] Compressing ${OUTPUT_TAR} into ${OUTPUT_GZ} (gzip)..."
gzip -c "${OUTPUT_TAR}" > "${OUTPUT_GZ}"

TAR_SIZE=$(du -h "${OUTPUT_TAR}" | cut -f1)
GZ_SIZE=$(du -h "${OUTPUT_GZ}" | cut -f1)

echo ""
echo "===================================================================="
echo " [✓] Export completed successfully!"
echo "===================================================================="
echo " Raw TAR archive:         ${OUTPUT_TAR} (${TAR_SIZE})"
echo " Compressed TAR archive:  ${OUTPUT_GZ} (${GZ_SIZE})"
echo ""
echo " How to use on any machine with Docker:"
echo " 1. Transfer '${OUTPUT_TAR}' or '${OUTPUT_GZ}' to the target machine"
echo " 2. Load the image:"
echo "      docker load -i ${OUTPUT_TAR}"
echo "      # or: docker load < ${OUTPUT_GZ}"
echo " 3. Run the container:"
echo "      docker run -d -p 3000:3000 -p 8000:8000 --name enterpriseops ${IMAGE_NAME}"
echo "===================================================================="

