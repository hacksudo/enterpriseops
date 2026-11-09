# EnterpriseOps — VAPT Tester & Security Researcher Guide

## 1. Vulnerability Assessment Workflow
1. Navigate to **VAPT Vulnerabilities** (`/dashboard/vapt`).
2. Click **Submit New Finding**.
3. Supply technical details:
   - **Title**: Vulnerability summary name.
   - **Observation**: Reproduction steps, affected endpoint, parameter or Android component.
   - **Impact**: Maximum business or security exposure.
   - **Remediation**: Actionable guidance for developers.

---

## 2. Specification-Compliant CVSS v4.0 & v3.1 Scoring
- Enter the standard vector string (e.g. `CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N`).
- The system automatically parses MacroVectors EQ1 through EQ5 and validates the numerical score and qualitative severity rating.
- When **Critical** (score 9.0+) or **High** (score 7.0-8.9) is submitted:
  - System automatically creates in-app notification records for PMO, Department Admin, and Executive Super Admin.
  - Generates immutable audit logs with cryptographic timestamps.

---

## 3. Retest Validation Lifecycle
When a developer completes remediation and marks the handoff ready for retest:
1. Re-verify the target asset using the original reproduction steps.
2. In the findings list, click **Pass Retest** (updates status to `Resolved`/`Closed`) or click **Fail Retest** (updates status to `Reopened`).
3. Retest events are permanently attached to the finding history.
