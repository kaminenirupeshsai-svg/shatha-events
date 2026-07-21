# @app/web — Shatha Events frontend

The client-facing half of the Shatha Events monorepo: a Next.js 14 (App Router) + TypeScript
frontend for an event-planning booking platform. Clients browse vendor services and submit
booking requests; vendors manage their own service listings; admins run the booking pipeline
end to end. This app talks to `apps/api` (Express + Socket.io on port 4000) and shares every
request/response shape with it via `packages/shared`.

## Stack

- **Next.js 14** App Router, TypeScript (strict)
- **Tailwind CSS**, theme extended with CSS variables for the approved light/dark palette
  (`class` strategy via `next-themes`)
- **Framer Motion** for deliberate, reduced-motion-aware animation
- **React Hook Form** + `@hookform/resolvers/zod`, validating with the Zod schemas imported
  directly from `@app/shared` — no request/response shape is ever redefined here
- **TanStack React Query v5** for all server state (queries, mutations, cache invalidation)
- **Radix UI primitives** (`dialog`, `select`, `dropdown-menu`, `tabs`, `avatar`, `label`),
  hand-styled to match the design system — plus `sonner` for toasts
- **Recharts** for the admin dashboard's status donut and bookings-over-time chart
- **socket.io-client** for real-time booking/notification updates
- **zustand** for the in-memory auth store
- **Vitest** + **Testing Library** for a light, intentionally minimal test suite

## Getting started

```bash
# from the monorepo root
pnpm install

# copy the env template and fill in values (defaults match a local apps/api)
cp apps/web/.env.local.example apps/web/.env.local

# run just the frontend
pnpm --filter @app/web dev

# or run api + web together (see root package.json)
pnpm dev
```

The app runs on **http://localhost:3000** and expects the API on **http://localhost:4000**.

### Environment variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL for REST calls (default `http://localhost:4000`) |
| `NEXT_PUBLIC_SOCKET_URL` | Base URL for the Socket.io connection (default `http://localhost:4000`) |

### Scripts

| Script | What it does |
|---|---|
| `pnpm --filter @app/web dev` | Start the Next.js dev server on port 3000 |
| `pnpm --filter @app/web build` | Production build |
| `pnpm --filter @app/web start` | Serve the production build |
| `pnpm --filter @app/web typecheck` | `tsc --noEmit` |
| `pnpm --filter @app/web lint` | `next lint` |
| `pnpm --filter @app/web test` | `vitest run` |

## Directory guide

```
src/
├── app/                  # App Router routes, grouped by (marketing) / (auth) / (app)
├── components/
│   ├── ui/               # Radix-backed primitives styled from the design tokens
│   ├── charts/            # Recharts wrappers (StatCard, StatusPieChart, BookingsOverTimeChart)
│   └── shared/            # Navbar, Footer, Sidebar, Topbar, ServiceCard, BookingCard, StatusPill…
├── features/              # Domain hooks (React Query) + the form components that use them
│   ├── auth/
│   ├── services/
│   ├── bookings/
│   ├── notifications/
│   └── vendors/
├── lib/                   # api-client, auth-store, socket-client, query-client, endpoints, utils
└── test/                  # Vitest + Testing Library specs (see below)
```

## Design system fidelity

Every color, font, and status-tone mapping in this app is read from
`packages/shared/src/design-tokens.ts` — never hand-duplicated:

- `src/app/globals.css` defines two CSS-variable blocks (`:root` and `.dark`) that are a
  direct, 1:1 hex→RGB-triplet transcription of `colors` and `darkColors`. `tailwind.config.ts`
  exposes them as Tailwind color utilities (`bg-emerald`, `text-ink-soft`, etc.).
- `src/components/shared/status-pill.tsx` mirrors `statusToneMap` exactly, including the
  darker amber text override for `reviewed` that the spec calls out for contrast.
- Charts need real color strings (SVG `fill`, not Tailwind classes), so
  `src/lib/chart-colors.ts` imports `colors`/`darkColors` directly from `@app/shared` rather
  than re-reading CSS variables — same source of truth, different consumption path.
- Fonts (Fraunces / Karla / Space Grotesk) are loaded via `next/font/google` in
  `src/app/layout.tsx`, which self-hosts and subsets at build time — the modern equivalent of
  manually vendoring WOFF2 files with `font-display: swap`.

## Auth model

