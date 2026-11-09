# EnterpriseOps — Role-Based Access Control (RBAC) & Authorization Model

## 1. Scoped RBAC Architecture
EnterpriseOps enforces **Scoped Resource-Based Access Control**. Permissions are never evaluated as simple global flags; they are checked within an explicit context:
- `global`: Super Admin / Executive oversight across all organizations.
- `organization`: Scoped to an organization (`org_id`).
- `department`: Scoped to a department (`dept_id`).
- `workspace`: Scoped to a specific project workspace (`workspace_id`).

### Scope Hierarchy Evaluation
```
Global (Super Admin)
  └── Organization Admin
        └── Department Admin
              └── Workspace PMO / Team Lead
                    └── Employee / Contributor
```

---

## 2. Standard Roles Matrix

| Role | Scope | View Dashboard | Manage Users / Roles | Manage Depts / Workspaces | Manage Projects | Assign Tasks | Create Own Tasks | Submit Daily Logs | Submit Findings (VAPT) | Upload POC Evidence | Trigger Cross-Dept Handoff | View Audit Logs |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Super Admin / CEO / MD** | Global / Org | Full Org | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes (Audited) | Yes | Full Org |
| **Dept Admin** | Department | Dept Only | Dept Scope | Dept Scope | Dept Scope | Yes | Yes | Yes | Yes | Yes | Yes | Dept Scope |
| **PMO / Project Manager** | Workspace | Workspace | Read Only | Workspace | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Workspace |
| **Team Lead** | Team / WS | Team / WS | No | No | Team Scope | Team Scope | Yes | Yes | Yes | Yes | Team Scope | No |
| **Employee / Tester / Dev** | Self / Assigned | Personal | No | No | Read Only | No | Yes | Yes | If VAPT Role | Yes | Request Only | No |
| **Auditor** | Read-Only | Read Only | No | No | Read Only | No | No | No | Read Only | View Only | No | Read Only |

---

## 3. Granular Permission Actions & Resources
Actions supported on each resource:
- `create`, `read`, `update`, `delete`, `assign`, `approve`, `reject`, `share`, `export`, `download`.

Resources governed:
- `organizations`, `departments`, `teams`, `workspaces`, `users`, `roles`, `projects`, `tasks`, `checkins`, `daily_reports`, `engagements`, `findings`, `evidence_files`, `reports`, `channels`, `messages`, `handoffs`, `audit_logs`.

---

## 4. Anti-Privilege Escalation Rules
1. A user cannot grant permissions or roles that exceed their own current scope and assigned permissions.
2. Department Administrators cannot assign users or manage resources in other departments.
3. Super Admin operations on highly sensitive POC evidence are explicitly logged with mandatory audit notes.
4. Any attempt to modify system roles or permissions produces an immediate immutable audit log entry.
