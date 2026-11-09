# EnterpriseOps — Execution & Deployment Guide
This guide provides complete, step-by-step instructions to run **EnterpriseOps**:
1. **As a Single Unified Docker Image** (Fastest Docker method, 1 command)
2. **With Docker Compose** (Full enterprise multi-container stack)
3. **Without Docker** (Direct local execution using Python virtual environment & Node.js)

---

## Quick Reference Summary

| Run Mode | Command | Web UI URL | Backend API / Docs |
| :--- | :--- | :--- | :--- |
| **Unified Docker Image** | `./docker-run.sh` or `docker run -p 3000:3000 -p 8000:8000 enterpriseops` | `http://localhost:3000` | `http://localhost:8000/docs` |
| **Docker Compose** | `docker compose up -d` | `http://localhost:3000` (or `:80`) | `http://localhost:8000/docs` |
| **Local (Without Docker)** | `./start-local.sh` | `http://localhost:3000` | `http://127.0.0.1:8000/docs` |

---

## Method 1: Run as a Single Unified Docker Image

The root `Dockerfile` creates a self-contained production image containing both the **Next.js Liquid Glass UI** and the **FastAPI Monolith**, pre-bundled with the seeded database and demo accounts.

### Step 1: Build the Docker Image
```bash
cd enterpriseops
docker build -t enterpriseops:latest .
```
*(Or run `./docker-build.sh`)*

### Step 2: Run the Docker Container
```bash
docker run -d \
  --name enterpriseops \
  -p 3000:3000 \
  -p 8000:8000 \
  --restart unless-stopped \
  enterpriseops:latest
```
*(Or run `./docker-run.sh`)*

