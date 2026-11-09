# EnterpriseOps — Docker Deployment & Operations Guide

## 1. Architecture Overview
EnterpriseOps deploys via `compose.yaml` with 8 coordinated services:
- **`postgres`**: Relational database with automated health checks (`pg_isready`) and volume persistence.
- **`redis`**: In-memory caching, message queues, and ephemeral WebSocket pub/sub.
- **`minio`**: S3 private object storage for encrypted POC files and evidence attachments.
- **`backend`**: FastAPI application server with async connection pooling.
- **`worker`**: Celery worker for report generation, safe document conversion, and notification dispatch.
- **`scheduler`**: Celery Beat for recurring tasks and SLA monitoring.
- **`frontend`**: Next.js 14.2 Liquid Glass UI server.
- **`reverse-proxy`**: Nginx with SSL termination, CSP security headers, and WebSocket routing.

---

## 2. Production Deployment Steps

### Step 1: Initialize Environment Secrets
```bash
cp .env.example .env
# Edit .env and supply cryptographically random secrets for APP_SECRET_KEY, POSTGRES_PASSWORD, and MINIO_SECRET_KEY
```

### Step 2: Build and Launch Containers
```bash
docker-compose up -d --build
```

### Step 3: Verify Container Health
```bash
docker-compose ps
```
Ensure `postgres`, `redis`, and `backend` report `healthy` or `running`.

### Step 4: First-Run Bootstrap
```bash
docker-compose exec backend python -m app.cli bootstrap-admin
```

### Step 5: (Optional) Seed Synthetic Demonstration Data
```bash
docker-compose exec backend python -m app.cli seed
```

---

## 3. Backup and Recovery Procedures

### PostgreSQL Database Backup
```bash
docker-compose exec -T postgres pg_dump -U enterpriseops_user enterpriseops > backup_$(date +%Y%m%d_%H%M%S).sql
```

### PostgreSQL Database Restore
```bash
cat backup_file.sql | docker-compose exec -T postgres psql -U enterpriseops_user -d enterpriseops
```

### MinIO Evidence Object Storage Backup
```bash
docker run --rm --network enterpriseops_enterpriseops-network \
  -v enterpriseops_minio_data:/data:ro \
  -v $(pwd)/backups:/backup \
  alpine tar -czf /backup/minio_evidence_$(date +%Y%m%d).tar.gz /data
```
