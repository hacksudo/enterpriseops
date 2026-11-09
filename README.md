# EnterpriseOps — Enterprise IT Operations & Security Management Platform

[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](https://www.docker.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2+-black.svg)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)
[![CVSS v4.0](https://img.shields.io/badge/CVSS-v4.0%20%2F%20v3.1-critical.svg)](https://www.first.org/cvss/v4.0/)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)]()

> A complete, production-oriented, self-hosted, Docker-based Enterprise IT Workforce Management, Project Management, Vulnerability Management (VAPT), Reporting, and Team Collaboration Platform with an Apple-inspired **Liquid Glass UI design system**.

---

## 1. Key Platform Features

- **Consolidated Unified Platform**: Combines Jira (issue tracking, agile boards), ClickUp (workspaces, custom hierarchies), Microsoft Teams (department channels, real-time messaging), employee workday check-ins (attendance, work logs, time tracking), VAPT vulnerability reporting (CVSS v4.0 & v3.1 scoring, POC evidence management, remediation tracking), and real-time executive analytics.
- **Apple Liquid Glass UI**: Frosted translucent glass panels (`backdrop-filter: blur(20px)`), ambient gradient lighting, dark and light theme support, and responsive layouts.
- **Enterprise Tenancy & Scoped RBAC**: Multi-organization, multi-department (VAPT, Software Dev, QA, DevOps, SOC), and multi-workspace boundary isolation.
- **Workday Tracking**: Prominent "START WORK / I'M ON WORK" one-click check-in, active task timers, and daily structured work report generation.
- **Specification-Compliant CVSS Engine**: Full mathematical implementation of FIRST.org CVSS v4.0 & v3.1 scoring with automatic severity categorization (Critical, High, Medium, Low, Informational).
- **Automated High & Critical Security Alerts**: Instant in-app, banner, and notification dispatch to PMO, Department Admin, and Executive Super Admin upon vulnerability submission.
- **Cross-Department Collaboration**: Seamless vulnerability delegation workflow from VAPT to Software Development with scoped read access and retest lifecycle.
- **Multi-Format Reporting**: Automated compilation and export in HTML (interactive safe preview), PDF, DOCX, XLSX, and CSV formats.
- **Immutable Audit Logging**: Cryptographically verifiable append-only activity trail recording actor, action, resource, IP address, and timestamp.

---

## 2. Quick Start Options

See **[RUNNING_GUIDE.md](RUNNING_GUIDE.md)** for detailed walkthroughs and configurations.

### Option A: Run as Single Unified Docker Image (Fastest Docker Setup)
Builds and runs both FastAPI and Next.js in a single container with pre-seeded database:
```bash
cd enterpriseops
./docker-build.sh
./docker-run.sh
```
*Or manually:*
```bash
docker build -t enterpriseops:latest .
docker run -d -p 3000:3000 -p 8000:8000 --name enterpriseops enterpriseops:latest
```

### Option B: Run Without Docker (Fastest Local Setup)
Runs directly on your machine using Python and Node.js with built-in SQLite:
```bash
cd enterpriseops
./start-local.sh
```
*(To stop anytime: `./stop-local.sh`)*

### Option C: Run With Multi-Container Docker Compose
Launches the full 8-container stack (PostgreSQL, Redis, MinIO, Backend, Worker, Scheduler, Frontend, Nginx):
```bash
cd enterpriseops
cp .env.example .env
docker compose up -d --build
```

---

## 3. Access URLs
- **Web UI (Liquid Glass)**: **http://localhost:3000**
- **Backend API & Swagger Docs**: **http://localhost:8000/docs**
- **Backend Health Check**: **http://localhost:8000/healthz**

---

## 3. Demonstration Personas

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Super Admin / CEO** | `superadmin@enterpriseops.internal` | `AdminP@ssw0rd2026!Secure` | Full Enterprise-Wide Command |
| **Security PMO** | `pmo@enterpriseops.internal` | `DemoP@ssw0rd2026!` | Workspace & Task Governance |
| **VAPT Tester (Vishal)** | `tester@enterpriseops.internal` | `DemoP@ssw0rd2026!` | Workday Check-in, PT Tasks, Findings |
| **Developer (Alex)** | `dev@enterpriseops.internal` | `DemoP@ssw0rd2026!` | Cross-Department Remediation Fix |

---

## 4. Documentation Index

- [Product Requirements Document (PRD)](file:///Users/vishalwaghmare/New%20Tools/PMO%20project/enterpriseops/docs/PRD.md)
- [System Architecture](file:///Users/vishalwaghmare/New%20Tools/PMO%20project/enterpriseops/docs/architecture/ARCHITECTURE.md)
- [Database Entity Relationship Diagram (ERD)](file:///Users/vishalwaghmare/New%20Tools/PMO%20project/enterpriseops/docs/database/ERD.md)
- [Database Schema Specification](file:///Users/vishalwaghmare/New%20Tools/PMO%20project/enterpriseops/docs/database/SCHEMA.md)
- [Role-Based Access Control (RBAC) Matrix](file:///Users/vishalwaghmare/New%20Tools/PMO%20project/enterpriseops/docs/security/RBAC_MATRIX.md)
- [Docker Deployment Guide](file:///Users/vishalwaghmare/New%20Tools/PMO%20project/enterpriseops/docs/deployment/DOCKER_GUIDE.md)
- [Production Readiness Checklist](file:///Users/vishalwaghmare/New%20Tools/PMO%20project/enterpriseops/docs/PRODUCTION_READINESS.md)