- The access token and current user live **only in memory** (`src/lib/auth-store.ts`, a
  zustand store) — never `localStorage`/`sessionStorage`.
- The refresh token is an httpOnly cookie the browser manages automatically; every API call
  goes through `src/lib/api-client.ts`, which always sends `credentials: 'include'`.
- On a 401, the API client transparently calls `POST /api/auth/refresh` once, retries the
  original request, and only redirects to `/login` if the refresh itself fails. Concurrent
  401s are coalesced into a single refresh call.
- On first load (`src/app/providers.tsx`), the app silently attempts a refresh before
  rendering protected content — this is what makes "stay signed in across a hard refresh"
  work despite the access token never touching disk.
- `src/middleware.ts` is a **UX-level** guard only: it checks for a non-httpOnly `hasSession=1`
  hint cookie (set/cleared client-side alongside the real session) to bounce obviously-signed-
  out visitors away from `(app)/*` routes before a page even renders. It carries no authority —
  the API is the real authorization boundary. (See deviation #0 below for why it lives in
  `src/` rather than the project root.)

## Notable deviations / interpretations

The spec was extremely detailed but a few points required a judgment call. Documenting them
here rather than silently picking one:

0. **`middleware.ts` lives at `src/middleware.ts`, not `apps/web/middleware.ts`.** The spec's
   directory tree shows it at the project root, but this app uses a `src/` layout for
   everything else (`src/app`, `src/components`, ...), and Next.js 14 only auto-detects
   middleware next to the `app` directory's parent — i.e. inside `src/` when a `src/` layout is
   in use. This wasn't a guess: a root-level `middleware.ts` built successfully but silently
   produced **no** `ƒ Middleware` line in the build output, meaning the route guard would never
   have run. Moving it to `src/middleware.ts` made it show up in the build (`ƒ Middleware  26.6 kB`)
   as expected. Caught by actually running `next build`, not just typecheck/lint.
1. **`/services` lives under the `(app)` route group**, exactly as the given directory tree
   specifies — there's no separate public/marketing copy of it. In practice this means an
   anonymous visitor clicking "Browse services" from the marketing nav is redirected to
   `/login?next=/services` and lands on the services grid immediately after signing in, rather
   than browsing anonymously. This keeps a single implementation of the (fairly complex)
   search/filter/sort/paginate/role-aware grid instead of forking it into a public and an
   authenticated version. The dashboard shell's `Sidebar` labels this route "Browse services"
   for clients and "My services" for vendors, since the same page renders a management view
   (create/edit/delete) when the signed-in user's role is `vendor`.
2. **`/services` also doubles as the vendor's service-management screen** and
   `/admin/services` as the admin's full CRUD table — both reuse `features/services/service-form.tsx`
   for create/edit so the validation and field set never drifts between the two.
3. **Cancelling a booking reuses the status-update endpoint** (`PATCH /api/bookings/:id/status`
   with `{ status: 'cancelled' }`) rather than a separate cancel endpoint, since
   `UpdateBookingStatusInputSchema` already models this and `BOOKING_STATUS_TRANSITIONS` from
   `@app/shared` already allows `cancelled` as a valid forward transition from every
   non-terminal state.
4. **Endpoint paths were inferred**, not given. `apps/api` was still an empty skeleton
   (module folders with no route files) at the time this frontend was built, since it's being
   developed in parallel. Every path this app calls is centralized in **`src/lib/endpoints.ts`**
   with a comment explaining the inference — update that one file if the real API differs.
   Assumptions made:
   - `GET/POST /api/auth/*` for signup/login/refresh/logout/forgot-password/reset-password
   - `GET/PATCH /api/users/me`, `PATCH /api/users/me/password`, `PATCH /api/users/me/settings`,
     `POST /api/users/me/avatar` (multipart)
   - `GET /api/users?role=vendor` for the admin vendor directory (no dedicated vendors module
     exists in `apps/api/src/modules`, only `users`)
   - `GET /api/bookings/my` (client), `GET /api/bookings/vendor` (vendor, bookings referencing
     their services), `GET /api/bookings` (admin, all bookings) — three read paths over the
     same `BookingDto` shape
   - `PATCH /api/bookings/:id/status` for every status transition, admin- and client-initiated
   - Standard `GET/POST/PATCH/DELETE /api/services[/:id]` and
     `GET/PATCH /api/notifications[...]`
