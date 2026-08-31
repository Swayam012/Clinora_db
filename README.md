# CLINORA — AI-Powered Clinical Document Intelligence & Analysis System

Clinora is a web-based AI system for digitizing, organizing, searching, and analyzing clinical documents (prescriptions, lab reports, clinical notes, discharge summaries, and patient records).

---

## 🏗️ Project Architecture

```
Clinora/
├── backend/                  # FastAPI Python Backend
│   ├── app/
│   │   ├── api/              # API Endpoints & Routers
│   │   │   └── v1/
│   │   │       ├── api.py
│   │   │       └── endpoints/
│   │   │           └── health.py
│   │   ├── core/             # App Configuration & Settings
│   │   │   └── config.py
│   │   ├── db/               # Database Connection & Sessions
│   │   │   └── session.py
│   │   ├── models/           # SQLAlchemy Models
│   │   ├── schemas/          # Pydantic Schemas
│   │   ├── services/         # Business Logic
│   │   ├── repositories/     # Data Access Layer
│   │   └── utils/            # Utilities
│   ├── main.py               # Server Entrypoint
│   ├── pyproject.toml        # Dependencies managed via `uv`
│   └── .env                  # Environment Variables
│
├── frontend/                 # React + Vite Frontend
│   ├── src/
│   │   ├── services/         # API Service Calls
│   │   │   └── api.js
│   │   ├── App.jsx           # Main Dashboard Component
│   │   └── index.css         # Clinical UI Styling
│   └── package.json
│
└── README.md
```

---

## ⚙️ Requirements

* **Python**: 3.11+
* **Package Manager**: `uv` (Fast Python package installer)
* **Node.js**: 18+
* **Database**: PostgreSQL

---

## 🚀 Quick Start Guide

### 1. Backend Setup

Navigate to the `backend/` directory:

```bash
cd backend
```

Create environment variables (if not already present):

```bash
cp .env.example .env
```

Install dependencies and start the backend server using `uv`:

```bash
uv run python main.py
```

The FastAPI server will start at: `http://localhost:8000`
Swagger API Documentation: `http://localhost:8000/docs`
Health Endpoint: `http://localhost:8000/health`

---

### 2. Frontend Setup

In a separate terminal, navigate to the `frontend/` directory:

```bash
cd frontend
```

Install Node dependencies and launch the Vite development server:

```bash
npm install
npm run dev
```

The frontend application will start at: `http://localhost:5173`

---

## 🔍 Phase Status

- [x] **Phase 1 — Foundation**: FastAPI Backend, React/Vite Frontend, PostgreSQL Setup, Environment Configuration, Health Endpoint, CORS Middleware, `.gitignore`, `README`.
- [x] **Phase 2 — Authentication**: JWT auth, password hashing, role-based access control.
- [x] **Phase 3 — Patient Management**: Patient CRUD and search.
- [x] **Phase 4 — Document Storage**: Upload and manage prescriptions, lab reports, notes.
- [ ] **Phase 5 — OCR Engine**: Tesseract text extraction.
- [ ] **Phase 6 — Information Extraction**: LLM structured data extraction.
- [ ] **Phase 7 — Clinical RAG**: Vector DB search & Q&A.
- [ ] **Phase 8 — Knowledge Graph**: Neo4j entity relationships.
- [ ] **Phase 9 — AI Agents**: Task-focused workflow agents.
- [ ] **Phase 10 — Dashboard**: Complete UI and reporting analytics.
- [ ] **Phase 11 — Security & Audit**: Security hardening and testing.
