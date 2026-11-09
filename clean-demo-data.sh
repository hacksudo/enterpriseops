#!/usr/bin/env bash
# ==============================================================================
# EnterpriseOps 1-Click Clean Slate & Client Handover Tool
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${SCRIPT_DIR}/apps/backend"
VENV_PYTHON="${SCRIPT_DIR}/venv/bin/python3"

if [ ! -f "${VENV_PYTHON}" ]; then
  VENV_PYTHON="python3"
fi

echo "===================================================================="
echo " EnterpriseOps - Client Handover / Clean Slate Tool"
echo "===================================================================="
echo "[!] This will permanently purge all demo findings, tasks, and test data."
echo "[!] Preserves root organization, departments, and administrator account."
echo ""

cd "${BACKEND_DIR}"
"${VENV_PYTHON}" -m app.cli clean

echo ""
echo "[✓] Clean slate completed! All demo data has been purged."
echo "===================================================================="
