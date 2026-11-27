# ResolveDesk — Support Ticket Management System

A full-stack, production-quality Mini Helpdesk & Support Ticket Management System built with **Node.js, Express, MongoDB (Mongoose), React, Vite, and Tailwind CSS**.

---

## Live Demo

**ResolveDesk – Support Ticket Management System**

- **Live Application:** https://support-ticket-management-frontend-one.vercel.app
- **Backend API:** https://support-ticket-management-5fzs.onrender.com
- **GitHub Repository:** https://github.com/ujjwalpatil07/Support-Ticket-Management

### Demo Access

- **Customer/User:** Register directly through the application.
## Demo Credentials

The application supports two roles: Customer and Admin.

### Customer Account
- Register directly through the application.
- Registration is open to everyone.
- New registrations automatically receive the Customer role.

### Admin Account

Use the following credentials to explore the Admin Dashboard and administrative features.

- **Login URL:** https://support-ticket-management-frontend-one.vercel.app/login
- **Email:** `admin@helpdesk.local`
- **Password:** `Admin@helpdesk.123`

**Note:** Admin accounts are provisioned securely and cannot be created through public registration.

## Key Features

- **Secure Authentication & RBAC**:
  - Public user registration (role forced to `user`), login, logout, and session restoration (`/auth/me`).
  - Passwords hashed with `bcryptjs` (12 salt rounds); JWT stored in HTTP-only cookies.
  - Double-submit CSRF protection (`X-CSRF-Token` header + HTTP-only CSRF cookie) on cookie-authenticated mutations.
  - Rate limiting on login and API endpoints, Helmet security headers, strict CORS, and Zod request validation.
  - Secure admin provisioning via CLI seed script (`npm run seed:admin`) or explicit bootstrap env toggle.
- **Ticket Lifecycle & Business Rules**:
  - Users can create tickets, view/search/filter/sort/paginate their own tickets, and edit or soft-delete tickets only while `Open`.
  - Admins view all non-deleted tickets, update priorities (`Low`, `Medium`, `High`, `Critical`), and manage status transitions (`Open` -> `In Progress` -> `Resolved` -> `Closed`, with reopening support).
  - Soft deletion (`isDeleted`, `deletedAt`, `deletedBy`) preserves auditability and excludes deleted records from normal queries.
- **Comments & Event-Driven Architecture**:
  - Chronological comments between ticket owners and admins.
  - Node.js `EventEmitter` workflow handling `ticket.created`, `ticket.updated`, `ticket.statusChanged`, `ticket.priorityChanged`, `ticket.resolved`, `comment.added`, and `ticket.deleted`.
  - Automatic immutable `Activity` audit timeline and targeted `Notification` delivery without duplicate resolution alerts.
- **Role-Specific Dashboards & SaaS UI**:
  - MongoDB `$facet` aggregation pipelines power user and admin KPI cards and Recharts visualizations.
  - Responsive layout with collapsible sidebar, breadcrumbs, notification bell dropdown, confirmation modals, loading skeletons, and empty/error states.

---

## Technology Stack

- **Frontend**: React 18, Vite, JavaScript (ES6+), React Router DOM, Axios, Tailwind CSS, Recharts, Lucide React
- **Backend**: Node.js (ES Modules), Express.js, Mongoose ODM, Zod, JWT (`jsonwebtoken`), `bcryptjs`, `helmet`, `cors`, `cookie-parser`, `express-rate-limit`, `morgan`, `dotenv`
- **Database**: MongoDB Atlas
- **Testing**: Jest, Supertest, `mongodb-memory-server` (backend); Vitest, Testing Library (frontend)

---

## Folder Structure

```text
support-ticket-management/
├── backend/
│   ├── src/
│   │   ├── config/         # Environment & MongoDB connection
│   │   ├── controllers/    # HTTP request/response handlers
│   │   ├── events/         # EventEmitter, event types, async-safe listeners
│   │   ├── middleware/     # Auth, RBAC, CSRF, Zod validation, error handling
│   │   ├── models/         # Mongoose schemas (User, Ticket, Comment, Activity, Notification)
│   │   ├── routes/         # Modular Express v1 routes
│   │   ├── services/       # Business logic & MongoDB aggregations
│   │   ├── utils/          # Constants, ApiError, asyncHandler, seedAdmin CLI
│   │   ├── validators/     # Strict Zod schemas
│   │   ├── app.js          # Express application factory
│   │   └── server.js       # Entry point & graceful shutdown
│   ├── tests/              # Jest + Supertest + mongodb-memory-server test suite
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI (common, dashboard, tickets, comments, notifications)
│   │   ├── context/        # AuthContext & ToastContext
│   │   ├── hooks/          # useAuth, useToast
│   │   ├── layouts/        # AppLayout (sidebar, header, breadcrumbs)
│   │   ├── pages/          # Auth, User, Admin, and Shared pages
│   │   ├── routes/         # ProtectedRoute & GuestRoute guards
│   │   ├── services/       # Centralized Axios instance & API services
│   │   ├── tests/          # Vitest + React Testing Library suite
│   │   ├── utils/          # Constants & formatters
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
├── docs/
│   ├── api-documentation.md
│   ├── architecture.md
│   ├── database-design.md
│   └── implementation-progress.md
├── postman/
│   └── support-ticket-api.json
└── README.md
```

