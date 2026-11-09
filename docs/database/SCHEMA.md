# EnterpriseOps — Database Schema Specification

## Overview
PostgreSQL 16 relational database schema using UUID (v4) primary keys, strict foreign key constraints with `ON DELETE CASCADE` or `SET NULL`, composite indexes on commonly queried search keys, and UTC timestamps.

---

## 1. Tenancy & Hierarchy Tables

### `organizations`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(36) | PRIMARY KEY | Organization UUID |
| `name` | VARCHAR(255) | NOT NULL | Legal enterprise name |
| `slug` | VARCHAR(255) | UNIQUE, INDEX | URL identifier |
| `logo_url` | VARCHAR(1024) | NULLABLE | CDN / Storage key for branding logo |
| `settings` | JSON | DEFAULT '{}' | Custom themes and policies |
| `status` | VARCHAR(50) | DEFAULT 'active' | active / suspended |
| `created_at` | TIMESTAMP | NOT NULL | UTC creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL | UTC update timestamp |

### `departments`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(36) | PRIMARY KEY | Department UUID |
| `organization_id` | VARCHAR(36) | FK(organizations.id) | Tenant parent |
| `name` | VARCHAR(255) | NOT NULL | Department name (e.g. VAPT) |
| `slug` | VARCHAR(255) | INDEX | Routing slug |
| `description` | TEXT | NULLABLE | Department charter |
| `department_head_id` | VARCHAR(36) | NULLABLE | Department director |
| `status` | VARCHAR(50) | DEFAULT 'active' | Operational status |

### `workspaces`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(36) | PRIMARY KEY | Workspace UUID |
| `organization_id` | VARCHAR(36) | FK(organizations.id) | Tenant parent |
| `department_id` | VARCHAR(36) | FK(departments.id) | Scoped department |
| `name` | VARCHAR(255) | NOT NULL | Workspace title |
| `slug` | VARCHAR(255) | INDEX | Workspace URI identifier |
| `status` | VARCHAR(50) | DEFAULT 'active' | active / archived |

---

## 2. Authentication & Scoped RBAC Tables

### `users`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(36) | PRIMARY KEY | User UUID |
| `organization_id` | VARCHAR(36) | FK(organizations.id) | Tenant organization |
| `employee_code` | VARCHAR(64) | UNIQUE, INDEX | Corporate HR employee ID |
| `full_name` | VARCHAR(255) | NOT NULL | Display name |
| `email` | VARCHAR(255) | UNIQUE, INDEX | Login email address |
| `password_hash` | VARCHAR(255) | NOT NULL | Argon2id crypt string |
| `designation` | VARCHAR(128) | DEFAULT 'Employee' | Job title |
| `account_status` | VARCHAR(50) | DEFAULT 'active' | active, suspended, invited |
| `mfa_enabled` | BOOLEAN | DEFAULT FALSE | TOTP MFA status |
| `mfa_secret` | VARCHAR(64) | NULLABLE | Encrypted Base32 TOTP secret |
| `last_login_at` | TIMESTAMP | NULLABLE | Recent login timestamp |

### `roles`, `permissions`, `role_permissions`, `role_assignments`
- Normalized RBAC tables enforcing scoped authorization at global, organization, department, and workspace levels.

---

## 3. Operations & Task Management Tables

### `tasks`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(36) | PRIMARY KEY | Task UUID |
| `organization_id` | VARCHAR(36) | FK(organizations.id) | Scoped tenant |
| `department_id` | VARCHAR(36) | FK(departments.id) | Scoped department |
| `workspace_id` | VARCHAR(36) | FK(workspaces.id) | Scoped workspace |
| `project_id` | VARCHAR(36) | FK(projects.id) | Optional project deliverable |
| `task_number` | VARCHAR(32) | UNIQUE, INDEX | e.g. TASK-1001 |
| `title` | VARCHAR(255) | NOT NULL | Task title |
| `category` | VARCHAR(100) | INDEX | Android PT, QA, Dev, Bug Fix |
| `priority` | VARCHAR(50) | INDEX | Critical, High, Medium, Low |
| `status` | VARCHAR(50) | INDEX | Planned, In Progress, Completed, Approved |
| `created_by` | VARCHAR(36) | FK(users.id) | Task creator |
| `assigned_by` | VARCHAR(36) | FK(users.id) | Manager assigner |
| `due_at` | TIMESTAMP | INDEX | Target deadline |
| `estimated_minutes` | INTEGER | DEFAULT 0 | Estimated duration |
| `actual_minutes` | INTEGER | DEFAULT 0 | Logged duration |

---

## 4. Work Tracking & Daily Reports

### `workday_checkins`
Records employee daily check-in timestamps, status (active, paused, completed), and work dates.

### `daily_work_reports`
Stores structured end-of-day summary, blockers, and next steps submitted by employees and displayed on PMO, Department Admin, and Executive dashboards.

---

## 5. VAPT & Vulnerability Management

### `findings`
Stores vulnerability findings with CVSS v4.0 / v3.1 vectors, validated scores, severities, affected asset links, observation, impact, and remediation steps.
Automated trigger emits `alert_deliveries` on Critical and High severity findings.
