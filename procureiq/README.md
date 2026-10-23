# ProcureIQ — Intelligent Procurement & Supplier Risk Platform

ProcureIQ is a modern procurement management and supplier risk evaluation platform featuring role-based workflows, transparent rule-based supplier scoring, real-time risk radar analytics, and complete purchase order lifecycle tracking.

---

## System Architecture

- **Frontend**: React 18, Vite 5, React Router 6, Recharts, Bootstrap 5.
- **Backend**: Node.js, Express 4, Mongoose 8, JWT Authentication, bcrypt password hashing.
- **Database**: MongoDB (Local Community Server, Cloud Atlas, or Zero-Config In-Memory Sandbox).
- **Backend Port**: `5000`
- **Frontend Port**: `5173`

---

## 🚀 Quick Start (One-Click Launch)

Open PowerShell in the project directory and run:

```powershell
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

This startup script automatically checks prerequisites, verifies environment variables, launches the backend and frontend in separate terminals, and opens the application.

---

## 🛠️ Step-by-Step Manual Setup

### 1. Prerequisites
- **Node.js**: v18.0.0 or later (v24 LTS recommended). Verify: `node -v`
- **npm**: v9.0.0 or later. Verify: `npm -v`

### 2. Database Setup (Choose ONE Option)

#### Option A: Zero-Config In-Memory Sandbox (Default / No Installation Needed)
If local MongoDB is not running, ProcureIQ **automatically starts an in-memory database** and pre-populates all sample users, suppliers, and purchase requests. No installation or setup is required. Perfect for immediate testing and demonstrations.

#### Option B: Local MongoDB Community Server (Persistent)
1. Download [MongoDB Community Server](https://www.mongodb.com/try/download/community) for Windows.
2. During installation, select **"Complete"** and ensure **"Run service as Network Service user"** is checked.
3. Verify that the MongoDB service is running on `127.0.0.1:27017`:
   ```powershell
   Get-Service MongoDB*
   ```
4. The default URI in `backend/.env` is already configured for local MongoDB:
   ```env
   MONGO_URI=mongodb://127.0.0.1:27017/procureiq
   ```

#### Option C: MongoDB Atlas Cloud (Persistent Free Tier)
1. Create a free account at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Create a free **M0 cluster**.
3. Under **Database Access**, create a database user and password.
4. Under **Network Access**, add IP address `0.0.0.0/0` (allow access from anywhere for development).
5. Click **Connect** → **Drivers** and copy your connection string.
6. Paste the connection string into `backend/.env`:
   ```env
   MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/procureiq?retryWrites=true&w=majority
   ```

---

### 3. Backend Setup

From the `backend` folder:

```powershell
cd backend
npm install
```

Configure `backend/.env` (created automatically from `.env.example` if not present):
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/procureiq
JWT_SECRET=ENx94WIesc14bCPGTHgJwsJP8fKoRgl3ae3rhKeXw6Bb8TRTJAmVDBiruwblkaCJ
ALLOW_SELF_APPROVAL=false
```

Seed the database with sample data:
```powershell
npm run seed
```

Run tests to verify all 35 test suites pass:
```powershell
npm test
```

Start the backend API server:
```powershell
npm run dev
```
The API is available at `http://localhost:5000`.
Health endpoint: `http://localhost:5000/api/health`

---

### 4. Frontend Setup

In a new terminal window, from the `frontend` folder:

```powershell
cd frontend
npm install
npm run dev
```

Open your browser to:
**http://localhost:5173**

To create a production build:
```powershell
npm run build
```

---

## 👥 Demo Accounts & Roles

All demo accounts use the password: **`Password@123`**

| Role | Email | Permissions |
|---|---|---|
| **Requester** | `requester@procureiq.com` | Creates draft requests, edits owned drafts, submits requests for approval. |
| **Officer** | `officer@procureiq.com` | Starts reviews, reviews suppliers, creates purchase orders, marks delivery. |
| **Approver** | `approver@procureiq.com` | Approves or rejects reviewed requests (requires reason if rejecting). |
| **Admin** | `admin@procureiq.com` | Full administrative access, manages user accounts and roles. |

---

## 🔄 End-to-End Procurement Workflow

1. **Step 1 — Create Request (Requester)**:
   - Log in as `requester@procureiq.com`.
   - Go to **Requests** → click **+ New request**.
   - Enter item name, category, quantity, unit price, required date, and justification.
   - Click **Save as draft**.
   - Open the draft and click **Submit for approval**. Status changes to `submitted`.

2. **Step 2 — Start Review (Officer)**:
   - Log in as `officer@procureiq.com`.
   - Open the submitted request and click **Start review**. Status changes to `under_review`.

3. **Step 3 — Approval / Rejection (Approver)**:
   - Log in as `approver@procureiq.com`.
   - Open the request. Enter comments and click **Approve** (or enter a mandatory reason and click **Reject**). Status changes to `approved` or `rejected`.

4. **Step 4 — Supplier Selection & Purchase Order (Officer)**:
   - Log in as `officer@procureiq.com`.
   - Open the approved request. Review the ranked supplier comparison table.
   - Select an active supplier and click **Create purchase order**. Status changes to `ordered` with an auto-generated PO number.

5. **Step 5 — Delivery Confirmation (Officer)**:
   - When goods are received, click **Mark delivered**. Status transitions to `delivered`.

6. **Step 6 — Fit & Risk Engine**:
   - Navigate to **Fit & Risk Engine**.
   - Adjust scoring weights (Price, Delivery, Quality, Compliance) totaling 100%.
   - Click **Run** to simulate what-if ranking scenarios based on live supplier attributes.

---

## 🩺 Troubleshooting

- **Port in use (`EADDRINUSE: 5000` or `5173`)**:
  Check which process is using the port:
  ```powershell
  Get-NetTCPConnection -LocalPort 5000, 5173
  ```
  Terminate the process or adjust `PORT` in `backend/.env` and `proxy.target` in `frontend/vite.config.js`.

- **MongoDB Connection Failed**:
  If using local MongoDB, ensure the Windows service is running (`Get-Service MongoDB*`). If you don't have local MongoDB installed, the backend will automatically fallback to in-memory MongoDB without any manual action needed.

- **Vite Proxy Resolution**:
  `frontend/vite.config.js` is pre-configured to proxy to `http://127.0.0.1:5000` with `changeOrigin: true` to prevent IPv6 `::1` resolution conflicts on Windows.