---

## Local Setup & Installation

### Prerequisites
- Node.js `>= 20.0.0`
- MongoDB Atlas cluster (or local MongoDB instance)

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env` with your MongoDB Atlas URI and strong `JWT_SECRET`:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/support_ticket_db?retryWrites=true&w=majority
JWT_SECRET=your_random_secret_at_least_32_characters
JWT_EXPIRES_IN=7d
COOKIE_NAME=auth_token
CSRF_COOKIE_NAME=csrf_token
CORS_ORIGIN=http://localhost:5173
```

### 2. Provision an Admin Account

Public registration always creates `user` accounts. Seed an admin securely using the CLI script (run `node` directly on Windows PowerShell so spaces in `--name` are preserved):

```bash
cd backend
node src/utils/seedAdmin.js --name="System Admin" --email="admin@helpdesk.local" --password="StrongPassword123!"
```

Alternatively, set `ADMIN_SEED_EMAIL` and `ADMIN_SEED_PASSWORD` in `backend/.env` and run `npm run seed:admin`.

### 3. Start the Backend Server

```bash
cd backend
npm run dev
```

API will be available at `http://localhost:5000/api/v1` (Health check: `GET /api/v1/health`).

### 4. Frontend Setup & Startup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend will run at `http://localhost:5173`.

---

## Testing Commands

### Backend Automated Tests (Jest + Supertest + MongoDB Memory Server)
```bash
cd backend
npm test
```

### Frontend Automated Tests & Production Build
```bash
cd frontend
npm test
npm run build
```

---

## Documentation & Postman Collection

- **Deployment Guide**: [docs/deployment.md](docs/deployment.md)
- **Architecture & Event System**: [docs/architecture.md](docs/architecture.md)
- **Database Design & Indexes**: [docs/database-design.md](docs/database-design.md)
- **REST API Reference**: [docs/api-documentation.md](docs/api-documentation.md)
- **Postman Collection**: Import `postman/support-ticket-api.json` into Postman. Set `baseUrl` (default `http://localhost:5000/api/v1`). Login/register test scripts automatically capture `csrfToken` into collection variables.

---

## Deployment Guide

### Database (MongoDB Atlas)
1. Create a free/shared M0 cluster in MongoDB Atlas.
2. Create a database user with read/write access and whitelist your backend host IP (or configure VPC peering / `0.0.0.0/0` with strong credentials for PaaS hosts).
3. Copy the SRV connection string into `MONGODB_URI`.

### Backend (Render / Google Cloud Run)
1. Deploy the `backend/` directory (`npm install` / `npm start`).
2. Set environment variables:
   - `NODE_ENV=production`
   - `PORT=5000` (or platform-injected port)
   - `MONGODB_URI=<your-atlas-uri>`
   - `JWT_SECRET=<strong-32+-char-secret>`
   - `CORS_ORIGIN=https://<your-vercel-domain>.vercel.app`
3. Note: In `production` mode, cookies automatically use `secure: true` and `sameSite: 'none'` to support cross-origin HTTPS requests from the frontend, and `app.set('trust proxy', 1)` is enabled for reverse proxies.
4. Run `npm run seed:admin` once against your production database (or enable `ENABLE_ADMIN_BOOTSTRAP=true` for initial startup, then disable it).

### Frontend (Vercel)
1. Import the repository into Vercel and set the **Root Directory** to `frontend`.
2. Build command: `npm run build` | Output directory: `dist`.
3. Add environment variable:
   - `VITE_API_BASE_URL=https://<your-backend-domain>/api/v1`
4. Configure SPA rewrite (`vercel.json` or Vercel project settings) so client routes resolve to `/index.html`.
