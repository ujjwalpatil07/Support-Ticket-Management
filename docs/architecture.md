# System Architecture

## 1. High-Level Overview

ResolveDesk is a **modular monolithic** Support Ticket Management System built with a decoupled React + Vite single-page frontend and a Node.js + Express REST API backed by MongoDB Atlas (Mongoose ODM).

```
┌───────────────────────────┐        HTTPS / JSON + Cookies        ┌─────────────────────────────────────────┐
│   React 18 + Vite SPA     │  <────────────────────────────────>  │          Express.js REST API            │
│  Tailwind + Recharts UI   │       X-CSRF-Token + Auth Cookie     │     Routes -> Controllers -> Services   │
└───────────────────────────┘                                      └────────────────────┬────────────────────┘
                                                                                        │
                                                                   ┌────────────────────┴────────────────────┐
                                                                   ▼                                         ▼
                                                        ┌─────────────────────┐                 ┌────────────────────────┐
                                                        │   MongoDB Atlas     │                 │  Node.js EventEmitter  │
                                                        │ (Mongoose Models)   │                 │  (Activity & Notif     │
                                                        └─────────────────────┘                 │   Event Handlers)      │
                                                                                                └────────────────────────┘
```

## 2. Backend Architecture

The backend (`backend/src/`) follows strict separation of concerns across layers:

1. **Routes (`src/routes/`)**: Define URL paths, apply authentication/authorization middleware, and attach Zod request validators.
2. **Validators (`src/validators/`)**: Validate and sanitize request `body`, `query`, and `params` with Zod. Reject mass-assignment attempts via `.strict()` schemas.
3. **Controllers (`src/controllers/`)**: Extract validated data from `req`, invoke service methods, and return consistent JSON envelopes (`{ success, message?, data }`).
4. **Services (`src/services/`)**: Encapsulate all business rules, state transitions, ownership checks, MongoDB queries/aggregations, and domain event emissions.
5. **Models (`src/models/`)**: Define Mongoose schemas, field constraints, password hashing hooks, and query-aligned database indexes.
6. **Events (`src/events/`)**: Centralized `AppEventEmitter` and asynchronous-safe handlers that create `Activity` audit entries and targeted `Notification` records.
7. **Middleware (`src/middleware/`)**: Security headers (`helmet`), restricted CORS, rate limiting, cookie-based JWT verification (`authenticate`), RBAC (`authorizeRoles`), CSRF validation (`csrfProtection`), and centralized error handling.

## 3. Event-Driven Workflow

Domain actions emit structured events via `appEvents`:

- `ticket.created` -> Logs activity + notifies all active admins.
- `ticket.updated` -> Logs activity with changed field names.
- `ticket.statusChanged` -> Logs status change (and reopening metadata when reopened) + notifies ticket owner (except when transitioning to `Resolved`, preventing duplicate notifications).
- `ticket.resolved` -> Logs resolution activity + sends the single "Ticket Resolved" notification to the ticket owner.
- `ticket.priorityChanged` -> Logs priority change + notifies ticket owner.
- `comment.added` -> Logs comment activity + notifies active admins (when author is User) or ticket owner (when author is Admin).
- `ticket.deleted` -> Logs soft-deletion activity.

### Delivery Guarantee Note & Future Evolution
Node.js `EventEmitter` is **in-process** and does not provide durable delivery across process crashes or multi-instance horizontal scaling. In this implementation, handlers are wrapped in `Promise.allSettled` with isolated error logging so listener failures are captured and do not crash the process. For multi-node production scale, the modular `appEvents` boundary can be replaced with a **persistent MongoDB Outbox collection** processed by a background worker or message broker (e.g., BullMQ / RabbitMQ) without modifying controllers or route contracts.

## 4. Security Architecture

- **JWT in HTTP-only Cookies**: Prevents client-side JavaScript (XSS) from reading authentication tokens.
- **CSRF Protection**: Double-submit token validation (`csrf_token` HTTP-only cookie + `X-CSRF-Token` request header compared with `crypto.timingSafeEqual`) protects all cookie-authenticated state-changing requests (`POST`, `PATCH`, `DELETE`).
- **Role & Ownership Enforcement**: `req.user` is always derived from the verified JWT and re-loaded from MongoDB to verify `isActive: true`. Frontend role checks only control UI routing; backend services enforce all ownership and RBAC boundaries.
- **Mass Assignment & Protected Fields**: Public registration hardcodes `role: 'user'`. Ticket `PATCH` schemas disallow `status`, `priority`, `createdBy`, and `isDeleted`.
- **Rate Limiting & Safe Errors**: Login attempts are strictly rate-limited; API error responses never leak stack traces or database internals.
