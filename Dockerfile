# ==============================================================================
# hacksudo EnterpriseOps — Unified Production Dockerfile
# Combines Next.js Liquid Glass UI + FastAPI Monolith + Seeded SQLite Database
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build the Next.js Frontend
# ------------------------------------------------------------------------------
FROM node:20-alpine AS frontend-builder

WORKDIR /app/apps/frontend

COPY apps/frontend/package*.json ./
RUN npm ci || npm install

COPY apps/frontend ./
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Final Production Runner (Python 3.12 + Node.js 20 runtime)
# ------------------------------------------------------------------------------
FROM python:3.12-slim AS runner

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

# Install Node.js v20, npm, curl, and sqlite3
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    gnupg \
    sqlite3 \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" > /etc/apt/sources.list.d/nodesource.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Python backend dependencies
COPY apps/backend/requirements.txt ./apps/backend/
RUN pip install --upgrade pip && pip install -r ./apps/backend/requirements.txt

# Copy Backend Application code
COPY apps/backend ./apps/backend

# Copy Next.js production build and runtime assets from builder stage
COPY --from=frontend-builder /app/apps/frontend/package*.json ./apps/frontend/
COPY --from=frontend-builder /app/apps/frontend/node_modules ./apps/frontend/node_modules
COPY --from=frontend-builder /app/apps/frontend/.next ./apps/frontend/.next
COPY --from=frontend-builder /app/apps/frontend/public ./apps/frontend/public
COPY --from=frontend-builder /app/apps/frontend/next.config.mjs ./apps/frontend/

# Copy Pre-seeded SQLite Database and Environment Configuration
COPY enterpriseops.db ./enterpriseops.db
COPY enterpriseops.db ./apps/backend/enterpriseops.db
COPY .env.example ./.env

# Copy Entrypoint Script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Expose Frontend UI (3000, 3001) and Backend REST API & OpenAPI Docs (8000, 8001)
EXPOSE 3000 3001 8000 8001

# Container Healthcheck
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -f http://127.0.0.1:8000/healthz && curl -f http://127.0.0.1:3000 || exit 1

ENTRYPOINT ["/app/docker-entrypoint.sh"]

