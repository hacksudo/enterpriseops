#!/usr/bin/env bash
set -e

# Version backup script adhering to EnterpriseOps versioning rule
VERSION=${1:-"v1.0.0"}
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

SOURCE_BACKUP_DIR="${ROOT_DIR}/EnterpriseOps source code"
RELEASE_DIR="${ROOT_DIR}/EnterpriseOps released"

mkdir -p "${SOURCE_BACKUP_DIR}" "${RELEASE_DIR}"

echo "Creating source code backup for ${VERSION}..."
zip -r "${SOURCE_BACKUP_DIR}/EnterpriseOps_source_${VERSION}.zip" "${ROOT_DIR}/enterpriseops" \
    -x "*/node_modules/*" -x "*/.next/*" -x "*/venv/*" -x "*/__pycache__/*" -x "*/.git/*"

echo "Creating release distribution package for ${VERSION}..."
zip -r "${RELEASE_DIR}/EnterpriseOps_release_${VERSION}.zip" "${ROOT_DIR}/enterpriseops" \
    -x "*/venv/*" -x "*/.next/*" -x "*/__pycache__/*" -x "*/tests/*" -x "*/node_modules/*"

echo "Backup ${VERSION} successfully created in:"
echo "  - ${SOURCE_BACKUP_DIR}/EnterpriseOps_source_${VERSION}.zip"
echo "  - ${RELEASE_DIR}/EnterpriseOps_release_${VERSION}.zip"
