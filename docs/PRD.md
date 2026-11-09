# EnterpriseOps — Product Requirements Document (PRD)

## 1. Executive Summary
**EnterpriseOps** is a production-grade, self-hosted, Docker-based Enterprise IT Workforce Management, Project Management, Vulnerability Management (VAPT), Reporting, and Team Collaboration Platform. It unifies the key enterprise workflows of Jira (issue tracking, agile tasks), ClickUp (workspaces, task hierarchies, custom statuses), Microsoft Teams (department channels, real-time messaging, direct messages), employee workday check-ins (work logs, time tracking), VAPT vulnerability reporting (CVSS v4.0 / v3.1 scoring, POC evidence management, remediation tracking), and real-time executive analytics.

The user interface follows a modern Apple-inspired **Liquid Glass UI design system** with frosted translucent panels (`backdrop-filter: blur`), dark/light theme switching, fluid micro-interactions, responsive charts, and strict enterprise contrast accessibility.

---

## 2. Product Objectives & Target Personas
1. **Super Admin / CEO / MD**: Complete organization visibility, consolidated VAPT vulnerability posture, department workload, cross-department handoffs, immutable audit logs, and one-click executive report exports.
2. **Department Administrator**: Isolated administrative oversight of their specific department (e.g., VAPT, QA, Software Dev, DevOps), workspace approvals, user assignments, and department performance metrics.
3. **PMO / Project Manager**: Project lifecycle governance, task assignment, employee check-in tracking, milestone scheduling, retest orchestration, and cross-team remediation handoffs.
4. **Team Lead**: Team task oversight, reviews, workload balancing, and sprint/calendar coordination.
5. **Employee / Tester / Developer**: Seamless "I'M ON WORK" one-click check-in, task progress logging, daily activity reports, finding submission with CVSS calculations and POC uploads, and cross-team collaboration.
6. **Auditor / Read-Only**: Read-only oversight of scoped projects, vulnerability status, and audit logs without modification privileges.

---

## 3. Scope & Phased Implementation Roadmap

### Phase 1: Foundation (Current MVP Milestone)
- **Monorepo Architecture**: Next.js 15+ (App Router) frontend, Python 3.12+ FastAPI backend, PostgreSQL 16, Redis 7, MinIO private S3 storage.
- **Docker Compose Stack**: Fully containerized environment with reverse proxy and environment configuration.
- **Database Core**: Complete SQLAlchemy 2.0 schema for organizations, departments, workspaces, users, memberships, roles, and permissions with Alembic migrations.
- **Security & Auth**: Argon2id password hashing, HTTP-only JWT cookies, MFA TOTP preparation, rate limiting, and secure CLI bootstrap for first-run administrator (`app bootstrap-admin`).
- **Liquid Glass Shell**: Apple-inspired translucent glass layout, navigation, workspace switcher, and responsive dark/light theme.

### Phase 2: Task Management & Employee Work Tracking
- Full task lifecycle (Draft, Planned, Assigned, In Progress, Blocked, In Review, Completed, Approved, Reopened, Cancelled).
- "I'M ON WORK" workday check-ins, time tracking, and structured daily work reports.
- PMO task creation, manager assignment, employee self-created tasks, and calendar/Kanban views.

### Phase 3: VAPT Management & CVSS v4/v3.1 Engine
- Engagements, assets, and vulnerability finding lifecycles.
- Specification-compliant CVSS v4.0 & v3.1 scoring calculator.
- Private object storage (MinIO) for encrypted POC and evidence uploads with MIME validation, checksum verification, and expiring download tokens.
- Instant high/critical alert dispatcher across in-app banners, WebSockets, and PMO/Admin notifications.

### Phase 4: Reporting & Executive Dashboards
- Automated aggregation of employee daily logs, department velocity, and vulnerability metrics without duplicate counting.
- Multi-format report export (HTML, PDF, DOCX, XLSX, CSV).
- Executive drill-down: Organization → Department → Workspace → Project → Task → Finding → Evidence.

### Phase 5: Collaboration, Handoffs & Real-Time Chat
- Department and workspace real-time chat channels via WebSockets.
- Cross-department remediation handoff workflow (e.g., VAPT → Development → Retest).
- In-browser secure document previewer (PDF, DOCX safe HTML, CSV, XLSX, code files).

### Phase 6: Production Hardening & E2E Validation
- Immutable audit logging, security headers, Playwright automated tests, backup/restore scripts, and release packaging.

---

## 4. Key Performance & Security Requirements
- **Tenant & Scope Isolation**: Strict hierarchical enforcement (Organization → Department → Workspace). No user can access or query another workspace without explicit role assignment or cross-department handoff token.
- **Vulnerability Handling**: Sensitive POC files never stored in public web paths; strictly signed S3 URLs with short TTL (< 15 mins). No macro evaluation or active script execution in previews.
- **CVSS Scoring**: Validated against FIRST.org CVSS v4.0 specification vectors (e.g. `CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N`).
- **Accessibility & UX**: Compliant with WCAG 2.1 AA contrast standards; glass effects designed with contrast-preserving backgrounds.
