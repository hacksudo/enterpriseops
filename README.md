<div align="center">

# 🛡️ EnterpriseOps
### Enterprise IT Workforce Management, PMO Agile Delivery & High-Assurance VAPT Platform

[![CI](https://github.com/vishalwaghmare/enterpriseops/actions/workflows/ci.yml/badge.svg)](https://github.com/vishalwaghmare/enterpriseops/actions)
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
