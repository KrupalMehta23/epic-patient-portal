# MyHealth Portal — EPIC FHIR Patient App

A locally-hosted, read-only patient portal that connects to your EPIC account via FHIR R4. Built with React on the frontend and a Node.js/Express backend proxy.

---

## Architecture

```
Browser (React :3000)
        │
        │  /auth/initiate   — start OAuth
        │  /auth/callback   — receive code, exchange tokens
        │  /fhir/*          — proxied FHIR requests
        ▼
Express Proxy (:3001)
        │
        │  Authorization Code + PKCE  ──►  EPIC OAuth
        │  Bearer token in header     ──►  EPIC FHIR R4
        ▼
EPIC FHIR Server
```

**Why a backend proxy?**
- The FHIR base URL stays server-side — never exposed in browser JS bundles
- PKCE code verifier is generated and stored server-side
- Rate limiting and request validation happen before EPIC sees traffic
- Tokens pass through sessionStorage only — cleared on tab close or sign out

---

## Prerequisites

- Node.js 18+
- An EPIC developer account with a registered app

---

## 1. Register your EPIC app

1. Go to [https://fhir.epic.com](https://fhir.epic.com) → **Sign In** → **My Apps** → **Create**
2. Set **Application Audience** to `Patients`
3. Set **Incoming API** to `FHIR R4`
4. Add this **Redirect URI** exactly:
   ```
   http://localhost:3001/auth/callback
   ```
5. Note your **Client ID** (shown after saving)

Scopes needed (EPIC will show you a picker):
- `openid`
- `fhirUser`
- `launch/patient`
- `patient/Patient.read`
- `patient/MedicationRequest.read`
- `patient/DiagnosticReport.read`
- `patient/Observation.read`
- `offline_access`

---

## 2. Configure the backend

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

```env
EPIC_CLIENT_ID=your_client_id_from_step_1
EPIC_REDIRECT_URI=http://localhost:3001/auth/callback
EPIC_AUTH_BASE=https://fhir.epic.com/interconnect-fhir-oauth/oauth2
EPIC_FHIR_BASE=https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4
PORT=3001
FRONTEND_ORIGIN=http://localhost:3000
SESSION_SECRET=generate_a_long_random_string_here
```

> For EPIC Sandbox testing use the same endpoints above.
> For a specific hospital system, replace the base URLs with theirs.

---

## 3. Install dependencies

From the project root:

```bash
npm run install:all
```

Or manually:

```bash
cd backend && npm install
cd ../frontend && npm install
```

---

## 4. Run locally

**Terminal 1 — backend:**
```bash
cd backend
npm run dev
# ✅  EPIC FHIR proxy running at http://localhost:3001
```

**Terminal 2 — frontend:**
```bash
cd frontend
npm start
# Opens http://localhost:3000
```

---

## 5. Testing with EPIC Sandbox

EPIC provides a sandbox with test patient credentials. After registering your app:

1. Navigate to `http://localhost:3000`
2. Click **Sign in with EPIC**
3. You'll be redirected to EPIC's login page
4. Use the sandbox test credentials EPIC provides in your developer portal
5. After authorizing, you'll be redirected back to the portal

---

## Project structure

```
epic-patient-portal/
├── backend/
│   ├── server.js          — Express proxy (OAuth + FHIR)
│   ├── .env.example       — Environment variable template
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── App.js                    — Router + auth guard
│       ├── index.js                  — React entry point
│       ├── index.css                 — Global design tokens
│       ├── utils/
│       │   ├── session.js            — sessionStorage token manager
│       │   ├── fhirClient.js         — FHIR proxy API calls
│       │   └── fhirFormat.js         — FHIR resource formatters
│       ├── hooks/
│       │   └── usePatientData.js     — Parallel FHIR data fetcher
│       ├── pages/
│       │   ├── SignIn.jsx            — Sign-in screen
│       │   ├── AuthSuccess.jsx       — OAuth callback handler
│       │   └── Dashboard.jsx         — Main portal with tabs
│       └── components/
│           ├── PatientCard.jsx        — Patient welcome header
│           ├── MedicationsList.jsx    — Medications tab
│           ├── LabReportsList.jsx     — Lab reports tab
│           └── VitalSignsList.jsx     — Vital signs tab
│
└── package.json           — Root scripts
```

---

## Security notes

| Concern | How it's handled |
|---|---|
| PKCE verifier | Generated server-side, never sent to browser |
| CSRF | `state` parameter checked before token exchange |
| Token storage | `sessionStorage` only — cleared on tab close |
| Token in URL | Stripped from URL immediately after capture in `AuthSuccess` |
| FHIR base URL | Only in backend `.env`, never in JS bundle |
| Rate limiting | 20 req/15 min on auth, 100 req/min on FHIR proxy |
| CORS | Restricted to `FRONTEND_ORIGIN` only |
| Headers | `helmet` sets security headers on all responses |

---

## Moving to production

1. Use HTTPS for both backend and frontend
2. Replace `sessionStorage` token passing with `httpOnly` session cookies
3. Use Redis or a database for the PKCE session store instead of the in-memory Map
4. Set `FRONTEND_ORIGIN` to your actual domain
5. Register your production redirect URI in EPIC App Orchard
