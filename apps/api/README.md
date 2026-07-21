# @app/api

The Express + MongoDB API for **Shatha Events**, a full-stack event/vendor booking platform (`apps/web` is the Next.js frontend, `packages/shared` holds the Zod schemas and types both sides import from).

## Stack

- **Express 4** (ESM, TypeScript, strict mode) with a modules-per-domain layout
- **MongoDB / Mongoose 8** for persistence
- **Zod** (via `@app/shared`) for request validation — the same schemas the frontend uses to type its forms
- **JWT access tokens + rotating httpOnly refresh-token cookies** for auth
- **Socket.IO** for realtime notification/booking-status push
- **Pino** for structured logging, **Vitest + Supertest** for tests

## Getting started

```bash
# from the repo root
pnpm install
cp apps/api/.env.example apps/api/.env   # then fill in real secrets
pnpm --filter @app/api seed              # optional: populate sample data
pnpm --filter @app/api dev               # or: pnpm dev (runs api + web together)
```

The server listens on `PORT` (default `4000`). `GET /api/health` is a good smoke check.

### Environment variables

See `.env.example` for the full list with explanations. In short:

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | Mongo connection string |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | ≥32 char secrets, must differ |
| `ACCESS_TOKEN_TTL` / `REFRESH_TOKEN_TTL_DAYS` | Token lifetimes |
| `CLIENT_URL` | Frontend origin — drives CORS and the refresh cookie scope |
| `STORAGE_DRIVER` | `local` (writes to `apps/api/uploads`, served at `/uploads`) or `cloudinary` |
| `EMAIL_DRIVER` | `console` (logs + appends to `.email-log.txt`) or `resend` |

All of this is validated at startup by `src/config/env.ts` (Zod) — the process exits immediately with a readable error instead of failing later mid-request.

## Project layout

```
src/
  config/       env.ts (validated process.env), db.ts (mongoose connect/disconnect)
  lib/          cross-cutting helpers: AppError, JWT, logger, email + storage drivers,
                token hashing, pagination, asyncHandler
  middleware/   auth, role guard, zod validate, rate limiting, multer upload, error handler
  models/       Mongoose schemas (User, Service, Booking, Task, Notification, RefreshToken)
  modules/      one folder per domain, each with *.service.ts (business logic + queries),
                *.controller.ts (thin HTTP glue), *.routes.ts (Express Router + middleware wiring)
    auth/ users/ services/ bookings/ tasks/ notifications/ uploads/
  app.ts        Express app: middleware stack + route mounting (no DB/socket side effects —
                this is what test/app.test.ts and the integration suite import directly)
  server.ts     connects to Mongo, boots the HTTP server + Socket.IO, handles graceful shutdown
  socket.ts     Socket.IO auth handshake + per-user rooms + emitToUser() helper
seed.ts         populates a demo dataset (1 admin, 5 vendors w/ services, 3 clients, bookings,
                tasks, notifications)
test/           Vitest suite (see Testing below)
```

Each module's `service.ts` is the only place that touches Mongoose models directly; controllers stay thin (parse `req`, call the service, shape the response) and never contain business rules.

## Auth model

- **Access token**: short-lived JWT (`ACCESS_TOKEN_TTL`, default 15m), sent as `Authorization: Bearer <token>` on every authenticated request, verified by `middleware/auth.ts`. Never persisted — the frontend keeps it in memory only.
- **Refresh token**: opaque random token, stored **hashed** (SHA-256) in the `RefreshToken` collection, delivered as an `httpOnly`, `sameSite=lax` cookie scoped to `/api/auth`. `POST /api/auth/refresh` rotates it (the old one is revoked the moment a new one is issued — reuse of a stale token is rejected). `POST /api/auth/logout` revokes it and clears the cookie.
- Password reset works the same way: a random token is emailed, only its hash is stored, and it expires after 1 hour. Resetting a password revokes every outstanding session for that user.
- Roles are `client`, `vendor`, `admin`. Only `client`/`vendor` can self-register (`SignupRoleSchema`) — admins are seeded or promoted directly in the database.

## Realtime

`src/socket.ts` authenticates each Socket.IO connection with the same access token used for REST calls (`socket.handshake.auth.token`) and joins the socket to a `user:<id>` room. Two events are pushed:

- `notification:new` — `{ notification: NotificationDto }`, whenever `modules/notifications/notifications.service.ts#createNotification` is called (new booking → admins, status change → client, task assignment → assignee)
- `booking:status-changed` — `{ bookingId, status }`, whenever a booking's status changes

These event names and payload shapes are matched exactly to what `apps/web/src/lib/socket-client.ts` expects.

## File uploads

`middleware/upload.ts` buffers images (JPEG/PNG/WEBP/GIF, ≤5MB) in memory via multer; `lib/storage.ts` then persists them through whichever driver `STORAGE_DRIVER` selects:

