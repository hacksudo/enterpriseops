# EnterpriseOps — System Architecture

## 1. High-Level Modular Monolith Architecture
EnterpriseOps utilizes a high-performance **modular monolith architecture** running in Docker containers. This provides clean domain boundaries and strong typing without the complexity and latency of premature microservices.

```mermaid
flowchart TB
    subgraph Client["Client Tier (Liquid Glass UI)"]
        Browser["Desktop & Mobile Browsers"]
        NextApp["Next.js 15 App Router\n(React 19, Tailwind CSS, Lucide, Recharts)"]
        Browser --> NextApp
    end

    subgraph ReverseProxy["Edge / Reverse Proxy Tier"]
        Nginx["Nginx Reverse Proxy / SSL Termination\n(Rate Limiting, Security Headers, Static Caching)"]
        NextApp -->|HTTPS / WSS| Nginx
    end

    subgraph BackendTier["Application Tier (Modular Monolith)"]
        FastAPI["FastAPI 0.115+ (Python 3.12+)\nAsync Core, Pydantic v2, OpenAPI"]
        Nginx -->|/api/v1, /ws| FastAPI
        
        subgraph Modules["Domain Modules"]
            AuthMod["auth & rbac"]
            OrgMod["organizations & departments"]
            TaskMod["tasks & scheduling"]
            WorklogMod["worklogs & checkins"]
            VaptMod["vapt & cvss engine"]
            FilesMod["evidence & files"]
            CollabMod["chat & handoffs"]
            ReportMod["reports & exports"]
            AuditMod["audit logs"]
        end
        FastAPI --- Modules
    end

    subgraph AsyncTier["Async & Background Processing"]
        CeleryWorker["Celery Worker\n(Report Generation, Malware Scan, Safe Previews)"]
        CeleryBeat["Celery Beat\n(Recurring Task Generator, SLA Alerts)"]
        FastAPI -->|Tasks| Redis
        Redis --> CeleryWorker
        CeleryBeat --> Redis
    end

    subgraph DataTier["Data & Storage Tier"]
        Postgres[(PostgreSQL 16\nRelational Data & Strict FKs)]
        Redis[(Redis 7\nCache, Queue, Presence & Pub/Sub)]
        MinIO[(MinIO S3 Private Object Storage\nPOCs, Evidence, Generated Reports)]
        
        FastAPI --> Postgres
        FastAPI --> Redis
        FastAPI --> MinIO
        CeleryWorker --> Postgres
        CeleryWorker --> MinIO
    end
```

---

## 2. Request & Authorization Flow
1. **Edge Filter**: Nginx verifies request limits, terminates TLS, sets CSP/HSTS/X-Frame-Options headers, and routes `/api/v1/*` and `/ws/*` to FastAPI, and all other routes to Next.js.
2. **Auth & Session**: FastAPI middleware validates HTTP-only secure JWT cookies or API bearer tokens with Argon2id-hashed credentials stored in PostgreSQL.
3. **Scoped RBAC Guard**: Every API operation inspects the target resource against the actor's permissions within the target Organization, Department, and Workspace scope (`check_permission(user, resource, action, scope)`).
4. **Data Isolation**: SQLAlchemy queries strictly enforce `WHERE organization_id = :org_id AND (department_id = :dept_id OR is_cross_department_authorized)`.
5. **Real-Time Dispatch**: Significant security events (High/Critical VAPT findings, alerts, mentions, chat) emit via Redis Pub/Sub directly to authenticated WebSockets.
