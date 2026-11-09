#!/usr/bin/env bash
set -e

# ==============================================================================
# EnterpriseOps — All-in-One Automated Docker TAR Loader & Launcher
# ==============================================================================
# 1. Starts Colima / Docker daemon automatically if not running
# 2. Cleans up any existing conflicting containers
# 3. Loads enterpriseops_image.tar
# 4. Starts the container on ports 3000 & 8000
# 5. Displays live access URLs and login credentials
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONTAINER_NAME="enterpriseops"
IMAGE_NAME="enterpriseops:latest"
FRONTEND_PORT="${1:-3000}"
BACKEND_PORT="${2:-8000}"

echo "===================================================================="
echo " hacksudo EnterpriseOps — Automated Docker TAR Loader"
echo "===================================================================="

# ------------------------------------------------------------------------------
# 1. Locate the TAR file
# ------------------------------------------------------------------------------
TAR_PATH=""
SEARCH_PATHS=(
  "$1"
  "${SCRIPT_DIR}/enterpriseops_image.tar"
  "${SCRIPT_DIR}/enterpriseops/enterpriseops_image.tar"
  "${SCRIPT_DIR}/EnterpriseOps released/enterpriseops_image.tar"
  "${SCRIPT_DIR}/../enterpriseops/enterpriseops_image.tar"
  "${SCRIPT_DIR}/../EnterpriseOps released/enterpriseops_image.tar"
)

for p in "${SEARCH_PATHS[@]}"; do
  if [ -n "$p" ] && [ -f "$p" ]; then
    TAR_PATH="$p"
    break
  fi
done

if [ -z "$TAR_PATH" ]; then
  echo "[!] enterpriseops_image.tar not found in standard paths."
  echo "    Searching current directory and subdirectories..."
  FOUND=$(find "${SCRIPT_DIR}" -name "enterpriseops_image.tar" | head -n 1)
  if [ -n "$FOUND" ]; then
    TAR_PATH="$FOUND"
  fi
fi

if [ -z "$TAR_PATH" ]; then
  echo "[ERROR] Could not find 'enterpriseops_image.tar'."
  echo "Please place enterpriseops_image.tar in this directory or run with:"
  echo "  ./run-tar.sh /path/to/enterpriseops_image.tar"
  exit 1
fi

echo "[*] Found Docker TAR archive: ${TAR_PATH} ($(du -h "$TAR_PATH" | cut -f1))"

# ------------------------------------------------------------------------------
# 2. Check & Auto-Start Docker / Colima
# ------------------------------------------------------------------------------
# Ensure Colima socket is recognized if Colima is used
if [ -z "$DOCKER_HOST" ] && [ -S "${HOME}/.colima/default/docker.sock" ]; then
  export DOCKER_HOST="unix://${HOME}/.colima/default/docker.sock"
fi

if ! docker info >/dev/null 2>&1; then
  echo "[*] Docker daemon is not running. Attempting to start Docker automatically..."
  
  if command -v colima >/dev/null 2>&1; then
    echo "[*] Found Colima. Starting Colima Docker VM..."
    colima start || colima restart || true
    export DOCKER_HOST="unix://${HOME}/.colima/default/docker.sock"
  elif [ -d "/Applications/Docker.app" ]; then
    echo "[*] Found Docker Desktop. Launching Docker Desktop..."
    open -a Docker
  else
    echo "[ERROR] Neither Colima nor Docker Desktop could be started automatically."
    echo "Please install Docker via Homebrew: brew install colima docker && colima start"
    exit 1
  fi

  # Wait for Docker to become ready
  echo "[*] Waiting for Docker daemon to become responsive..."
  READY=0
  for i in $(seq 1 45); do
    if docker info >/dev/null 2>&1; then
      READY=1
      echo "[✓] Docker daemon is online and responsive!"
      break
    fi
    sleep 1
  done

  if [ "$READY" -eq 0 ]; then
    echo "[ERROR] Docker did not become ready within 45 seconds."
    exit 1
  fi
else
  echo "[✓] Docker daemon is already online."
fi

# ------------------------------------------------------------------------------
# 3. Clean up any existing container with the same name
# ------------------------------------------------------------------------------
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "[*] Found existing '${CONTAINER_NAME}' container. Removing it..."
  docker rm -f "${CONTAINER_NAME}" >/dev/null 2>&1 || true
fi

# Clean up port conflicts on host
for P in "$FRONTEND_PORT" "$BACKEND_PORT"; do
  PIDS=$(lsof -ti :${P} 2>/dev/null || true)
  if [ -n "$PIDS" ]; then
    echo "[*] Freeing host port ${P}..."
    kill -9 $PIDS 2>/dev/null || true
  fi
done

# ------------------------------------------------------------------------------
# 4. Load the Image from TAR
# ------------------------------------------------------------------------------
echo "[*] Loading image from ${TAR_PATH} into Docker..."
docker load -i "${TAR_PATH}"

# ------------------------------------------------------------------------------
# 5. Run the Container
# ------------------------------------------------------------------------------
echo "[*] Launching EnterpriseOps container '${CONTAINER_NAME}'..."
docker run -d \
  --name "${CONTAINER_NAME}" \
  -p "${FRONTEND_PORT}:3000" \
  -p "${BACKEND_PORT}:8000" \
  --restart unless-stopped \
  "${IMAGE_NAME}"

# ------------------------------------------------------------------------------
# 6. Wait for Readiness & Display Links
# ------------------------------------------------------------------------------
echo "[*] Waiting for services to initialize inside container..."
for i in $(seq 1 30); do
  if curl -s "http://127.0.0.1:${BACKEND_PORT}/healthz" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo ""
echo "===================================================================="
echo " [✓] hacksudo EnterpriseOps is LIVE!"
echo "===================================================================="
echo " - Web UI (Liquid Glass): http://localhost:${FRONTEND_PORT}"
echo " - Swagger OpenAPI Docs:  http://localhost:${BACKEND_PORT}/docs"
echo " - Backend Health Check:  http://localhost:${BACKEND_PORT}/healthz"
echo ""
echo " Default Login Credentials:"
echo "  • Super Admin: superadmin@enterpriseops.internal / AdminP@ssw0rd2026!Secure"
echo "  • PMO Lead:    pmo@enterpriseops.internal / DemoP@ssw0rd2026!"
echo "  • VAPT Tester: tester@enterpriseops.internal / DemoP@ssw0rd2026!"
echo "  • Developer:   dev@enterpriseops.internal / DemoP@ssw0rd2026!"
echo ""
echo " Container Commands:"
echo "  • Live logs: docker logs -f ${CONTAINER_NAME}"
echo "  • Stop:      docker stop ${CONTAINER_NAME}"
echo "===================================================================="
