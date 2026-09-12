# CLINORA — AI-Powered Clinical Document Intelligence & Analysis System

Clinora is a web-based AI system for digitizing, organizing, searching, and analyzing clinical documents (prescriptions, lab reports, clinical notes, discharge summaries, and patient records).

---

## 🏗️ Project Architecture

```
Clinora/
├── backend/                  # FastAPI Python Backend
│   ├── app/
│   │   ├── api/              # API Endpoints & Routers (Auth, Patients, Documents, Health)
│   │   ├── core/             # App Configuration, Rate Limiting & Security
│   │   ├── db/               # Database Connection & Sessions
│   │   ├── models/           # SQLAlchemy Database Models
│   │   ├── schemas/          # Pydantic Input/Output Schemas
│   │   ├── services/         # Business Logic & OCR Engine
│   │   ├── repositories/     # Data Access Layer
│   │   └── utils/            # Utilities
│   ├── main.py               # Server Entrypoint
│   ├── pyproject.toml        # Dependencies managed via `uv`
│   └── .env                  # Environment Variables
│
├── frontend/                 # React + Vite Frontend
│   ├── src/
│   │   ├── components/       # shadcn/ui & Layout Components
│   │   ├── pages/            # Login, Dashboard, Patients, Documents, Viewer
│   │   ├── services/         # API Service Calls & Auth Handling
│   │   ├── App.jsx           # Main Router with ProtectedRoute Guards
│   │   └── index.css         # Clinical UI Styling & Tailwind
│   └── package.json
│
└── README.md
```

---

## ⚙️ Requirements

* **Backend (Python / FastAPI)**:
  * **Python**: 3.11+
  * **Package Manager**: `uv` (Fast Python package manager)
  * **Database**: PostgreSQL
* **Frontend (React / Vite)**:
  * **Node.js**: 18+ (Required for `npm` and Vite bundler)

---

## 🚀 Quick Start Guide

### 1. Backend Setup (FastAPI)

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

* The FastAPI server will start at: `http://localhost:8000`
* Swagger API Documentation: `http://localhost:8000/docs`
* Health Endpoint: `http://localhost:8000/health`

---

### 2. Frontend Setup (React + Vite)

In a separate terminal, navigate to the `frontend/` directory:

```bash
cd frontend
```

Install Node dependencies and launch the Vite development server:

```bash
npm install
npm run dev
```

* The frontend application will start at: `http://localhost:5173`

---

## 🔍 Phase Status

- [x] **Phase 1 — Foundation**: FastAPI Backend, React/Vite Frontend, PostgreSQL Setup, Environment Configuration, Health Endpoint, CORS Middleware, `.gitignore`, `README`.
- [x] **Phase 2 — Authentication**: JWT auth, bcrypt password hashing, role-based access control.
- [x] **Phase 3 — Patient Management**: Patient CRUD and search.
- [x] **Phase 4 — Document Storage**: Upload and manage prescriptions, lab reports, notes.
- [x] **Phase 5 — OCR Engine**: Multi-engine text extraction (RapidOCR neural model, PyMuPDF native extraction, Tesseract fallback).
- [x] **Phase 6 — Information Extraction**: LLM structured clinical entity extraction (Diagnoses with ICD-10, Medications, Vitals, Symptoms, Lab results).
- [x] **Phase 7 — Clinical RAG**: Vector DB semantic search & grounded medical Q&A with exact document citations.
- [x] **Phase 8 — Knowledge Graph**: Multi-modal clinical entity relationships (Patients, ICD-10 Diagnoses, Medications, Biomarkers, Documents), dual-engine Neo4j/relational graph builder, and interactive SVG visualization.
- [ ] **Phase 9 — AI Agents**: Task-focused workflow agents.
- [ ] **Phase 10 — Dashboard**: Complete UI and reporting analytics.
- [x] **Phase 11 — Security & Hardening**: Rate limiting (SlowAPI), magic byte upload validation, security headers, CORS lockdown, route guards, input validation.
