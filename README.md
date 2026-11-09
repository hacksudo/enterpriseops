<div align="center">

# 🛡️ EnterpriseOps
### Enterprise IT Workforce Management, PMO Agile Delivery & High-Assurance VAPT Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2+-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![CVSS v4.0](https://img.shields.io/badge/CVSS-v4.0%20%2F%20v3.1-critical.svg)](https://www.first.org/cvss/v4.0/)
[![Author](https://img.shields.io/badge/Author-hacksudo-blue.svg)](https://github.com/vishalwaghmare)

<p align="center">
  <b>A unified, self-hosted command center bringing together Agile Project Management (PMO), Workforce Time Tracking, and Full-Lifecycle Vulnerability Operations (VAPT) in an Apple-inspired Liquid Glass UI.</b>
</p>

[Quick Start](#-quick-start) •
[Core Features](#-core-capabilities) •
[Architecture](#-system-architecture) •
[Client Handover](#-client-handover--clean-slate) •
[Demonstration Credentials](#-demonstration-credentials) •
[API Documentation](#-api-documentation)

</div>

---

## 🚀 Overview

**EnterpriseOps** consolidates fragmented enterprise toolchains (Jira, ClickUp, Microsoft Teams, attendance punch-clocks, and disparate pentest spreadsheets) into a single, high-performance platform.

Built with **FastAPI**, **Next.js 14**, and a native **FIRST.org CVSS v4.0 & v3.1** computation engine, EnterpriseOps eliminates manual report stitching, streamlines security patch delegation, and provides executive leadership with tamper-evident audit trails.

---

## ✨ Core Capabilities

### 1. 🛡️ High-Assurance VAPT & Security Operations
- **Mathematical CVSS Engine**: Real-time CVSS v4.0 & v3.1 calculator with vector string validation and automatic severity tiering (`Critical`, `High`, `Medium`, `Low`, `Informational`).
- **Automated Report Parser**: Drag-and-drop any Excel (`.xlsx`) or Word (`.docx`) audit report to automatically extract findings, CWE/CVE mappings, and remediation guidance with selective bulk import.
- **Retest & Verification Workflow**: Direct handoff to developers for remediation with full retesting history, evidence uploads, and signed-off closures.
- **Executive Export**: 1-click downloads for presentation-ready Excel (`.xlsx`) and Word (`.docx`) executive audit reports.
- **Single & Bulk Delete**: Trash buttons on each finding card, plus a "Clear All Findings" option to wipe test findings.

### 2. 📊 PMO Delivery Governance & Agile Kanban
- **Agile Task Boards**: Kanban workflow with `Planned`, `In Progress`, `In Review`, `Completed`, and `Approved` delivery columns.
- **Task Management**: Create, assign, estimate, progress, and permanently delete tasks with zero clutter.
- **Sprint & Project Oversight**: Cross-department handoffs bridging security testers and development teams.

### 3. ⏱️ Workforce Attendance & Time Tracking
- **"I'm On Work" Check-In**: 1-click workday clock-in/out with live session timer badge in the top navigation bar.
- **Structured Activity Reports**: Daily automated report submission summarizing completed deliverables, blockers, and next sprint goals.

### 4. 🧹 1-Click Client Handover ("Clean Slate")
- **Wipe All Demo Records**: Instantly purge all demo tasks, findings, worklogs, and notifications with a single click.
- **Handover Mode**: Option to delete default demo staff accounts (keeping only your Super Admin login) so clients receive a 100% clean, fresh production instance.

### 5. 💎 Apple Liquid Glass Aesthetic
- Responsive dark-mode interface featuring translucent frosted glass panels (`backdrop-filter: blur(20px)`), ambient gradient lighting, and real-time interaction states.

---

## 🏗️ System Architecture
                 ┌─────────────────────────┐
                   │   Client Web Browser    │
                   │  (Next.js Liquid Glass) │
                   └────────────┬────────────┘
                                │ HTTP / Port 3000
                                ▼

                                
---

## ⚡ Quick Start

### Option 1: Run with Docker (Recommended — 1 Command)

Build and boot the unified single-container image:

```bash
# Clone the repository
git clone https://github.com/vishalwaghmare/enterpriseops.git
cd enterpriseops

# Build and run
./docker-build.sh
./docker-run.sh
```
Or run directly via standard Docker CLI:
```bash
docker build -t enterpriseops:latest .
docker run -d -p 3000:3000 -p 8000:8000 --name enterpriseops enterpriseops:latest
``` 
### Option 2: Run Without Docker (Fastest Local Development)

Requires Python 3.12+ and Node.js 20+:
```bash
cd enterpriseops
./start-local.sh
```
(To stop the background local servers at any time, run ./stop-local.sh)

### Option 3: Run with Docker Compose (Multi-Container Enterprise Stack)

Launches the complete 8-container stack with dedicated PostgreSQL, Redis, MinIO, and Celery workers:
```bash
cd enterpriseops
cp .env.example .env
docker compose up -d --build
```
### Option 4: Run from Standalone Docker TAR

If you have the portable enterpriseops_image.tar (301 MB):
```bash
./run-tar.sh
```

Or load manually:
```bash
docker load -i enterpriseops_image.tar
docker run -d -p 3000:3000 -p 8000:8000 --name enterpriseops enterpriseops:latest
```

## 🌐 Application URLs

Once running, access the services:

| Service | URL | Description |
| :--- | :--- | :--- |
| **Web UI** | [http://localhost:3000](http://localhost:3000) | Next.js Liquid Glass Command Center |
| **API Docs (Swagger)** | [http://localhost:8000/docs](http://localhost:8000/docs) | Interactive OpenAPI Documentation |
| **Health Check** | [http://localhost:8000/healthz](http://localhost:8000/healthz) | Monolith Health & Uptime Status |

## 🔑 Demonstration Credentials

Pre-seeded accounts are available out-of-the-box:

| Persona | Role | Email | Password | Landing Page |
| :--- | :--- | :--- | :--- | :--- |
| **Executive Super Admin** | `Super Admin` | `superadmin@enterpriseops.internal` | `AdminP@ssw0rd2026!Secure` | `/dashboard` |
| **Security PMO** | `PMO` | `pmo@enterpriseops.internal` | `DemoP@ssw0rd2026!` | `/dashboard/pmo` |
| **VAPT Tester (Vishal)** | `Employee (VAPT)` | `tester@enterpriseops.internal` | `DemoP@ssw0rd2026!` | `/dashboard/employee` |
| **Developer (Alex)** | `Employee (Dev)` | `dev@enterpriseops.internal` | `DemoP@ssw0rd2026!` | `/dashboard/employee` |

## 🧹 Client Handover & Clean Slate

When handing over the platform to a client or team, you can wipe all demo records in seconds so they start with zero noise:

Via Web UI
Log in as Super Admin (superadmin@enterpriseops.internal).
Click "Clean Handover" in the top navigation bar (or visit PMO Governance or Users & Access).
(Optional) Check "Also remove demo staff accounts" to delete Sarah, Vishal, and Alex, leaving only your Super Admin login.
Click "Yes, Wipe Demo Data & Handover Clean".
All vulnerability findings, agile tasks, check-ins, and reports are instantly purged to 0.
Via Terminal

```bash
# 1-Click script:
./clean-demo-data.sh

# Or directly via Python backend:
cd apps/backend && python -m app.cli clean
```

## 📁 Repository Structure

```text
enterpriseops/
├── apps/
│   ├── backend/               # FastAPI REST API & CVSS Engine
│   │   ├── app/
│   │   │   ├── api/v1/        # Endpoints (tasks, vapt, auth, audit, bootstrap)
│   │   │   ├── core/          # Database, security, CVSS engine, configs
│   │   │   ├── models/        # SQLAlchemy ORM models
│   │   │   └── schemas/       # Pydantic request/response schemas
│   │   ├── Dockerfile         # Backend standalone container
│   │   └── requirements.txt   # Python dependencies
│   └── frontend/              # Next.js 14 App Router UI
│       ├── app/               # Pages (pmo, tasks, vapt, employee, users)
│       ├── components/        # Liquid Glass UI components
│       └── lib/api.ts         # Direct browser API client
├── docs/                      # Architectural & functional specifications
│   ├── PRD.md                 # Product Requirements Document
│   ├── architecture/          # System Architecture
│   ├── database/              # Schema & ERD specifications
│   └── security/              # RBAC Matrix & Access Control
├── .github/workflows/ci.yml   # GitHub Actions CI automated tests
├── docker-entrypoint.sh       # Monolith container bootstrapper
├── Dockerfile                 # Unified multi-stage Docker build
├── compose.yaml               # Full multi-container compose spec
├── clean-demo-data.sh         # 1-Click Clean Slate handover tool
├── start-local.sh             # 1-Click Local runner (without Docker)
├── stop-local.sh              # 1-Click Local process stopper
├── run-tar.sh                 # 1-Click TAR loader & runner
└── RUNNING_GUIDE.md           # Comprehensive execution runbook
```
## 📚 Documentation Index
Full Running & Deployment Guide
Product Requirements Document (PRD)
System Architecture Specification
Database Schema & ERD
Role-Based Access Control (RBAC) Matrix
Production Readiness Checklist

## 🛡️ Security & Disclosures

For security bug reports, please review our Security Policy or contact vishal@hacksudo.com.

## 📄 License

This project is licensed under the MIT License.
Created with ❤️ by Vishal Waghmare (hacksudo)
.
