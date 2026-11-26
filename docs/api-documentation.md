# REST API Documentation

**Base URL:** `http://localhost:5000/api/v1`

## Authentication & CSRF

- Authentication uses **HTTP-only JWT cookies** (`auth_token`).
- State-changing requests (`POST`, `PATCH`, `DELETE`) when authenticated via cookie require the `X-CSRF-Token` header matching the `csrf_token` cookie.
- `csrfToken` is returned in the response payload of `GET /auth/csrf-token`, `POST /auth/register`, `POST /auth/login`, and `GET /auth/me`.

---

## Health Check

### `GET /health`
Returns service health status.
- **Response `200`:** `{ "success": true, "data": { "status": "ok", "environment": "development", "timestamp": "..." } }`

---

## Authentication Endpoints

### `GET /auth/csrf-token`
Issues or returns the current CSRF token and sets the `csrf_token` cookie.

### `POST /auth/register`
Registers a new user (role is always forced to `user`).
- **Body:** `{ "name": "Alice", "email": "alice@example.com", "password": "Password123" }`
- **Response `201`:** `{ "success": true, "message": "Registration successful", "data": { "user": { ... }, "csrfToken": "..." } }`
- **Errors:** `400` validation error, `409` duplicate email.

### `POST /auth/login`
Authenticates an active user or admin (rate-limited).
- **Body:** `{ "email": "alice@example.com", "password": "Password123" }`
- **Response `200`:** `{ "success": true, "message": "Login successful", "data": { "user": { ... }, "csrfToken": "..." } }`
- **Errors:** `401` invalid credentials, `403` inactive account, `429` rate limited.

### `POST /auth/logout`
Clears the authentication cookie. Requires `X-CSRF-Token`.
- **Response `200`:** `{ "success": true, "message": "Logout successful" }`

### `GET /auth/me`
Returns the currently authenticated user and CSRF token.
- **Auth:** Required (`user` or `admin`)
- **Response `200`:** `{ "success": true, "data": { "user": { ... }, "csrfToken": "..." } }`

---

## Ticket Endpoints

### `POST /tickets`
Creates a new support ticket (default `status: "Open"`, default `priority: "Medium"`).
- **Auth:** Required (`user` or `admin`) + `X-CSRF-Token`
- **Body:** `{ "title": "...", "description": "...", "category": "Technical Issue", "priority": "High" }`
- **Response `201`:** `{ "success": true, "data": { "ticket": { ... } } }`

### `GET /tickets`
Lists non-deleted tickets. Regular users receive only their own tickets; admins receive all non-deleted tickets.
- **Auth:** Required
- **Query Params:** `page` (default 1), `limit` (default 10, max 100), `search`, `status`, `priority`, `category`, `sortBy` (`createdAt`, `updatedAt`, `priority`, `status`, `title`), `sortOrder` (`asc`, `desc`).
- **Response `200`:** `{ "success": true, "data": { "tickets": [...], "pagination": { "page": 1, "limit": 10, "total": 25, "totalPages": 3, "hasNextPage": true, "hasPrevPage": false } } }`

### `GET /tickets/:id`
Retrieves a single non-deleted ticket (owner or admin only).
- **Auth:** Required
- **Errors:** `400` invalid ID, `403` forbidden, `404` not found or soft-deleted.

### `PATCH /tickets/:id`
Updates `title`, `description`, or `category`. Regular users may only update their own tickets while `status === "Open"`.
- **Auth:** Required + `X-CSRF-Token`
- **Body:** `{ "title"?: "...", "description"?: "...", "category"?: "..." }`
- **Errors:** `400` invalid fields or ticket not `Open` (for user), `403` forbidden, `404` not found.

### `DELETE /tickets/:id`
Soft-deletes a ticket (`isDeleted: true`, `deletedAt`, `deletedBy`). Regular users may only soft-delete their own tickets while `status === "Open"`.
- **Auth:** Required + `X-CSRF-Token`
- **Response `200`:** `{ "success": true, "message": "Ticket deleted successfully", "data": { "ticketId": "..." } }`

---

## Admin Ticket Operations

### `PATCH /admin/tickets/:id/status`
Transitions ticket status using validated lifecycle rules (`Open -> In Progress`, `In Progress -> Open | Resolved`, `Resolved -> Closed | In Progress`, `Closed -> Open`).
- **Auth:** Required (`admin` only) + `X-CSRF-Token`
- **Body:** `{ "status": "In Progress" }`
- **Response `200`:** `{ "success": true, "data": { "ticket": { ... } } }`

### `PATCH /admin/tickets/:id/priority`
Updates ticket priority (`Low`, `Medium`, `High`, `Critical`).
- **Auth:** Required (`admin` only) + `X-CSRF-Token`
- **Body:** `{ "priority": "Critical" }`
- **Response `200`:** `{ "success": true, "data": { "ticket": { ... } } }`

---

## Comments & Activity Endpoints

### `POST /tickets/:ticketId/comments`
Adds a comment to a ticket (owner or admin only).
- **Auth:** Required + `X-CSRF-Token`
- **Body:** `{ "message": "We are checking this issue." }`
- **Response `201`:** `{ "success": true, "data": { "comment": { ... } } }`

### `GET /tickets/:ticketId/comments`
Lists chronological comments for a ticket (owner or admin only).
- **Auth:** Required
- **Response `200`:** `{ "success": true, "data": { "comments": [...] } }`

### `GET /tickets/:id/activities`
Lists chronological activity audit history for a ticket (owner or admin only).
- **Auth:** Required
- **Response `200`:** `{ "success": true, "data": { "activities": [...] } }`

---

## Notification Endpoints

### `GET /notifications`
Lists paginated notifications for the authenticated user.
- **Auth:** Required
- **Query Params:** `page`, `limit`, `unreadOnly` (`true` | `false`)
- **Response `200`:** `{ "success": true, "data": { "notifications": [...], "unreadCount": 3, "pagination": { ... } } }`

### `GET /notifications/unread-count`
Returns unread notification count for the authenticated user.
- **Auth:** Required
- **Response `200`:** `{ "success": true, "data": { "unreadCount": 3 } }`

### `PATCH /notifications/:id/read`
Marks a specific notification as read (recipient only).
- **Auth:** Required + `X-CSRF-Token`

### `PATCH /notifications/read-all`
Marks all unread notifications for the authenticated user as read.
- **Auth:** Required + `X-CSRF-Token`

---

## Dashboard Endpoints

### `GET /dashboard/stats`
Uses MongoDB aggregation (`$facet`) to compute role-specific ticket statistics, distributions, and recent items.
- **Auth:** Required
- **Response `200`:** `{ "success": true, "data": { "totalTickets": 12, "openTickets": 4, "inProgressTickets": 3, "resolvedTickets": 3, "closedTickets": 2, "statusDistribution": [...], "priorityDistribution": [...], "recentTickets": [...], "recentActivities"?: [...] } }`