- **local** — written to `apps/api/uploads/`, served back out at `/uploads/*` by `app.ts`, returned as an absolute URL built from the incoming request's host
- **cloudinary** — uploaded via a signed request to Cloudinary's plain REST API (no SDK dependency, same "raw `fetch`" approach as the Resend email driver), returns Cloudinary's `secure_url`

Three upload surfaces use this: `POST /api/users/me/avatar`, `POST /api/services/:id/images`, and the generic `POST /api/uploads`.

## API surface

All routes are mounted under `/api`. Request/response bodies are the DTOs and input schemas from `@app/shared` (`packages/shared/src/schemas/*`).

**Auth** (`/api/auth`)
| Route | Auth | Notes |
|---|---|---|
| `POST /signup` | — | client/vendor only |
| `POST /login` | — | |
| `POST /refresh` | refresh cookie | rotates the cookie |
| `POST /logout` | refresh cookie | revokes + clears the cookie |
| `POST /forgot-password` | — | always 200, never reveals whether the email exists |
| `POST /reset-password` | — | revokes all sessions on success |

**Users** (`/api/users`, all require auth)
| Route | Notes |
|---|---|
| `GET /me`, `PATCH /me`, `PATCH /me/password`, `PATCH /me/settings` | self-service profile |
| `POST /me/avatar` | multipart, field `avatar` |
| `GET /?role=vendor` | open to any signed-in user (vendor directory); any other slice requires `admin` |
| `GET /:id` | `admin` only |

**Services** (`/api/services`)
| Route | Auth | Notes |
|---|---|---|
| `GET /`, `GET /:id` | public | inactive services are hidden unless you're `admin` or the owning vendor |
| `POST /` | `vendor`/`admin` | |
| `PATCH /:id`, `DELETE /:id` | `vendor` (own only) / `admin` | |
| `POST /:id/images` | `vendor` (own only) / `admin` | multipart, field `images` (up to 5) |

**Bookings** (`/api/bookings`, all require auth)
| Route | Role | Notes |
|---|---|---|
| `POST /` | `client` | snapshots service titles at booking time |
| `GET /my` | `client` | own bookings |
| `GET /vendor` | `vendor` | bookings containing any of their services |
| `GET /` | `admin` | all bookings |
| `GET /:id` | any | authorized per-role (owner client / involved vendor / admin) |
| `PATCH /:id/status` | `admin` (any valid transition) or `client` (self-cancel only) | transitions enforced by `BOOKING_STATUS_TRANSITIONS` from `@app/shared` |
| `POST /:id/tasks`, `GET /:id/tasks` | `admin` | nested, nudges `modules/tasks` |

**Tasks** (`/api/tasks`, all require auth)
| Route | Notes |
|---|---|
| `GET /mine` | tasks assigned to the current user |
| `PATCH /:id/status` | assignee or `admin` |

**Notifications** (`/api/notifications`, all require auth)
| Route | Notes |
|---|---|
| `GET /?unreadOnly=` | paginated |
| `GET /unread-count` | |
| `PATCH /read-all`, `PATCH /:id/read` | |

**Uploads**
| Route | Notes |
|---|---|
| `POST /api/uploads` | auth required, field `file` — generic "give me a URL for this file" endpoint |

Every error response is `{ code, message, details? }` (`ApiErrorSchema`), produced centrally by `middleware/error-handler.ts` — Mongo duplicate-key/cast/validation errors and Multer errors are translated into the same shape; anything unexpected is logged in full server-side but masked as a generic 500 to the client.

## Testing

```bash
pnpm --filter @app/api test
```

- `test/lib/*`, `test/middleware/*` — pure unit tests (AppError, token hashing, pagination math, the `validate` middleware, the global error handler), no database required.
- `test/app.test.ts` — Supertest against the real `app` for paths that are rejected by validation/auth middleware before ever touching Mongo (404s, bad payloads, missing/invalid tokens) — also runs with no database.
- `test/integration/booking-flow.test.ts` — full HTTP lifecycle against a **real MongoDB** (signup → duplicate rejection → refresh rotation/reuse-rejection → service creation → booking creation → role-scoped visibility → status transitions incl. an invalid one → notification delivery → task assignment/completion → self-cancellation). It probes `MONGODB_URI` with a 1.5s timeout first and **skips itself** (not fails) if nothing answers, so `pnpm test` stays fast and green without a local Mongo. Point `MONGODB_URI` (see `.env.example`, or `vitest.config.ts`'s defaults) at a scratch database — the suite wipes its own data before and after.

## Seeding

```bash
pnpm --filter @app/api seed
```

Wipes every collection and recreates: one admin (`admin@shatha.events`), five vendors (one per `ServiceCategory`, each with one active service), three clients, three bookings spanning different statuses, a couple of tasks, and a few notifications. Every seeded account shares the password `Password123!` (printed again at the end of the script for convenience).