### Step 3: Access the Application
- **Web UI**: [http://localhost:3000](http://localhost:3000)
- **API Documentation (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check**: [http://localhost:8000/healthz](http://localhost:8000/healthz)

### Container Management
```bash
# View live logs
docker logs -f enterpriseops

# Stop container
docker stop enterpriseops

# Restart container
docker restart enterpriseops

# Remove container
docker rm -f enterpriseops
```

### Exporting & Loading Docker Image TAR File (Offline / Air-Gapped)

To package the built Docker image into a single portable `.tar` or `.tar.gz` file:

```bash
# Export the Docker image to enterpriseops_image.tar (and .tar.gz):
./docker-export-tar.sh
```

To load and run the exported TAR on any computer with Docker:
```bash
# 1-Click Load & Run:
./docker-load-tar.sh enterpriseops_image.tar.gz

# Manual commands:
docker load < enterpriseops_image.tar.gz
docker run -d -p 3000:3000 -p 8000:8000 --name enterpriseops enterpriseops:latest
```

---

## Method 2: Run With Docker Compose (Multi-Service Stack)

For multi-service deployment with isolated PostgreSQL 16, Redis 7, MinIO S3, Celery background workers, and Nginx reverse proxy:

### Step 1: Copy Environment Config
```bash
cd enterpriseops
cp .env.example .env
```

### Step 2: Launch All Services
```bash
docker compose up -d --build
```

### Step 3: Verify Running Services
```bash
docker compose ps
```

### Step 4: First-Run Database Bootstrap (If using fresh PostgreSQL)
```bash
# Initialize root organization, roles, permissions, and Super Admin
docker compose exec backend python -m app.cli bootstrap-admin

# Seed realistic demo scenarios (tasks, VAPT findings, departments)
docker compose exec backend python -m app.cli seed
```

### Step 5: Stop Services
```bash
docker compose down
```

---

## Method 3: Run Without Docker (Direct Local Execution)

Running locally without Docker is fast and lightweight. It utilizes Python's built-in SQLite engine with the pre-seeded `enterpriseops.db` database.

### Prerequisites
- **Python**: Version 3.10+ (tested up to 3.14)
- **Node.js**: Version 18+ & **npm**

---

### Option A: 1-Click Automated Script (Recommended)

From the `enterpriseops` directory, simply run:
```bash
cd enterpriseops
./start-local.sh
```
This script automatically:
1. Verifies Python & Node.js installations.
2. Creates the Python virtual environment (`venv`) and installs backend requirements if needed.
3. Installs frontend `node_modules` if needed.
4. Cleans up any orphaned processes on ports 8000 or 3000.
5. Launches FastAPI on `http://0.0.0.0:8000`.
6. Launches Next.js on `http://localhost:3000`.
7. Shows live logs and cleanly terminates both processes when you press **Ctrl+C**.

To stop any background servers anytime:
```bash
./stop-local.sh
```

---

### Option B: Manual Step-by-Step Execution

If you prefer running backend and frontend in separate terminal windows:

#### Terminal 1 — Start the Backend Server (FastAPI)
```bash
cd enterpriseops

# 1. Create and activate virtual environment (if not already created)
python3 -m venv venv
source venv/bin/activate

# 2. Install backend dependencies
pip install --upgrade pip
pip install -r apps/backend/requirements.txt

# 3. Navigate to backend app directory
cd apps/backend

# 4. Start the FastAPI server on port 8000
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
Backend will be available at:
- API Root: `http://127.0.0.1:8000`
- Swagger UI Docs: `http://127.0.0.1:8000/docs`
- Health check: `http://127.0.0.1:8000/healthz`

#### Terminal 2 — Start the Frontend Server (Next.js)
```bash
cd enterpriseops/apps/frontend

# 1. Install Node.js dependencies (if not already installed)
npm install

# 2. Launch Next.js development server
npm run dev
```
*(Or for production mode: `npm run build && npm start`)*

Frontend will be available at:
- Web UI: **[http://localhost:3000](http://localhost:3000)**

---

## Default Login Credentials

All demonstration accounts are pre-configured in the database:

| Persona | Role | Work Email | Password | Default Landing |
| :--- | :--- | :--- | :--- | :--- |
| **Executive Super Admin** | `Super Admin` | `superadmin@enterpriseops.internal` | `AdminP@ssw0rd2026!Secure` | `/dashboard` |
| **Cybersecurity Lead (Admin)** | `Super Admin` | `vishal@hacksudo.com` | `AdminP@ssw0rd2026!Secure` | `/dashboard` |
| **Security PMO (Sarah Jenkins)** | `PMO` | `pmo@enterpriseops.internal` | `DemoP@ssw0rd2026!` | `/dashboard/pmo` |
| **VAPT Tester (Vishal Waghmare)** | `Employee (VAPT)` | `tester@enterpriseops.internal` | `DemoP@ssw0rd2026!` | `/dashboard/employee` |
| **Developer (Alex Rivera)** | `Employee (Dev)` | `dev@enterpriseops.internal` | `DemoP@ssw0rd2026!` | `/dashboard/employee` |
| **Principal Architect (Jordan Reed)**| `Employee (Arch)` | `jordan.reed@enterpriseops.internal`| `DemoP@ssw0rd2026!` | `/dashboard/employee` |

---

## Method 4: Client Handover & Clean Slate (Zero Demo Data)

When handing over EnterpriseOps to a new client or team, you can instantly purge all demo findings, tasks, and test logs so they start with a 100% fresh, clean instance:

### Option A: From Web UI (1-Click)
1. Log in as Super Admin (`superadmin@enterpriseops.internal` / `AdminP@ssw0rd2026!Secure`).
2. Click **"Clean Handover"** in the top navigation bar (or visit **PMO Governance** or **Users & Access**).
3. Check *"Also remove demo staff accounts"* if you wish to remove demo accounts (Sarah, Vishal, Alex), keeping only your Super Admin login.
4. Click **"Yes, Wipe Demo Data & Handover Clean"**.
5. All vulnerability findings, agile tasks, check-ins, and reports are instantly purged to 0.

### Option B: Individual Deletions
- **Delete Single Task**: Click the Trash icon on any task card on the Tasks Kanban board (`/dashboard/tasks`) or the PMO tasks list (`/dashboard/pmo`).
- **Clear All Tasks**: Click **"Clear All"** on the Tasks board to wipe all tasks in one click.
- **Delete Single Finding**: Click the Trash icon on any finding card in VAPT Hub (`/dashboard/vapt`) or the PMO findings table.
- **Clear All Findings**: Click **"Clear All Findings"** in VAPT Hub or PMO table.

### Option C: From Command Line / Terminal
```bash
# Run the clean slate script:
./clean-demo-data.sh

# Or directly via Python:
cd apps/backend && python -m app.cli clean
```


