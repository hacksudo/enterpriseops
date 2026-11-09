# EnterpriseOps — Administrator & Executive Guide

## 1. System Bootstrap & Initialization
Upon first launching EnterpriseOps via Docker Compose:
```bash
docker-compose exec backend python -m app.cli bootstrap-admin
```
This sets up the root organization ("EnterpriseOps Global IT & Security"), standard system permissions across 21 core resources, standard roles, and creates the default Super Admin credential:
- **Email:** `superadmin@enterpriseops.internal`
- **Password:** `AdminP@ssw0rd2026!Secure` (configured in `.env`)

---

## 2. Organization & Department Governance
1. Log in with Super Admin credentials.
2. Navigate to **Departments** (`/dashboard/departments`).
3. Click **New Department** to provision additional business divisions (e.g., SOC, Network Engineering, Quality Assurance).
4. Department boundaries strictly isolate workspaces, tasks, findings, and chat channels.

---

## 3. User Provisioning & Scoped RBAC
1. Administrators assign users to specific roles:
   - **Super Admin / CEO / MD**: Full enterprise-wide access.
   - **Department Admin**: Administrative authority within their department only.
   - **PMO**: Project and task management across assigned workspaces.
   - **Team Lead**: Sprint and task assignment within their team.
   - **Employee**: Task execution, daily logs, and VAPT finding submissions.
   - **Auditor**: Read-only oversight.

---

## 4. Executive Command Center
The Executive Dashboard (`/dashboard`) provides:
- Live aggregate totals across all departments.
- Vulnerability severity breakdown without double-counting.
- Discovery telemetry (today, this week, this month).
- One-click export of the Executive Consolidated Report.
