#!/usr/bin/env bash
# ==============================================================================
# EnterpriseOps — Stop Local Servers
# ==============================================================================

echo "Stopping any EnterpriseOps servers on ports 8000, 8001, 3000, and 3001..."

STOPPED=0
for PORT in 8000 8001 3000 3001; do
  PIDS=$(lsof -ti :${PORT} 2>/dev/null || true)
  if [ -n "$PIDS" ]; then
    for PID in $PIDS; do
      echo "[*] Killing process on port ${PORT} (PID ${PID})..."
      kill -9 "$PID" 2>/dev/null || true
      STOPPED=1
    done
  fi
done

if [ "$STOPPED" -eq 1 ]; then
  echo "[✓] EnterpriseOps local servers stopped."
else
  echo "[i] No EnterpriseOps servers were running on ports 8000 or 3000."
fi

