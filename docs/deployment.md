# ResolveDesk Deployment & Configuration Guide

This guide documents the exact environment variables, build/startup commands, database setup, and production deployment configuration for **ResolveDesk** based on the implemented codebase.

---

## 1. Backend Environment Variables

Configured in `backend/.env` and loaded in [`backend/src/config/env.js`](../backend/src/config/env.js) (template: [`backend/.env.example`](../backend/.env.example)).

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `NODE_ENV` | Recommended | `development` | Runtime mode (`development`, `production`, `test`). In `production`, enables `trust proxy`, sets cookies to `Secure` + `SameSite=None`, switches Morgan to `combined`, disables Mongoose `autoIndex`, and enforces strict `JWT_SECRET` checks. |
| `PORT` | No | `5000` | HTTP port for the Express server (Render injects `PORT` automatically). |
| `MONGODB_URI` | **Yes** (non-test) | `""` | MongoDB / MongoDB Atlas connection string used by `connectDatabase()`. |
| `JWT_SECRET` | **Yes** | `""` (test fallback only) | Secret key for signing/verifying JWTs. In `production`, `validateEnv()` requires at least **32 characters** and rejects the `.env.example` placeholder. |
| `JWT_EXPIRES_IN` | No | `7d` | JWT token expiration passed to `jsonwebtoken` (`jwt.sign`). |
| `COOKIE_NAME` | No | `auth_token` | Name of the HTTP-only cookie storing the JWT. |
| `CSRF_COOKIE_NAME` | No | `csrf_token` | Name of the HTTP-only cookie storing the CSRF double-submit token. |
| `CORS_ORIGIN` | **Yes** (in prod) | `http://localhost:5173` (dev) / `[]` (prod) | Comma-separated list of allowed frontend origins (e.g., `https://your-app.vercel.app`). |
| `LOGIN_RATE_LIMIT_WINDOW_MS` | No | `900000` | Rate-limit window (ms) for `POST /api/v1/auth/login` (15 minutes). |
| `LOGIN_RATE_LIMIT_MAX` | No | `15` | Max login attempts per IP within the window. |
| `API_RATE_LIMIT_WINDOW_MS` | No | `900000` | Rate-limit window (ms) for all `/api/v1/*` routes (15 minutes). |
| `API_RATE_LIMIT_MAX` | No | `500` | Max API requests per IP within the window. |
| `ENABLE_ADMIN_BOOTSTRAP` | No | `false` | When `'true'`, `bootstrapAdminIfEnabled()` creates an initial admin on startup if `ADMIN_SEED_EMAIL` does not already exist. |
| `ADMIN_SEED_NAME` | No | `System Administrator` | Display name used by `seedAdmin.js` or startup bootstrap. |
| `ADMIN_SEED_EMAIL` | Conditional | `""` | Admin email used by `seedAdmin.js` (if `--email` omitted) or required when `ENABLE_ADMIN_BOOTSTRAP=true`. |
| `ADMIN_SEED_PASSWORD` | Conditional | `""` | Admin password (min 8 chars) used by `seedAdmin.js` (if `--password` omitted) or required when `ENABLE_ADMIN_BOOTSTRAP=true`. |

---

## 2. Frontend Environment Variables

Configured in `frontend/.env` (local) or Vercel Project Settings (production), read at build time by Vite in [`frontend/src/services/api.js`](../frontend/src/services/api.js) (template: [`frontend/.env.example`](../frontend/.env.example)).

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `VITE_API_BASE_URL` | **Yes** (cross-origin prod) | `http://localhost:5000/api/v1` (dev) / `/api/v1` (prod build) | Base URL for all Axios requests. Must point to your deployed backend `/api/v1` endpoint (e.g., `https://resolvedesk-api.onrender.com/api/v1`) when frontend and backend are hosted on different domains. |

> **Important:** Vite embeds `VITE_*` variables into the static bundle during `npm run build`. Changing `VITE_API_BASE_URL` on Vercel requires a **redeploy** so the new value is compiled into `dist/`.

---

## 3. Dependency Installation & Local Startup Commands

**Prerequisites:** Node.js `>= 20.0.0` (declared in `backend/package.json` `engines`) and a MongoDB Atlas URI.

### Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend (from project root)
cd ../frontend
npm install
```

### Configure Local Environment Files
```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your MONGODB_URI and JWT_SECRET

# Frontend
cp frontend/.env.example frontend/.env
```

### Run Backend & Frontend Locally
```bash
# Terminal 1 — Backend (watches src/server.js)
cd backend
npm run dev

# Terminal 2 — Frontend (Vite dev server on http://localhost:5173)
cd frontend
npm run dev
```

- Backend health check: `GET http://localhost:5000/api/v1/health`
- Frontend URL: `http://localhost:5173`

---

## 4. Seeding the First Administrator

Public registration (`POST /api/v1/auth/register`) always creates `'user'` accounts. Seed the first admin using [`backend/src/utils/seedAdmin.js`](../backend/src/utils/seedAdmin.js):

### Option A: CLI Arguments (Recommended)
Run `node` directly from `backend/` (recommended on Windows PowerShell so quoted names with spaces are not split by `npm`):
```bash
cd backend
node src/utils/seedAdmin.js --name="System Admin" --email="admin@helpdesk.local" --password="StrongPassword123!"
```

### Option B: Environment Variables
Set `ADMIN_SEED_NAME`, `ADMIN_SEED_EMAIL`, and `ADMIN_SEED_PASSWORD` in `backend/.env` (or Render Environment Variables) and run:
```bash
cd backend
npm run seed:admin
```