5. **No dedicated stats/analytics endpoint was assumed.** The admin dashboard's charts
   (`StatusPieChart`, `BookingsOverTimeChart`) fetch up to 100 recent bookings via the existing
   `GET /api/bookings` and bucket them client-side (by status, and by ISO week of `createdAt`
   for the last 8 weeks) rather than inventing a `/api/bookings/stats` route not backed by any
   shared schema. If the real dataset is large, swap this for a real aggregation endpoint later.
6. **Charts follow the project's `dataviz` skill.** The status donut uses the exact
   `statusToneMap` colors (a reserved status palette, not a freely chosen categorical one) with
   a legend, center total, values-lead tooltips, and rounded/gapped segments. The single-series
   time chart skips a legend by design (a single series doesn't need one — the card title
   already says what's plotted) and uses a 2px emerald line with a ~15–18% opacity area wash.
7. **`isActive` toggle for services** is handled as local component state in
   `features/services/service-form.tsx` rather than a registered RHF field, because
   `CreateServiceInputSchema`'s Zod object silently strips unknown keys on parse — trying to
   thread it through the resolver's validated output would have quietly dropped it.
8. **Booking status changes** (`AdminStatusControl` in `features/bookings/status-control.tsx`)
   are shared between the booking detail page (button-triggered dialog) and the admin bookings
   table (row-click-triggered, controlled dialog) via one component with an optional
   `open`/`onOpenChange` pair — avoids duplicating the transition-select-and-note UI twice.

## Verified in this environment

`pnpm install` (workspace root), `pnpm --filter @app/web typecheck`, `pnpm --filter @app/web lint`,
`pnpm --filter @app/web test` (16/16 passing), and `pnpm --filter @app/web build` were all run
against this code and pass cleanly — a full production build emits all 22 expected routes.

One real fix came out of that: `packages/shared/src/index.ts` re-exports use NodeNext-style
`./schemas/*.js` specifiers pointing at `.ts` files. `tsc` and Vitest's Bundler resolution
handle that natively, but Next.js's webpack build didn't — it 404'd on the literal `.js` path.
Fixed with a `resolve.extensionAlias` hook in `next.config.js` (webpack callback) that tells
webpack to also try `.ts`/`.tsx` for a `.js` import it can't find. This only touches
`apps/web`'s build config, not `packages/shared` itself.

## What still needs verification

This app was built against `packages/shared`'s Zod schemas and a not-yet-implemented API
(`apps/api`'s module folders were still empty when this was built, in parallel development), so
the following genuinely need a real backend to confirm — install/build/lint/test all already pass:

- **Endpoint paths**: cross-check `src/lib/endpoints.ts` against the finished `apps/api` routes
  once they exist, especially the inferred ones listed above (vendor bookings, vendor
  directory, avatar upload).
- **Response shapes for paginated lists**: this app assumes every list endpoint returns
  `{ items, page, limit, total, totalPages }`, matching `paginatedSchema()` in
  `packages/shared/src/schemas/common.schema.ts`. Confirm the API wraps responses exactly
  that way (not, say, nested under a `data` key).
- **Socket.io event names/payloads**: `src/lib/socket-client.ts` listens for
  `booking:status-changed` and `notification:new`, matching the payload shapes implied by
  `BookingStatusChangedSocketEventSchema` / `NotificationSocketEventSchema` in
  `@app/shared`, and authenticates the socket via `{ auth: { token } }`. Confirm the API's
  Socket.io server expects the token in that same place.
- **`hasSession` cookie**: confirm nothing on the API side needs to set or read this cookie —
  it's purely a client-set UX hint for `middleware.ts` and is never sent to or trusted by the
  API.
- **Avatar upload endpoint**: `POST /api/users/me/avatar` is assumed to accept a multipart
  `avatar` field and return the updated `UserDto`. Verify field name and response shape.
- **Visual QA against Penpot**: colors/fonts/spacing were transcribed directly from
  `design-tokens.ts`, not from pixel-inspecting the Penpot file itself — a side-by-side check
  once the API is serving real data would catch anything subtle (e.g. exact radius/shadow
  values on hover states).
- **End-to-end behavior against a live API**: the test suite (`StatusPill`, `LoginForm`
  validation, and a `ServicesPage` skeleton→content→empty-state smoke test, 16/16 passing) mocks
  the network layer, and the production build only proves the app compiles and prerenders —
  neither exercises a real request/response round trip. Run `pnpm dev` with `apps/api` live to
  confirm auth, bookings, services, and notifications actually work end to end.
