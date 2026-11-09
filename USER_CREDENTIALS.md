# hacksudo EnterpriseOps — User Credentials & Access Directory

Welcome to **hacksudo EnterpriseOps** (Enterprise IT Workforce, PMO Governance & VAPT Platform).  
This document contains the official user credentials, system roles, designations, and scope assignments for all active users.

---

## 1. Quick Access Credentials Summary

| Full Name | Role | Work Email | Password | Designation / Department | Default Landing |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Executive Super Admin** | **Super Admin** | `superadmin@enterpriseops.internal` | `AdminP@ssw0rd2026!Secure` | CEO / Executive Leadership | `/dashboard` |
| **Vishal Waghmare (Admin)** | **Super Admin** | `vishal@hacksudo.com` | `AdminP@ssw0rd2026!Secure` | Super Admin / Cybersecurity Lead | `/dashboard` |
| **Sarah Jenkins** | **PMO** | `pmo@enterpriseops.internal` | `DemoP@ssw0rd2026!` | Lead Security PMO | `/dashboard/pmo` |
| **Vishal Waghmare** | **Employee** | `tester@enterpriseops.internal` | `DemoP@ssw0rd2026!` | Senior Mobile Security Researcher (VAPT) | `/dashboard/employee` |
| **Alex Rivera** | **Employee** | `dev@enterpriseops.internal` | `DemoP@ssw0rd2026!` | Senior Android Developer (Engineering) | `/dashboard/employee` |
| **Jordan Reed** | **Employee** | `jordan.reed@enterpriseops.internal` | `DemoP@ssw0rd2026!` | Principal Security Architect | `/dashboard/employee` |

---

## 2. Detailed Role & Permission Profiles

### 👑 1. Executive Super Admin / CEO
- **Email**: `superadmin@enterpriseops.internal`
- **Password**: `AdminP@ssw0rd2026!Secure`
- **Role**: `Super Admin` (Global Scope)
- **Employee Code**: `EMP-001`
- **Key Capabilities**:
  - Full enterprise command and visibility across all departments and workspaces.
  - User management, role provisioning, and account status controls.
  - Global tamper-evident audit logs (`/dashboard/audit`).
  - Department and workspace creation.
  - VAPT vulnerability governance, findings deletion, and executive reports.

---

### 🛡️ 2. Security PMO (Sarah Jenkins)
- **Email**: `pmo@enterpriseops.internal`
- **Password**: `DemoP@ssw0rd2026!`
- **Role**: `PMO` (Workspace & Project Scope)
- **Employee Code**: `PMO-001`
- **Department**: `VAPT / Cybersecurity` & `Software Development`
- **Key Capabilities**:
  - Project milestone tracking, sprint governance, and task allocation.
  - Cross-departmental handoffs management between VAPT and Software Development.
  - Timesheet and daily productivity reporting approval.
  - Remediation SLA monitoring and SLA violation alerts.

---

### 🔍 3. Senior VAPT Researcher / Team Lead (Vishal Waghmare)
- **Email**: `tester@enterpriseops.internal`
- **Password**: `DemoP@ssw0rd2026!`
- **Role**: `Employee` / `VAPT Team Member`
- **Employee Code**: `SEC-101`
- **Department**: `VAPT / Cybersecurity`
- **Key Capabilities**:
  - Workday check-in / check-out with automatic elapsed productivity timer (`/dashboard/employee`).
  - VAPT vulnerability audit findings management (`/dashboard/vapt`).
  - Upload Excel (`.xlsx`, `.xls`) and Word (`.docx`, `.csv`) pentest reports with automated vulnerability extraction.
  - Selective vulnerability import with custom add/delete options.
  - Quick inline vulnerability rename and deep slide-out drawer editing.
  - 1-click remediation handoff dispatch to Software Development.
  - Verified patch sign-off: **Sign-off & Mark as Closed** vs **Keep Open / Reopen**.
  - One-click export of styled Excel workbooks and Word DOCX executive reports.

---

### 💻 4. Senior Android Developer / Patching Team (Alex Rivera)
- **Email**: `dev@enterpriseops.internal`
- **Password**: `DemoP@ssw0rd2026!`
- **Role**: `Employee` / `Engineering Team Member`
- **Employee Code**: `DEV-202`
- **Department**: `Software Development`
- **Key Capabilities**:
  - Receive remediation handoffs from security auditors.
  - Task board updates (Backlog ➔ In Progress ➔ Ready for Retest).
  - Code remediation tracking and check-in logs.
  - Cross-team messaging in department chat channels.

---

### 📐 5. Principal Security Architect (Jordan Reed)
- **Email**: `jordan.reed@enterpriseops.internal`
- **Password**: `DemoP@ssw0rd2026!`
- **Role**: `Employee` / `Architecture Specialist`
- **Employee Code**: `SEC-004`
- **Department**: `VAPT / Cybersecurity`
- **Key Capabilities**:
  - High-level security threat modeling.
  - Architecture reviews, policy audits, and compliance validation.

---

## 3. How to Log In

1. Open your web browser and navigate to:  
   **`http://localhost:3000`**
2. Enter the **Work Email** and **Password** from Section 1 above.
3. Click **Sign In to Workspace**.
4. You will be automatically redirected to your designated dashboard:
   - Super Admin ➔ **`/dashboard`**
   - PMO ➔ **`/dashboard/pmo`**
   - Researchers / Developers ➔ **`/dashboard/employee`** or **`/dashboard/vapt`**

---

## 4. API & Swagger Documentation Access

The backend provides automated OpenAPI documentation and direct interactive testing:
- **Swagger UI**: `http://127.0.0.1:8000/docs`
- **ReDoc UI**: `http://127.0.0.1:8000/redoc`

To authenticate via API:
```bash
curl -X POST "http://127.0.0.1:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tester@enterpriseops.internal",
    "password": "DemoP@ssw0rd2026!"
  }'
```
Response will return a Bearer JWT access token:
```json
{
  "access_token": "<JWT_TOKEN>",
  "token_type": "bearer",
  "role": "Employee",
  "full_name": "Vishal Waghmare"
}
```

---

## 5. Security Notes
- Passwords are encrypted using **Argon2id** with enterprise memory/time hardness cost.
- Sessions use secure **JWT (JSON Web Tokens)** with scoped role-based access control (RBAC).
- To change or reset any user password, use the **Users & Access** module (`/dashboard/users`) while logged in as Super Admin.