### Option C: One-Time Startup Bootstrap (Useful on PaaS without Shell Access)
1. Set `ENABLE_ADMIN_BOOTSTRAP=true`, `ADMIN_SEED_NAME`, `ADMIN_SEED_EMAIL`, and `ADMIN_SEED_PASSWORD` in your backend environment.
2. Start/deploy the backend; `bootstrapAdminIfEnabled()` in `src/server.js` creates the admin if missing.
3. Set `ENABLE_ADMIN_BOOTSTRAP=false` and remove `ADMIN_SEED_PASSWORD` afterward.

---

## 5. MongoDB Atlas Requirements

1. **Cluster & Database User**:
   - Create a MongoDB Atlas cluster (M0 or higher) and a database user under **Security → Database Access** with **Read and write to any database** (or `readWrite` on your target database, e.g., `support_ticket_db`).
   - Do **not** use your MongoDB Atlas web console login credentials in `MONGODB_URI`—use the Database Access user credentials.
2. **URI Formatting**:
   - Use the SRV connection string without angle brackets:
     `mongodb+srv://<dbUser>:<dbPassword>@<cluster>.mongodb.net/support_ticket_db?retryWrites=true&w=majority`
   - URL-encode any special characters in `<dbPassword>` (`@` → `%40`, `#` → `%23`, `$` → `%24`, `%` → `%25`, etc.).
3. **Network Access**:
   - Under **Security → Network Access**, allow your local IP for development and your backend host's egress IPs (or `0.0.0.0/0` when deploying to Render free/standard tiers that use dynamic outbound IPs, paired with strong database credentials).
4. **Indexes in Production**:
   - [`backend/src/config/database.js`](../backend/src/config/database.js) sets `autoIndex: !env.isProduction`. Ensure indexes exist in Atlas (e.g., run `seed:admin` or a non-production connection once, or create indexes from Mongoose schemas) so `users.email` uniqueness and query indexes are active.

---

## 6. Production CORS, Cookie, and CSRF Configuration

Because a Vercel frontend (`https://your-app.vercel.app`) and Render backend (`https://your-api.onrender.com`) run on **different origins**:

1. **Production CORS (`backend/src/app.js`)**:
   - `cors` is configured with `credentials: true`, `methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']`, and `allowedHeaders: ['Content-Type', 'X-CSRF-Token']`.
   - Set `CORS_ORIGIN` on the backend to the exact frontend URL **without a trailing slash** (e.g., `CORS_ORIGIN=https://resolvedesk.vercel.app`). Multiple origins can be comma-separated.
2. **Reverse Proxy Trust (`backend/src/app.js`)**:
   - When `NODE_ENV=production`, `app.set('trust proxy', 1)` is automatically enabled so rate limiting (`express-rate-limit`) and HTTPS detection work accurately behind Render's proxy.
3. **Cross-Origin Cookies (`backend/src/middleware/csrf.js`)**:
   - When `NODE_ENV=production`, `getCookieOptions()` automatically sets:
     - `httpOnly: true`
     - `secure: true` (requires HTTPS, provided by Render/Vercel)
     - `sameSite: 'none'` (required for cross-origin cookie transmission between Vercel and Render)
4. **CSRF Protection (`backend/src/middleware/csrf.js` & `frontend/src/services/api.js`)**:
   - State-changing authenticated requests (`POST`, `PUT`, `PATCH`, `DELETE`, including `/auth/logout`) require the `X-CSRF-Token` header to match the HTTP-only `csrf_token` cookie.
   - `frontend/src/services/api.js` reads `csrfToken` from JSON responses (`/auth/csrf-token`, `/auth/login`, `/auth/register`, `/auth/me`) in memory and sends `X-CSRF-Token` automatically with `withCredentials: true`.
   - **Browser note:** Strict third-party cookie blocking in some browsers can block cross-site cookies across unrelated domains (`vercel.app` ↔ `onrender.com`). For maximum browser compatibility in production, serve the frontend and backend under subdomains of the same apex domain (e.g., `app.yourdomain.com` and `api.yourdomain.com`) or proxy `/api/v1/*` through Vercel.

---

## 7. Recommended Hosting Setup

### Backend on Render (Web Service)
- **Root Directory**: `backend`
- **Runtime**: Node (`>= 20.0.0`)
- **Build Command**: `npm install`
- **Start Command**: `npm start` (runs `node src/server.js`)
- **Health Check Path**: `/api/v1/health`
- **Required Environment Variables**:
  - `NODE_ENV=production`
  - `MONGODB_URI=<your-atlas-srv-uri>`
  - `JWT_SECRET=<random-secret-at-least-32-chars>`
  - `CORS_ORIGIN=https://<your-vercel-project>.vercel.app`
  - *(Optional first deploy)* `ENABLE_ADMIN_BOOTSTRAP=true`, `ADMIN_SEED_NAME`, `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD` (disable after first boot)

### Frontend on Vercel
- **Root Directory**: `frontend`
- **Framework Preset**: Vite
- **Build Command**: `npm run build` (runs `vite build`)
- **Output Directory**: `dist`
- **SPA Routing**: Already configured via [`frontend/vercel.json`](../frontend/vercel.json) (`/(.*) -> /index.html`).
- **Required Environment Variables**:
  - `VITE_API_BASE_URL=https://<your-render-service>.onrender.com/api/v1`

---

## 8. Production Verification & Build Commands

```bash
# Backend syntax & test verification
cd backend
node --check src/server.js
npm test

# Frontend tests & production bundle build
cd ../frontend
npm test
npm run build
```

After deploying:
1. Verify `GET https://<your-render-service>.onrender.com/api/v1/health` returns `200 OK` with `environment: "production"`.
2. Open your Vercel URL, register a test user, log in as the seeded admin, and verify cookies (`auth_token`, `csrf_token`), ticket creation, comments, notifications, and dashboard charts work over HTTPS.
