# Database Design

The application uses **MongoDB** with **Mongoose ODM** across 5 normalized collections. Comments, activities, and notifications are stored in separate referenced collections rather than embedded inside `Ticket` documents to prevent unbounded document growth (16 MB BSON limit) and enable independent pagination and indexing.

## Collections

### 1. `users`
Stores registered standard users and seeded administrators.

| Field | Type | Constraints / Notes |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `name` | String | Required, trimmed, 2–80 chars |
| `email` | String | Required, unique, normalized lowercase |
| `password` | String | Required, bcrypt hash (12 rounds), `select: false` |
| `role` | String | Enum: `user`, `admin` (default: `user`) |
| `isActive` | Boolean | Default: `true`; inactive users cannot authenticate |
| `createdAt` | Date | Managed by Mongoose `timestamps` |
| `updatedAt` | Date | Managed by Mongoose `timestamps` |

**Indexes:**
- `{ email: 1 }` (`unique: true`) — Fast login lookup & duplicate prevention.
- `{ role: 1, isActive: 1 }` — Fast lookup of all active admins for notifications.

---

### 2. `tickets`
Stores support requests with soft-deletion and lifecycle timestamps.

| Field | Type | Constraints / Notes |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `title` | String | Required, trimmed, 3–150 chars |
| `description` | String | Required, trimmed, 5–5000 chars |
| `category` | String | Enum: `Technical Issue`, `Account Issue`, `Payment Issue`, `General Inquiry`, `Other` |
| `priority` | String | Enum: `Low`, `Medium`, `High`, `Critical` (default: `Medium`) |
| `status` | String | Enum: `Open`, `In Progress`, `Resolved`, `Closed` (default: `Open`) |
| `createdBy` | ObjectId (`User`) | Required reference to ticket owner |
| `isDeleted` | Boolean | Default: `false` (soft deletion flag) |
| `deletedAt` | Date | Nullable timestamp set on soft delete |
| `deletedBy` | ObjectId (`User`) | Nullable reference to actor who soft-deleted |
| `resolvedAt` | Date | Nullable timestamp set when moved to `Resolved`; cleared on reopen |
| `closedAt` | Date | Nullable timestamp set when moved to `Closed`; cleared on reopen |
| `createdAt` | Date | Managed by Mongoose `timestamps` |
| `updatedAt` | Date | Managed by Mongoose `timestamps` |

**Indexes:**
- `{ isDeleted: 1, createdBy: 1, createdAt: -1 }` — User ticket listing & dashboard aggregation.
- `{ isDeleted: 1, status: 1, priority: 1, category: 1, createdAt: -1 }` — Admin filtering, sorting, and aggregation.
- `{ isDeleted: 1, createdAt: -1 }` — Admin global recent tickets.

---

### 3. `comments`
Stores chronological conversation replies between ticket owners and admins.

| Field | Type | Constraints / Notes |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `ticket` | ObjectId (`Ticket`) | Required reference |
| `author` | ObjectId (`User`) | Required reference |
| `message` | String | Required, trimmed, 1–2000 chars |
| `createdAt` | Date | Managed by Mongoose `timestamps` |
| `updatedAt` | Date | Managed by Mongoose `timestamps` |

**Indexes:**
- `{ ticket: 1, createdAt: 1 }` — Chronological thread retrieval per ticket.

---

### 4. `activities`
Immutable audit log of domain events per ticket.

| Field | Type | Constraints / Notes |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `ticket` | ObjectId (`Ticket`) | Required reference |
| `actor` | ObjectId (`User`) | Required reference |
| `eventType` | String | Enum: `ticket.created`, `ticket.updated`, `ticket.statusChanged`, `ticket.priorityChanged`, `ticket.resolved`, `comment.added`, `ticket.deleted` |
| `description` | String | Human-readable event summary (max 500 chars) |
| `metadata` | Mixed | Structured event details (e.g., `previousStatus`, `newStatus`, `isReopened`) |
| `createdAt` | Date | Default `Date.now` |

**Indexes:**
- `{ ticket: 1, createdAt: 1 }` — Chronological timeline on ticket details.
- `{ createdAt: -1 }` — Recent global activity feed on Admin Dashboard.

---

### 5. `notifications`
Stores recipient-scoped in-app notifications triggered by domain events.

| Field | Type | Constraints / Notes |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `recipient` | ObjectId (`User`) | Required reference |
| `ticket` | ObjectId (`Ticket`) | Required reference |
| `activity` | ObjectId (`Activity`) | Optional reference to triggering activity |
| `type` | String | Event/notification type identifier |
| `title` | String | Short notification headline |
| `message` | String | Notification details |
| `isRead` | Boolean | Default: `false` |
| `readAt` | Date | Nullable timestamp set when marked read |
| `createdAt` | Date | Default `Date.now` |

**Indexes:**
- `{ recipient: 1, isRead: 1, createdAt: -1 }` — Unread counts & unread filtering per user.
- `{ recipient: 1, createdAt: -1 }` — Paginated notification inbox per user.
